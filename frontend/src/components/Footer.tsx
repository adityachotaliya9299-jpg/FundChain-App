"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      marginTop: 80,
      padding: "48px 24px 32px",
      background: "var(--surface)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text)" }}>
                Fund<span style={{ color: "var(--accent)" }}>Chain</span>
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>
              Transparent, decentralized crowdfunding powered by Ethereum. No middlemen. No borders. Just ideas and people.
            </p>
            <div style={{ marginTop: 16, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>Sepolia Testnet</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Platform
            </h4>
            {[
              { label: "Browse Campaigns", href: "/" },
              { label: "Start a Campaign", href: "/create" },
              { label: "How it Works", href: "/" },
            ].map((link) => (
              <Link key={link.label} href={link.href} style={{ display: "block", color: "var(--muted)", fontSize: 14, marginBottom: 10, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Resources
            </h4>
            {[
              { label: "Etherscan", href: "https://sepolia.etherscan.io" },
              { label: "thirdweb Docs", href: "https://portal.thirdweb.com" },
              { label: "Foundry Book", href: "https://book.getfoundry.sh" },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                style={{ display: "block", color: "var(--muted)", fontSize: 14, marginBottom: 10, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>© 2026 Aditya Chotaliya. Built on Ethereum. Open source.</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Contact"].map((item) => (
              <a key={item} href="#" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}