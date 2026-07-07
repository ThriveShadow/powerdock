import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const body = await req.json();

  const {
    order_id,
    transaction_status,
    status_code,
    gross_amount,
    signature_key,
  } = body;

  // Verify signature
  const hash = crypto
    .createHash("sha512")
    .update(
      order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY
    )
    .digest("hex");

  if (hash !== signature_key) {
    return new Response("Invalid signature", { status: 403 });
  }

  // Fetch transaction
  const trx = await prisma.transaction.findUnique({
    where: { orderId: order_id },
  });

  if (!trx) return Response.json({ ok: true });

  // Update status
  await prisma.transaction.update({
    where: { orderId: order_id },
    data: { status: transaction_status },
  });

  // Credit balance ONCE
  if (
    transaction_status === "settlement" &&
    trx.creditedAt === null
  ) {
    await prisma.$transaction([
      prisma.user.update({
        where: { uid: trx.uid },
        data: { balance: { increment: trx.amount } },
      }),
      prisma.transaction.update({
        where: { orderId: order_id },
        data: { creditedAt: new Date() },
      }),
    ]);
  }

  return Response.json({ ok: true });
}
