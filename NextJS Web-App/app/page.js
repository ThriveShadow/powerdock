"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E1] to-[#FFE082] text-gray-800 flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-3 shadow-sm bg-gradient-to-r from-[#FFD54F] to-[#FFB300] sticky top-0 z-50 text-white">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PowerDock Logo"
            className="h-8 sm:h-10 object-contain"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a href="#features" className="hover:text-yellow-200 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-yellow-200 transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-yellow-200 transition-colors">Contact</a>
          <Link
            href="/login"
            className="bg-white text-[#FFB300] px-5 py-2 rounded-full font-semibold hover:bg-yellow-100 transition"
          >
            Login / Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-[#FFE082] focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-14 left-0 w-full bg-white text-gray-800 shadow-md flex flex-col items-center gap-4 py-4 md:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="bg-[#FFB300] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#FFA000] transition"
            >
              Login / Register
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center mt-12 px-6">
        <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 text-[#FF6F00]">
          Rent. Charge. Go. ⚡
        </h2>
        <p className="text-base sm:text-lg text-gray-700 max-w-xl mb-8">
          PowerDock lets you rent powerbanks anytime, anywhere. Pick up, charge your phone, 
          and drop it off at any nearby station.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href="#get-started"
            className="bg-[#FFB300] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#FFA000] transition w-full sm:w-auto text-center"
          >
            Get Started
          </a>
          <a
            href="#learn-more"
            className="border border-[#FFB300] text-[#FFB300] px-6 py-3 rounded-full font-semibold hover:bg-[#FFF3E0] transition w-full sm:w-auto text-center"
          >
            Learn More
          </a>
        </div>

        {/* Hero Image */}
        <div className="mt-10 w-full flex justify-center">
          <div className="relative w-full max-w-md sm:max-w-2xl aspect-[3/2]">
            <img
              src="https://placecats.com/800/500"
              alt="PowerDock demo"
              className="object-cover rounded-2xl shadow-lg w-full h-full border-4 border-[#FFB300]/30"
            />
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="mt-24 px-6 max-w-5xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl font-bold mb-10 text-[#FF6F00]">
          Why Choose PowerDock?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: "https://placecats.com/200/200",
              title: "Find Stations Easily",
              desc: "Use our map to locate the nearest charging dock in seconds."
            },
            {
              icon: "https://placecats.com/201/200",
              title: "Scan & Go",
              desc: "Simply scan the QR code to rent or return your powerbank."
            },
            {
              icon: "https://placecats.com/202/200",
              title: "Affordable & Fast",
              desc: "Low hourly rates and instant charging to keep you powered up."
            }
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-[#FFF8E1] rounded-2xl shadow p-6 border border-[#FFE082]">
              <img src={icon} alt={title} width={60} height={60} className="mx-auto mb-4 rounded-lg" />
              <h4 className="font-semibold text-lg mb-2 text-[#FF6F00]">{title}</h4>
              <p className="text-gray-700 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="mt-24 bg-gradient-to-r from-[#FFB300] to-[#FF6F00] text-white py-12 text-center px-6">
        <h4 className="text-xl sm:text-2xl font-bold mb-4">Power up with PowerDock</h4>
        <p className="mb-6 text-sm sm:text-base">Join the network of users who never run out of battery.</p>
        <a
          href="#get-started"
          className="inline-block bg-white text-[#FF6F00] px-8 py-3 rounded-full font-semibold hover:bg-yellow-100 transition"
        >
          Get Started Now
        </a>
        <p className="mt-8 text-xs sm:text-sm text-yellow-100">© 2025 PowerDock. All rights reserved.</p>
      </footer>
    </div>
  );
}
