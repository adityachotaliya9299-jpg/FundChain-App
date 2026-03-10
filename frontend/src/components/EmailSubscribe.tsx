"use client";
import { useState } from "react";

interface EmailSubscribeProps {
  campaignId: number;
  campaignTitle: string;
  isOwner?: boolean;
}

export default function EmailSubscribe({ campaignId, campaignTitle, isOwner }: EmailSubscribeProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Store subscriptions in localStorage (simple approach)
  const handleSubscribe = () => {
    if (!email || !email.includes("@")) return setError("Enter a valid email");
    setLoading(true);
    setError("");

    // Save to localStorage for demo
    const key = `fundchain_subs_${campaignId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem(key, JSON.stringify(existing));
    }

    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
    }, 600);
  };

  const sendTestNotification = async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "goal_reached",
          campaignTitle,
          campaignId,
          ownerEmail: email,
          amount: "0.05",
        }),
      });
      alert("✅ Test email sent!");
    } catch {
      alert("⚠️ Email service not configured. Add RESEND_API_KEY to .env.local");
    }
    setLoading(false);
  };

  if (subscribed) {
    return (
      <div style={{
        background: "rgba(74,222,128,0.06)",
        border: "1px solid rgba(74,222,128,0.2)",
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 16,
      }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--green)", marginBottom: 2 }}>
            Subscribed!
          </p>
          <p style={{ color: "var(--muted)", fontSize: 12 }}>
            You'll be notified when this campaign reaches its goal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg)",
      border: "1px solid var(--border2)",
      borderRadius: 14,
      padding: "16px 20px",
      marginTop: 16,
    }}>
      <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        🔔 Get Notified
      </p>
      <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>
        {isOwner
          ? "Enter your email to receive notifications when someone backs your campaign."
          : "Get notified when this campaign reaches its goal or posts an update."}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          placeholder="your@email.com"
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border2)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            color: "white",
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "⏳" : "Notify Me"}
        </button>
      </div>
      {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>⚠️ {error}</p>}

      {isOwner && subscribed && (
        <button onClick={sendTestNotification} disabled={loading}
          style={{ marginTop: 10, background: "none", border: "1px solid var(--border2)", borderRadius: 8, padding: "6px 12px", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
          Send test email
        </button>
      )}
    </div>
  );
}
