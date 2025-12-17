import { prisma } from "@/lib/prisma";
import midtransClient from "midtrans-client";

export async function POST(req) {
  const { amount, email, uid } = await req.json();

  const orderId = `order-${Date.now()}`;

  // 1️⃣ Simpan transaksi PENDING
  await prisma.transaction.create({
    data: {
      orderId,
      userId: uid,
      amount: BigInt(amount),
      status: "PENDING",
    },
  });

  // 2️⃣ Create Snap token
  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  const token = await snap.createTransactionToken({
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      email,
    },
    callbacks: {
    finish: "http://localhost:3000/topup",
    },
  });

  return Response.json({ token });
}
