"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Home,
  QrCode,
  User,
  MapPin,
} from "lucide-react";

function isOffline(lastSeen) {
  return Date.now() - new Date(lastSeen).getTime() > 30_000; // 30s
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [stations, setStations] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const token = await user.getIdToken();

        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        setBalance(data.user.balance ?? 0);

        const fetchStations = async () => {
        const stationRes = await fetch("/api/stations");
        const stationData = await stationRes.json();
        setStations(stationData);
      };

      fetchStations();
      } catch (err) {
        console.error(err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    });
    

    return () => unsub();
  }, [router]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  const sortedStations = [...stations].sort(
  (a, b) =>
    new Date(b.last_seen).getTime() -
    new Date(a.last_seen).getTime()
);


  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
      {/* Top */}
      <div className="flex justify-center py-6">
        <img src="/logo.png" className="h-8" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 space-y-5 flex-1 w-full oveerflow-hidden">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow px-5 py-3 w-full max-w-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wallet className="text-[#FF6F00]" />
            <div>
              <p className="text-sm">Balance</p>
              <p className="text-xl font-bold text-[#FF6F00]">
                Rp {balance.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/topup")}
            className="bg-[#FF6F00] text-white p-2 rounded-full"
          >
            <Plus />
          </button>
          {/* Banner */}
        </div>
        <div className="w-full max-w-md">
        <img src="/banner.png" alt="Map" className="w-full max-w-md rounded-xl shadow" />
        </div>
        {/* Location Cards */}
        <div className="w-full max-w-md overflow-x-auto no-scrollbar">
  <div className="flex gap-4">
    {sortedStations.map((station) => {
      const offline = isOffline(station.last_seen);
      return (
      <div
        key={station.station_id}
        className={`bg-white rounded-xl shadow overflow-hidden flex-shrink-0 w-52 cursor-pointer transition ${offline ? "opacity-50 grayscale" : ""}`}
      >
        <img
          src={station.image_url}
          alt={station.name}
          className="w-full h-32 object-cover"
        />
        <div className="p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#FF6F00]" />
            <p className="font-semibold">{station.name}</p>
          </div>
          <p className={`text-xs ${
  offline ? "text-gray-500" : "text-green-600"
}`}>
  {offline ? "Offline" : "Online"}
</p>

          {/* Powerbank availability */}
<p className="text-sm text-gray-700 mt-1">
  {station.available}/{station.total_slots} Powerbanks Available
</p>

        </div>
      </div>
      );
    })}
  </div>
</div>
      </div>

      {/* Bottom Nav */}
      <div className="flex justify-around py-3 bg-white border-t rounded-t-2xl">
        <NavItem icon={<Home />} label="Home" active />
        <NavItem icon={<QrCode />} label="Scan" onClick={() => router.push("scan")}/>
        <NavItem
          icon={<User />}
          label="Profile"
          onClick={() => router.push("/profile")}
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center ${
        active ? "text-[#FF6F00]" : "text-gray-500"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
