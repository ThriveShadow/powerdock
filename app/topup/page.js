"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function TopUpPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null); // track logged-in user
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load Midtrans Snap script
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Handle Midtrans redirect after payment
  useEffect(() => {
    if (!user) return; // wait until user is loaded

    const orderId = searchParams.get("order_id");
    const transactionStatus = searchParams.get("transaction_status");

    if (orderId && transactionStatus) {
      handleConfirm(orderId, transactionStatus);
    }
  }, [searchParams, user]);

  // Confirm topup via backend
  const handleConfirm = async (orderId, status) => {
    setLoading(true);

    try {
      const res = await fetch("/api/topup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          uid: user.uid,
        }),
      });

      if (!res.ok) throw new Error("Failed to confirm topup");

      if (status === "settlement") alert("Top up successful!");
      else alert(`Payment status: ${status}`);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to update topup status. Contact support.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger Snap popup
  const handleTopUp = async () => {
    const value = parseInt(amount);
    if (!value || value <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

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
      if (!token) throw new Error("Snap token not returned");

      window.snap.pay(token, {
        onSuccess: () => router.push("/topup"),
        onPending: () =>
          alert("Payment pending. Please complete the payment."),
        onError: () => alert("Payment failed. Please try again."),
        onClose: () => console.log("Payment popup closed"),
      });
    } catch (err) {
      console.error(err);
      alert("Top up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8E1] to-[#FFE082] px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-[#FF6F00] mb-4">
          Top Up Balance
        </h1>

        <input
          type="number"
          placeholder="Enter amount (IDR)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-[#FFB300]/50 rounded-lg px-4 py-2 mb-4 text-center focus:ring-2 focus:ring-[#FFB300] outline-none"
        />

        <button
          onClick={handleTopUp}
          disabled={loading}
          className="w-full bg-[#FFB300] text-white py-2 rounded-lg font-semibold hover:bg-[#FFA000] transition disabled:opacity-60"
        >
          {loading ? "Processing..." : "Top Up Now"}
        </button>
      </div>
    </div>
  );
}
