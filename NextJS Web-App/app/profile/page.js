"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-800">
          Profile
        </h1>

        <p className="text-gray-600 text-sm">
          You are logged in
        </p>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
