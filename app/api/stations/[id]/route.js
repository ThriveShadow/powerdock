import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const station = await prisma.station.findUnique({
    where: { station_id: params.id },
  });

  if (!station) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(station);
}
