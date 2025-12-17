import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { uid, orderId, status } = await req.json();

    if (!uid || !orderId || !status)
      return new Response("Missing parameters", { status: 400 });

    // Update transaction
    await prisma.transaction.update({
      where: { orderId },
      data: { status },
    });

    // Only increment balance if settled
    if (status === "settlement") {
      const tx = await prisma.transaction.findUnique({ where: { orderId } });
      await prisma.user.update({
        where: { id: uid },
        data: { balance: { increment: tx.amount } },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("TOPUP CONFIRM ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
