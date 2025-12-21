"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { MapPin, Wallet } from "lucide-react";

export default function RentConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stationId = searchParams.get("data");

  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState(null);
  const [userID, setUserID] = useState(null);
  const [balance, setBalance] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const RENT_RATE = 5000;
  const MIN_BALANCE = 50000;

  useEffect(() => {
    if (!stationId) {
      router.replace("/dashboard");
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        setUserID(user.uid);

        // Fetch user balance
        const meRes = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const meData = await meRes.json();
        setBalance(meData.user.balance ?? 0);

        // Fetch station info
        const stationRes = await fetch(`/api/stations/${stationId}`);
        if (!stationRes.ok) throw new Error("Station not found");

        const stationData = await stationRes.json();
        setStation(stationData);
      } catch (err) {
        console.error(err);
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [stationId, router]);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!station) {
    return <div className="text-center mt-10">Station not found</div>;
  }

  const hasEnoughBalance = balance >= MIN_BALANCE;
  const canRent = hasEnoughBalance && agreed;

  const handleConfirmRent = async () => {
  if (!canRent || submitting) return;

  setSubmitting(true);
  setError(null);

  try {
    const res = await fetch(
      `https://n8n.thriveshadow.com/webhook/rent?userid=${encodeURIComponent(
        userID
      )}&stationid=${encodeURIComponent(station.station_id)}`,
      { method: "GET" }
    );

    if (!res.ok) {
      throw new Error("Failed to start rental");
    }

    router.replace("/dashboard");
  } catch (err) {
    console.error(err);
    setError("Failed to start rental. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFE082] flex flex-col items-center px-6">
      {/* Header */}
      <div className="py-6">
        <img src="/logo.png" className="h-8" />
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow w-full max-w-md overflow-hidden">
        <img
          src={station.image_url || "/placeholder.jpg"}
          alt={station.name}
          className="w-full h-40 object-cover"
        />

        <div className="p-4 space-y-4">
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="text-[#FF6F00]" />
            <h2 className="text-lg font-semibold">
              {station.name}
            </h2>
          </div>

          {/* Rate */}
          <div className="flex justify-between text-sm">
            <span>Rate</span>
            <span className="font-semibold">Rp 5.000 / hour</span>
          </div>

          {/* Balance */}
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Wallet size={16} /> Balance
            </span>
            <span
              className={`font-semibold ${
                hasEnoughBalance ? "text-green-600" : "text-red-600"
              }`}
            >
              Rp {balance.toLocaleString("id-ID")}
            </span>
          </div>

          {!hasEnoughBalance && (
            <p className="text-xs text-red-600">
              Minimum balance Rp 50.000 required to rent
            </p>
          )}

          {/* Terms & Conditions */}
<div className="bg-[#FFF3CD] border border-[#FFE082] rounded-lg p-3 text-xs space-y-2">
  <p className="font-semibold text-[#FF6F00]">
    Rental Terms
  </p>

  <ul className="list-disc pl-4 space-y-1 text-gray-700">
    <li>Rate is <b>Rp 5.000 per hour</b>, charged automatically after return.</li>
    <li>You may return the powerbank at <b>any Power Dock station</b>.</li>
    <li>Lost or damaged powerbanks will be <b>fully charged</b>.</li>
    <li>Late returns may result in <b>additional fees</b>.</li>
    <li>Your balance <b>may become negative</b> after rental.</li>
  </ul>

  <label className="flex items-start gap-2 mt-2">
    <input
      type="checkbox"
      checked={agreed}
      onChange={(e) => setAgreed(e.target.checked)}
      className="mt-1"
    />
    <span>
      I agree to the rental terms and understand the charges.
    </span>
  </label>
</div>


          {/* Confirm Button */}
          <button
  disabled={!canRent || submitting}
  onClick={handleConfirmRent}
  className={`w-full py-3 rounded-xl font-semibold transition ${
    canRent
      ? "bg-[#FF6F00] text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
>
  {submitting ? "Processing..." : "Confirm Rent"}
</button>

        </div>
      </div>
    </div>
  );
}
