"use client";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/app/contract";
import { useMemo } from "react";

type Campaign = {
  owner: string;
  title: string;
  target: bigint;
  deadline: bigint;
  amountCollected: bigint;
  donators: string[];
  donations: bigint[];
  category: string;
};

function MiniBar({ value, max, color = "var(--accent)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
    </div>
  );
}

function StatBox({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", color: "var(--accent)" }}>{value}</div>
      <div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method: "function getCampaigns() returns ((address,string,string,string,uint256,uint256,uint256,string,bool,bool,address[],uint256[],uint256[])[])",
    params: [],
  });

  const stats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;

    const totalRaised = campaigns.reduce((acc: number, c: any) => acc + Number(c[6]) / 1e18, 0);
    const totalBackers = campaigns.reduce((acc: number, c: any) => acc + c[10].length, 0);
    const active = campaigns.filter((c: any) => Number(c[5]) * 1000 > Date.now()).length;
    const funded = campaigns.filter((c: any) => Number(c[6]) >= Number(c[4])).length;
    const avgGoal = campaigns.reduce((acc: number, c: any) => acc + Number(c[4]) / 1e18, 0) / campaigns.length;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    campaigns.forEach((c: any) => {
      const cat = c[3] || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    // Top campaigns by raised
    const sorted = [...campaigns]
      .map((c: any, i: number) => ({
        title: c[1],
        raised: Number(c[6]) / 1e18,
        target: Number(c[4]) / 1e18,
        backers: c[10].length,
        index: i,
      }))
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 5);

    const maxRaised = sorted[0]?.raised || 1;

    return { totalRaised, totalBackers, active, funded, avgGoal, categoryMap, sorted, maxRaised, total: campaigns.length };
  }, [campaigns]);

  if (isLoading) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>Loading analytics...</div>
  );

  if (!stats) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>No data yet. Create a campaign first!</div>
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="badge badge-orange" style={{ marginBottom: 12 }}>ANALYTICS</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em" }}>
          Platform <span className="gradient-text">Insights</span>
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>Real-time data from the Ethereum blockchain.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 36 }}>
        <StatBox icon="📋" label="Total Campaigns" value={String(stats.total)} />
        <StatBox icon="💰" label="Total Raised" value={`${stats.totalRaised.toFixed(4)} ETH`} sub={`≈ $${(stats.totalRaised * 3500).toLocaleString()}`} />
        <StatBox icon="👥" label="Total Backers" value={String(stats.totalBackers)} />
        <StatBox icon="⚡" label="Active Now" value={String(stats.active)} sub={`${stats.funded} fully funded`} />
        <StatBox icon="🎯" label="Avg Goal" value={`${stats.avgGoal.toFixed(3)} ETH`} />
        <StatBox icon="✅" label="Success Rate" value={`${stats.total > 0 ? Math.round((stats.funded / stats.total) * 100) : 0}%`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Top campaigns */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            🏆 Top Campaigns by Raised
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {stats.sorted.map((c, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i + 1}. {c.title}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    {c.raised.toFixed(4)} ETH
                  </span>
                </div>
                <MiniBar value={c.raised} max={stats.maxRaised} color={i === 0 ? "#f97316" : i === 1 ? "#fb923c" : "#fbbf24"} />
                <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>{c.backers} backers • goal: {c.target.toFixed(3)} ETH</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            📊 Campaigns by Category
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(stats.categoryMap)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                      {count} campaign{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <MiniBar value={count} max={Math.max(...Object.values(stats.categoryMap))} color="#8b5cf6" />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Funding progress overview */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
          📈 All Campaigns — Funding Progress
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stats.sorted.map((c, i) => {
            const pct = c.target > 0 ? Math.min((c.raised / c.target) * 100, 100) : 0;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, marginBottom: 6 }}>{c.title}</div>
                  <MiniBar value={pct} max={100} color={pct >= 100 ? "#4ade80" : pct >= 50 ? "#f97316" : "#6b6b8a"} />
                </div>
                <div style={{ textAlign: "right", fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: pct >= 100 ? "var(--green)" : "var(--accent)" }}>
                  {pct.toFixed(0)}%
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
                  {c.raised.toFixed(4)} / {c.target.toFixed(3)} ETH
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}