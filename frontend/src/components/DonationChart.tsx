"use client";
import { useMemo, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useReadContract } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";

// ── Constants (moved outside component to avoid stale closure issues) ──
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const V1_ADDRESS = "0xeA4eD8Bc483b7bEdCFbFa7A83ecB151AC12f6996"; // your legacy v1 contract
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
const ETHERSCAN_API = "https://api-sepolia.etherscan.io/api";

if (!ETHERSCAN_API_KEY && typeof window !== "undefined") {
  console.warn(
    "[DonationChart] ⚠️ NEXT_PUBLIC_ETHERSCAN_API_KEY is not set.\n" +
    "Get a free key at https://etherscan.io/myapikey and add it to .env.local\n" +
    "Requests may be rate-limited or fail without it."
  );
}

const filterMs: Record<TimeFilter, number> = {
  "1D": 24 * 3600 * 1000,
  "5D": 5 * 24 * 3600 * 1000,
  "30D": 30 * 24 * 3600 * 1000,
  "1Y": 365 * 24 * 3600 * 1000,
  ALL: Infinity,
};

const filterLabels: Record<TimeFilter, string> = {
  "1D": "Last 24h",
  "5D": "Last 5 Days",
  "30D": "Last 30 Days",
  "1Y": "Last Year",
  ALL: "All Time",
};

// ── Types ──
type TimeFilter = "1D" | "5D" | "30D" | "1Y" | "ALL";

interface TxData {
  timeStamp: string;
  value: string;
  hash: string;
}

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>
          {label}
        </p>
        <p
          style={{
            color: "#f97316",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {Number(payload[0].value).toFixed(6)} ETH
        </p>
      </div>
    );
  }
  return null;
};

