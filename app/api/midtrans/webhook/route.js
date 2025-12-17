import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const body = await req.json();

  const {
    order_id,
    transaction_status,
    payment_type,
  } = body;

  const trx = await prisma.transactions.findUnique({
    where: { orderId: order_id },
  });

  if (!trx) {
    return Response.json({ message: "Transaction not found" }, { status: 404 });
  }

  // sudah diproses → stop
  if (trx.status === "settlement") {
    return Response.json({ message: "Already processed" });
  }

  if (transaction_status === "settlement") {
    // 1️⃣ update transaksi
    await prisma.transactions.update({
      where: { orderId: order_id },
      data: {
        status: "settlement",
        paymentType: payment_type,
      },
    });

    // 2️⃣ update saldo user
    await prisma.users.update({
      where: { id: trx.userId },
      data: {
        balance: { increment: trx.amount },
      },
    });
  } else {
    await prisma.transactions.update({
      where: { orderId: order_id },
      data: { status: transaction_status },
    });
  }

  return Response.json({ received: true });
}
