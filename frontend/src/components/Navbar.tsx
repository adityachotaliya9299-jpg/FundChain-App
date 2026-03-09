"use client";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/app/client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between " style={{ height: 64 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--accent)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              marginLeft: 9,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            Fund<span style={{ color: "var(--accent)" }}>Chain</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            style={{ color: "var(--muted)", fontSize: 14, fontWeight: 500 }}
            className="hover:text-white transition-colors"
          >
            Campaigns
          </Link>
          <Link
            href="/create"
            style={{ color: "var(--muted)", fontSize: 14, fontWeight: 500 }}
            className="hover:text-white transition-colors"
          >
            Start a Campaign
          </Link>
        </div>

        {/* Connect Button */}
        <ConnectButton
          client={client}
          connectButton={{
            label: "Connect Wallet",
            style: {
              background: "var(--accent)",
              color: "white",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 10,
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            },
          }}
        />
      </div>
    </nav>
  );
}