// ── Main Component ──
export default function DonationChart() {
  const [filter, setFilter] = useState<TimeFilter>("ALL");
  const [txList, setTxList] = useState<TxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Contract reads ──
  const { data: campaignsV2 } = useReadContract({
    contract,
    method:
      "function getCampaigns() returns ((address owner, string title, string description, string category, uint256 target, uint256 deadline, uint256 amountCollected, string image, bool withdrawn, address[] donators, uint256[] donations)[])",
    params: [],
  });

  const { data: campaignsV1 } = useReadContract({
    contract: contractV1,
    method:
      "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
    params: [],
  });

  // ── Fetch real on-chain transactions from Etherscan ──
  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true);
      setFetchError(null);

      if (!CONTRACT_ADDRESS) {
        console.warn(
          "[DonationChart] NEXT_PUBLIC_CONTRACT_ADDRESS is not set in .env.local"
        );
        setFetchError("Contract address not configured.");
        setLoading(false);
        return;
      }

      if (!ETHERSCAN_API_KEY) {
        console.warn(
          "[DonationChart] NEXT_PUBLIC_ETHERSCAN_API_KEY is not set in .env.local"
        );
      }

      const buildUrl = (address: string) =>
        `${ETHERSCAN_API}?module=account&action=txlist` +
        `&address=${address}&startblock=0&endblock=99999999` +
        `&sort=asc&apikey=${ETHERSCAN_API_KEY}`;

      try {
        const [res1, res2] = await Promise.all([
          fetch(buildUrl(CONTRACT_ADDRESS)),
          fetch(buildUrl(V1_ADDRESS)),
        ]);

        const [data1, data2] = await Promise.all([
          res1.json(),
          res2.json(),
        ]);

        // Surface any Etherscan errors to the console
        if (data1.status !== "1") {
          console.warn("[DonationChart] V2 contract Etherscan error:", data1.message, data1.result);
        }
        if (data2.status !== "1") {
          console.warn("[DonationChart] V1 contract Etherscan error:", data2.message, data2.result);
        }

        const combined: TxData[] = [
          ...(data1.status === "1" ? data1.result : []),
          ...(data2.status === "1" ? data2.result : []),
        ];

        const withValue = combined.filter((tx) => Number(tx.value) > 0);
        console.log(`[DonationChart] Fetched ${withValue.length} donation transactions.`);
        setTxList(withValue);
      } catch (err) {
        console.error("[DonationChart] Failed to fetch transactions:", err);
        setFetchError("Failed to load on-chain data. Check console for details.");
      }

      setLoading(false);
    };

    fetchTx();
  }, []);

  // ── Build time-filtered chart data ──
  const { chartData, totalInPeriod, txCount } = useMemo(() => {
    if (!txList.length) return { chartData: [], totalInPeriod: 0, txCount: 0 };

    const now = Date.now();
    const cutoff = filter === "ALL" ? 0 : now - filterMs[filter];
    const filtered = txList.filter(
      (tx) => Number(tx.timeStamp) * 1000 >= cutoff
    );

    const bucketMap: Record<string, number> = {};
    filtered.forEach((tx) => {
      const ts = Number(tx.timeStamp) * 1000;
      const eth = Number(tx.value) / 1e18;
      let key = "";

      if (filter === "1D") {
        key = `${new Date(ts).getHours()}:00`;
      } else if (filter === "5D" || filter === "30D") {
        key = new Date(ts).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else if (filter === "1Y") {
        const d = new Date(ts);
        key = `${d.toLocaleDateString("en-US", { month: "short" })} W${Math.floor(d.getDate() / 7) + 1}`;
      } else {
        key = new Date(ts).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
      }

      bucketMap[key] = (bucketMap[key] || 0) + eth;
    });

    return {
      chartData: Object.entries(bucketMap).map(([date, raised]) => ({
        date,
        raised: Number(raised.toFixed(6)),
      })),
      totalInPeriod: filtered.reduce(
        (s, tx) => s + Number(tx.value) / 1e18,
        0
      ),
      txCount: filtered.length,
    };
  }, [txList, filter]);

  // ── Category + Top campaigns from contract data ──
  const { categoryData, topCampaigns } = useMemo(() => {
    const allCampaigns = [
      ...(campaignsV1 || []).map((c: any) => ({ ...c, category: "Legacy" })),
      ...(campaignsV2 || []),
    ];

    const catMap: Record<string, { raised: number; count: number }> = {};
    allCampaigns.forEach((c: any) => {
      const cat = c.category || "Other";
      if (!catMap[cat]) catMap[cat] = { raised: 0, count: 0 };
      catMap[cat].raised += Number(c.amountCollected || 0) / 1e18;
      catMap[cat].count++;
    });

    const categoryData = Object.entries(catMap)
      .map(([name, data]) => ({
        name,
        raised: Number(data.raised.toFixed(4)),
        count: data.count,
      }))
      .sort((a, b) => b.raised - a.raised);

    const topCampaigns = [...allCampaigns]
      .map((c: any, i: number) => ({
        name: (c.title || "Campaign").slice(0, 22),
        raised: Number(c.amountCollected || 0) / 1e18,
        target: Number(c.target || 0) / 1e18,
      }))
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 5);

    return { categoryData, topCampaigns };
  }, [campaignsV1, campaignsV2]);

  // ── Styles ──
  const chartStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "24px 28px",
    marginBottom: 24,
  };

  const filters: TimeFilter[] = ["1D", "5D", "30D", "1Y", "ALL"];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="badge badge-orange" style={{ marginBottom: 12 }}>
          CHARTS
        </div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-0.02em",
          }}
        >
          Donation <span className="gradient-text">Analytics</span>
        </h2>
      </div>

      {/* ── ETH Raised Over Time ── */}
      <div style={chartStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 4,
              }}
            >
              📈 ETH Raised Over Time
            </h3>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
              <span
                style={{
                  color: "var(--accent)",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                {totalInPeriod.toFixed(6)} ETH
              </span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                {txCount} donation{txCount !== 1 ? "s" : ""} ·{" "}
                {filterLabels[filter]}
              </span>
            </div>
          </div>

          {/* Filter buttons */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg)",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  background: filter === f ? "var(--accent)" : "transparent",
                  color: filter === f ? "white" : "var(--muted)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Chart body */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--muted)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                margin: "0 auto 10px",
                animation: "spin-slow 0.8s linear infinite",
              }}
            />
            Loading on-chain data...
          </div>
        ) : fetchError ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#f87171",
              fontSize: 13,
            }}
          >
            ⚠️ {fetchError}
          </div>
        ) : chartData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--muted)",
            }}
          >
            No donations in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b6b8a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6b8a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="raised"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#ethGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Summary stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
            marginTop: 20,
          }}
        >
          {(["1D", "30D", "1Y", "ALL"] as TimeFilter[]).map((f) => {
            const cutoff =
              f === "ALL" ? 0 : Date.now() - filterMs[f];
            const total = txList
              .filter((tx) => Number(tx.timeStamp) * 1000 >= cutoff)
              .reduce((s, tx) => s + Number(tx.value) / 1e18, 0);
            return (
              <div
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background:
                    filter === f ? "var(--accent-glow)" : "var(--bg)",
                  border: `1px solid ${
                    filter === f ? "var(--accent)" : "var(--border)"
                  }`,
                  borderRadius: 10,
                  padding: "10px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color: filter === f ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {total.toFixed(4)}
                </div>
                <div
                  style={{ color: "var(--muted)", fontSize: 10, marginTop: 2 }}
                >
                  {f === "1D" ? "24h" : f === "ALL" ? "Lifetime" : f}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ETH Raised by Category ── */}
      <div style={chartStyle}>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 20,
          }}
        >
          📊 ETH Raised by Category
        </h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b6b8a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6b8a", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="raised" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--muted)",
            }}
          >
            No data yet
          </div>
        )}
      </div>

      {/* ── Top Campaigns Progress ── */}
      <div style={chartStyle}>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 20,
          }}
        >
          🏆 Top Campaigns Progress
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {topCampaigns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "var(--muted)",
              }}
            >
              No campaign data yet
            </div>
          ) : (
            topCampaigns.map((c, i) => {
              const pct =
                c.target > 0
                  ? Math.min((c.raised / c.target) * 100, 100)
                  : 0;
              return (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text2)",
                        fontWeight: 500,
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--accent)",
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {c.raised.toFixed(4)} ETH ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--border)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
                          pct >= 100
                            ? "#4ade80"
                            : `hsl(${20 + i * 30}, 90%, 55%)`,
                        borderRadius: 99,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}