"use client";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: number; // unix timestamp in seconds
  compact?: boolean;
}

export default function CountdownTimer({ deadline, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = deadline * 1000 - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <div style={{ color: "var(--red)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: compact ? 13 : 15 }}>
        ⏰ Campaign Ended
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{ color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>
        ⏱ {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </div>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 11, fontFamily: "'Syne', sans-serif", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        ⏱ Time Remaining
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {blocks.map(b => (
          <div key={b.label} style={{
            background: "var(--bg)", borderRadius: 10, padding: "10px 4px",
            textAlign: "center", border: "1px solid var(--border)",
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
              color: b.label === "Secs" ? "var(--accent)" : "var(--text)",
              letterSpacing: "-0.02em",
              transition: "color 0.3s",
            }}>
              {String(b.value).padStart(2, "0")}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {b.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}