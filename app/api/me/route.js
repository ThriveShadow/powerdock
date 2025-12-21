import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeUser = {
      ...user,
      balance: Number(user.balance), // ← PENTING
    };

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("ME API ERROR:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
