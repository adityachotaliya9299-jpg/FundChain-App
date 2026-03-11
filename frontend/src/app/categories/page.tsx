"use client";
import { useMemo, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, string> = {
  Technology: "💻",
  Education: "📚",
  Environment: "🌱",
  Healthcare: "❤️",
  Arts: "🎨",
  Community: "🤝",
  Other: "✨",
  Legacy: "🏛️",
};

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "#6366f1",
  Education: "#f59e0b",
  Environment: "#22c55e",
  Healthcare: "#ec4899",
  Arts: "#a855f7",
  Community: "#f97316",
  Other: "#64748b",
  Legacy: "#94a3b8",
};

export default function CategoriesPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: campaignsV2 } = useReadContract({
    contract,
    method: "function getCampaigns() returns ((address owner, string title, string description, string category, uint256 target, uint256 deadline, uint256 amountCollected, string image, bool withdrawn, address[] donators, uint256[] donations)[])",
    params: [],
  });

  const { data: campaignsV1 } = useReadContract({
    contract: contractV1,
    method: "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
    params: [],
  });

  const { categories, campaigns } = useMemo(() => {
    const v1 = (campaignsV1 || []).map((c: any, i: number) => ({
      ...c, category: "Legacy", _version: 1, _contractIndex: i,
      amountCollected: c.amountCollected, target: c.target,
    }));
    const v2 = (campaignsV2 || []).map((c: any, i: number) => ({
      ...c, _version: 2, _contractIndex: i,
    }));
    const all = [...v1, ...v2];

    const cats: Record<string, { count: number; raised: number; campaigns: any[] }> = {};
    all.forEach(c => {
      const cat = c.category || "Other";
      if (!cats[cat]) cats[cat] = { count: 0, raised: 0, campaigns: [] };
      cats[cat].count++;
      cats[cat].raised += Number(c.amountCollected || 0) / 1e18;
      cats[cat].campaigns.push(c);
    });

    return { categories: cats, campaigns: all };
  }, [campaignsV1, campaignsV2]);

  const filtered = selected
    ? campaigns.filter((c: any) => (c.category || "Other") === selected)
    : [];

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="badge badge-orange" style={{ marginBottom: 12 }}>BROWSE</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px,5vw,42px)", letterSpacing: "-0.03em", marginBottom: 10 }}>
          Campaign <span className="gradient-text">Categories</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 16 }}>
          Explore campaigns by category — find causes that matter to you.
        </p>
      </div>

      {/* Category grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 48 }}>
        {Object.entries(categories).map(([cat, data]) => {
          const color = CATEGORY_COLORS[cat] || "#f97316";
          const icon = CATEGORY_ICONS[cat] || "✨";
          const isActive = selected === cat;

          return (
            <button key={cat} onClick={() => setSelected(isActive ? null : cat)}
              style={{
                background: isActive ? `${color}15` : "var(--surface)",
                border: `1px solid ${isActive ? color : "var(--border)"}`,
                borderRadius: 16, padding: "20px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
                transform: isActive ? "translateY(-2px)" : "none",
                boxShadow: isActive ? `0 8px 24px ${color}20` : "none",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 6, color: isActive ? color : "var(--text)" }}>
                {cat}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>
                {data.count} campaign{data.count !== 1 ? "s" : ""}
              </div>
              <div style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                {data.raised.toFixed(4)} ETH raised
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtered campaigns */}
      {selected && (
        <div className="animate-fadeIn">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
              {CATEGORY_ICONS[selected]} {selected}
            </h2>
            <span style={{ background: "var(--accent-glow)", color: "var(--accent)", borderRadius: 99, padding: "3px 12px", fontSize: 13, fontWeight: 700 }}>
              {filtered.length} campaigns
            </span>
            <button onClick={() => setSelected(null)}
              style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border2)", borderRadius: 8, padding: "6px 12px", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}>
              ✕ Clear
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px,100%), 1fr))", gap: 20 }}>
            {filtered.map((c: any, i: number) => {
              const target = Number(c.target) / 1e18;
              const collected = Number(c.amountCollected) / 1e18;
              const pct = target > 0 ? Math.min((collected / target) * 100, 100) : 0;
              const deadline = new Date(Number(c.deadline) * 1000);
              const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
              const isExpired = deadline.getTime() < Date.now();
              const image = c.image?.startsWith("ipfs://")
                ? c.image.replace("ipfs://", "https://ipfs.io/ipfs/")
                : c.image;
              const href = `/campaign/${c._version}-${c._contractIndex}`;

              return (
                <Link key={i} href={href} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 16, overflow: "hidden",
                    transition: "all 0.2s", cursor: "pointer",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                      <img src={image || "https://placehold.co/400x160/1a1a2e/f97316?text=No+Image"}
                        alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x160/1a1a2e/f97316?text=No+Image"; }} />
                      <span style={{
                        position: "absolute", top: 10, right: 10,
                        background: isExpired ? "rgba(248,113,113,0.9)" : "rgba(249,115,22,0.9)",
                        color: "white", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                      }}>
                        {isExpired ? "Ended" : `${daysLeft}d left`}
                      </span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                        {c.title}
                      </h3>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 99, marginBottom: 10 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                          {collected.toFixed(4)} ETH
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}