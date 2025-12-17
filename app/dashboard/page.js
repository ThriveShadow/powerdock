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
  Clock,
  Ticket,
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
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

  // Example locations
  const locations = [
  { name: "Binus Syahdan", img: "/syahdan.jpg", distance: "30m" },
  { name: "Binus Anggrek", img: "/anggrek.jpg", distance: "150m" },
  { name: "Station C", img: "https://placecats.com/202/150", distance: "1.2km" },
  { name: "Station D", img: "https://placecats.com/203/150", distance: "450m" },
  { name: "Station E", img: "https://placecats.com/204/150", distance: "2.1km" },
];


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
      {/* Top */}
      <div className="flex justify-center py-6">
        <img src="/logo.png" className="h-8" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 space-y-5 flex-1 w-full">
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
        </div>

        {/* Horizontal Scrollable Location Cards */}
        <div className="w-full max-w-md overflow-x-auto">
  <div className="flex gap-4">
    {locations.map((loc, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl shadow overflow-hidden flex-shrink-0 w-52 cursor-pointer"
      >
        <img
          src={loc.img}
          alt={loc.name}
          className="w-full h-32 object-cover"
        />
        <div className="p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#FF6F00]" />
            <p className="font-semibold">{loc.name}</p>
          </div>
          <p className="text-sm text-gray-500">{loc.distance}</p>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* Other Buttons */}
        <DashboardButton icon={<Clock />} label="History" />
        <DashboardButton icon={<Ticket />} label="Coupons" />
      </div>

      {/* Bottom Nav */}
      <div className="flex justify-around py-3 bg-white border-t rounded-t-2xl">
        <NavItem icon={<Home />} label="Home" active />
        <NavItem icon={<QrCode />} label="Scan" />
        <NavItem
          icon={<User />}
          label="Profile"
          onClick={() => router.push("/profile")}
        />
      </div>
    </div>
  );
}

function DashboardButton({ icon, label }) {
  return (
    <button className="w-full max-w-md bg-[#FFD54F] rounded-xl px-5 py-3 flex gap-3 shadow">
      {icon}
      {label}
    </button>
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
