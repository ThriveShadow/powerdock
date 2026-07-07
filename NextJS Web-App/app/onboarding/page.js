"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidPhone = (number) => /^[0-9]{7,15}$/.test(number);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Please enter a valid phone number (7–15 digits).");
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const fullPhone = `${countryCode}${phone}`;

      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: fullPhone,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
      <img
        src="/logo.png"
        alt="PowerDock Logo"
        className="h-12 sm:h-16 mb-6 object-contain"
      />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#FFE082] p-6">
        <h1 className="text-2xl font-bold text-center text-[#FF6F00] mb-6">
          Complete Your Profile
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="p-2 border border-[#FFE082] rounded-lg focus:ring focus:ring-[#FFB300]/50 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="p-2 border border-[#FFE082] rounded-lg bg-white w-[85px]"
            >
              <option value="+62">🇮🇩 +62</option>
              <option value="+60">🇲🇾 +60</option>
              <option value="+65">🇸🇬 +65</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+81">🇯🇵 +81</option>
            </select>

            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
              required
              className="p-2 border border-[#FFE082] rounded-lg flex-1 focus:ring focus:ring-[#FFB300]/50 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#FFB300] text-white py-2 rounded-lg font-semibold hover:bg-[#FFA000] transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-500 mt-8">
        © 2025 PowerDock — Rent. Charge. Go.
      </p>
    </div>
  );
}
