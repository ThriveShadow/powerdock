import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { token } = await req.json();

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email ?? null;

    const user = await prisma.user.upsert({
      where: { id: uid },
      update: {
        email,
      },
      create: {
        id: uid,
        email,
        balance: 0,
      },
    });

    return NextResponse.json({
      needsOnboarding: !user.name,
    });
  } catch (err) {
    console.error("AUTH SYNC ERROR:", err);
    return NextResponse.json(
      { error: "Auth sync failed" },
      { status: 500 }
    );
  }
}
