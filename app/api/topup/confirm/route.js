import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { orderId, status, uid } = await req.json();

  const trx = await prisma.transaction.findUnique({
    where: { orderId },
  });

  if (!trx) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Update status
  await prisma.transaction.update({
    where: { orderId },
    data: { status },
  });

  // Credit balance ONLY ONCE
  if (status === "settlement" || status === "capture" && !trx.creditedAt) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: uid },
        data: { balance: { increment: trx.amount } },
      }),
      prisma.transaction.update({
        where: { orderId },
        data: { creditedAt: new Date() },
      }),
    ]);
  }

  return Response.json({ ok: true });
}
