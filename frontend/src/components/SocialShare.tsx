"use client";
import { useState } from "react";

interface SocialShareProps {
  title: string;
  description: string;
  raised: number;
  target: number;
  campaignId: string;
}

export default function SocialShare({ title, description, raised, target, campaignId }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/campaign/${campaignId}`
    : "";

  const progress = Math.min((raised / target) * 100, 100).toFixed(0);
  const shortDesc = description.slice(0, 100) + (description.length > 100 ? "..." : "");

  const twitterText = encodeURIComponent(
    `🚀 "${title}" — ${progress}% funded on FundChain!\n\n${shortDesc}\n\nBack this campaign on Ethereum 👇\n${url}\n\n#Web3 #DeFi #Crowdfunding #Ethereum`
  );

  const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(shortDesc)}`;

  const whatsappText = encodeURIComponent(
    `🚀 *${title}* — ${progress}% funded!\n\n${shortDesc}\n\nBack it on Ethereum: ${url}`
  );

  const telegramText = encodeURIComponent(
    `🚀 ${title} — ${progress}% funded on FundChain! Back it here: ${url}`
  );

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareButtons = [
    {
      label: "Twitter / X",
      icon: "𝕏",
      color: "#000",
      bg: "rgba(0,0,0,0.8)",
      href: `https://twitter.com/intent/tweet?text=${twitterText}`,
    },
    {
      label: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      bg: "rgba(37,211,102,0.1)",
      href: `https://wa.me/?text=${whatsappText}`,
    },
    {
      label: "Telegram",
      icon: "✈️",
      color: "#2AABEE",
      bg: "rgba(42,171,238,0.1)",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${telegramText}`,
    },
    {
      label: "LinkedIn",
      icon: "in",
      color: "#0A66C2",
      bg: "rgba(10,102,194,0.1)",
      href: linkedinUrl,
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border2)",
          borderRadius: 10,
          padding: "9px 16px",
          color: "var(--text2)",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}
      >
        🔗 Share
      </button>

      {showPanel && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          zIndex: 100,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 16,
          width: 280,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12, color: "var(--text2)" }}>
            Share this campaign
          </p>

          {/* Campaign preview card */}
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
              {title.slice(0, 40)}{title.length > 40 ? "..." : ""}
            </p>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 99, marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 99 }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              {progress}% funded • {raised.toFixed(4)} ETH raised
            </p>
          </div>

          {/* Share buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {shareButtons.map(btn => (
              <a key={btn.label} href={btn.href} target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px", borderRadius: 10,
                  background: btn.bg, border: `1px solid ${btn.color}33`,
                  color: btn.color, textDecoration: "none",
                  fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  transition: "all 0.2s",
                }}>
                <span style={{ fontSize: 14 }}>{btn.icon}</span>
                {btn.label}
              </a>
            ))}
          </div>

          {/* Copy link */}
          <button onClick={copyLink} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: copied ? "rgba(74,222,128,0.1)" : "var(--bg)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "var(--border2)"}`,
            color: copied ? "var(--green)" : "var(--text2)",
            fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {copied ? "✅ Link Copied!" : "🔗 Copy Campaign Link"}
          </button>
        </div>
      )}

      {/* Backdrop */}
      {showPanel && (
        <div onClick={() => setShowPanel(false)}
          style={{ position: "fixed", inset: 0, zIndex: 99 }} />
      )}
    </div>
  );
}
