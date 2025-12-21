import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stations = await prisma.station.findMany({
    select: {
      station_id: true,
      name: true,
      image_url: true,
      latitude: true,
      longitude: true,
      last_seen: true,
      powerbank_docked: true,
    },
  });

  // Tambahkan available / total_slots
  const stationsWithAvailability = stations.map((station) => ({
    ...station,
    available: station.powerbank_docked.length,
    total_slots: 6, // default 6, bisa diganti sesuai DB
  }));

  return NextResponse.json(stationsWithAvailability);
}
