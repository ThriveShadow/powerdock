import midtransClient from "midtrans-client";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { amount, email, uid } = await req.json();

  const orderId = `TOPUP-${Date.now()}`;

  // Create transaction (PENDING)
  await prisma.transaction.create({
    data: {
      orderId,
      amount,
      status: "pending",
      user: {
        connect: { id: uid },
      },
    },
  });

  // Create Snap token
  const snap = new midtransClient.Snap({
    isProduction: false, // sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  const snapRes = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      email,
    },
  });

  return Response.json({ token: snapRes.token });
}
