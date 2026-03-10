"use client";
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { useReadContract } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>
            {p.value.toFixed(4)} ETH
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DonationChartProps {
  campaignId?: number; // if undefined, show platform-wide
}

export default function DonationChart({ campaignId }: DonationChartProps) {
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

  // Build chart data from campaigns
  const { timelineData, categoryData, topCampaigns } = useMemo(() => {
    const allCampaigns = [
      ...(campaignsV1 || []).map((c: any) => ({ ...c, category: "Legacy" })),
      ...(campaignsV2 || []),
    ];

    if (allCampaigns.length === 0) return { timelineData: [], categoryData: [], topCampaigns: [] };

    // Group campaigns by creation month (using deadline as proxy)
    const monthMap: Record<string, number> = {};
    allCampaigns.forEach((c: any, i: number) => {
      if (campaignId !== undefined && i !== campaignId) return;
      const deadline = new Date(Number(c.deadline || 0) * 1000);
      const month = deadline.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap[month] = (monthMap[month] || 0) + Number(c.amountCollected || 0) / 1e18;
    });

    const timelineData = Object.entries(monthMap)
      .map(([month, raised]) => ({ month, raised: Number(raised.toFixed(4)) }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Category breakdown
    const catMap: Record<string, { raised: number; count: number }> = {};
    allCampaigns.forEach((c: any) => {
      const cat = c.category || "Other";
      if (!catMap[cat]) catMap[cat] = { raised: 0, count: 0 };
      catMap[cat].raised += Number(c.amountCollected || 0) / 1e18;
      catMap[cat].count++;
    });

    const categoryData = Object.entries(catMap)
      .map(([name, data]) => ({ name, raised: Number(data.raised.toFixed(4)), count: data.count }))
      .sort((a, b) => b.raised - a.raised);

    // Top campaigns
    const topCampaigns = [...allCampaigns]
      .map((c: any, i: number) => ({
        name: (c.title || "Campaign").slice(0, 20),
        raised: Number(c.amountCollected || 0) / 1e18,
        target: Number(c.target || 0) / 1e18,
        index: i,
      }))
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 5);

    return { timelineData, categoryData, topCampaigns };
  }, [campaignsV1, campaignsV2, campaignId]);

  const chartStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "24px 28px",
    marginBottom: 24,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="badge badge-orange" style={{ marginBottom: 12 }}>CHARTS</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>
          Donation <span className="gradient-text">Analytics</span>
        </h2>
      </div>

      {/* Timeline chart */}
      <div style={chartStyle}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          📈 ETH Raised Over Time
        </h3>
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="raisedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#6b6b8a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b8a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="raised" stroke="#f97316" strokeWidth={2} fill="url(#raisedGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>No data yet</div>
        )}
      </div>

      {/* Category bar chart */}
      <div style={chartStyle}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          📊 ETH Raised by Category
        </h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#6b6b8a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b8a", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="raised" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>No data yet</div>
        )}
      </div>

      {/* Top campaigns progress */}
      <div style={chartStyle}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
          🏆 Top Campaigns Progress
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {topCampaigns.map((c, i) => {
            const pct = c.target > 0 ? Math.min((c.raised / c.target) * 100, 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    {c.raised.toFixed(4)} ETH ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: pct >= 100 ? "#4ade80" : `hsl(${20 + i * 30}, 90%, 55%)`,
                    borderRadius: 99, transition: "width 1s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
