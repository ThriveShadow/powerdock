"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Wallet, Check, ArrowLeft } from "lucide-react";

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000];

export default function TopUpPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Load Midtrans Snap
  useEffect(() => {
    if (window.snap) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    );
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleTopUp = async () => {
    if (!user) return router.push("/login");

    const value = parseInt(amount);
    if (!value || value <= 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/topup-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          email: user.email,
          uid: user.uid,
        }),
      });

      const { token } = await res.json();

      window.snap.pay(token, {
        onSuccess: async (result) => {
          await fetch("/api/topup/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: result.order_id,
              status: result.transaction_status,
              uid: user.uid,
            }),
          });

          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1500);
        },

        onPending: () => setLoading(false),
        onError: () => setLoading(false),
        onClose: () => setLoading(false),
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  /* ---------------- SUCCESS SPLASH ---------------- */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-[#FF6F00] flex items-center justify-center">
            <Check className="text-white w-10 h-10" strokeWidth={3} />
          </div>

          <h2 className="text-xl font-bold text-[#FF6F00]">
            Top Up Successful
          </h2>

          <p className="text-sm text-gray-500">
            Updating your balance...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
      {/* Header */}
      <div className="flex justify-center py-6">
        <button
  onClick={() => router.push("/dashboard")}
  className="absolute left-6 p-2 rounded-full hover:bg-[#FFD54F]/50 transition"
>
  <ArrowLeft className="text-[#FF6F00]" />
</button>

        <img src="/logo.png" className="h-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="bg-white rounded-xl shadow px-6 py-5 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-[#FF6F00]" />
            <h1 className="text-lg font-bold text-[#FF6F00]">
              Top Up Balance
            </h1>
          </div>

          {/* Custom Amount Input */}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (IDR)"
            className="w-full border border-[#FFB300]/50 rounded-lg px-4 py-3 mb-4 text-center focus:ring-2 focus:ring-[#FFB300] outline-none"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className={`border rounded-xl py-3 font-semibold transition ${
                  parseInt(amount) === val
                    ? "bg-[#FF6F00] text-white border-[#FF6F00]"
                    : "bg-white border-[#FFB300]/50 text-gray-700"
                }`}
              >
                Rp {val.toLocaleString("id-ID")}
              </button>
            ))}
          </div>

          <button
            onClick={handleTopUp}
            disabled={!amount || loading}
            className="w-full bg-[#FF6F00] text-white py-3 rounded-lg font-semibold hover:bg-[#FFA000] transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Top Up Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
