import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { token, name, phone } = await req.json();

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    await prisma.user.update({
      where: { id: uid },
      data: {
        name,
        phone,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ONBOARDING ERROR:", err);
    return NextResponse.json(
      { error: "Onboarding failed" },
      { status: 500 }
    );
  }
}
