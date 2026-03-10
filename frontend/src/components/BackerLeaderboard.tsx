"use client";
import { useMemo } from "react";
import { useReadContract } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";
import Link from "next/link";

interface LeaderboardEntry {
  address: string;
  totalDonated: number;
  campaignCount: number;
  rank: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>;
  return <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "var(--muted)", minWidth: 24, textAlign: "center" }}>#{rank}</span>;
}

function AddressAvatar({ address }: { address: string }) {
  const hue = parseInt(address.slice(2, 8), 16) % 360;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue}, 60%, 35%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "white",
      border: "2px solid rgba(255,255,255,0.1)",
    }}>
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

interface BackerLeaderboardProps {
  campaignId?: number; // if provided, show only for this campaign
  maxEntries?: number;
}

export default function BackerLeaderboard({ campaignId, maxEntries = 10 }: BackerLeaderboardProps) {
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

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    const allCampaigns = [
      ...(campaignsV1 || []),
      ...(campaignsV2 || []),
    ];

    const donorMap: Record<string, { total: number; campaigns: Set<number> }> = {};

    allCampaigns.forEach((campaign: any, cIdx: number) => {
      // Skip if filtering by campaignId
      if (campaignId !== undefined && cIdx !== campaignId) return;

      const donators = campaign.donators || [];
      const donations = campaign.donations || [];

      donators.forEach((addr: string, i: number) => {
        const key = addr.toLowerCase();
        if (!donorMap[key]) donorMap[key] = { total: 0, campaigns: new Set() };
        donorMap[key].total += Number(donations[i] || 0);
        donorMap[key].campaigns.add(cIdx);
      });
    });

    return Object.entries(donorMap)
      .map(([address, data]) => ({
        address,
        totalDonated: data.total / 1e18,
        campaignCount: data.campaigns.size,
        rank: 0,
      }))
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, maxEntries)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }, [campaignsV1, campaignsV2, campaignId, maxEntries]);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
          🏆 Top <span className="gradient-text">Backers</span>
        </h3>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>All time</span>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No backers yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {leaderboard.map((entry, i) => (
            <div key={entry.address} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 0",
              borderBottom: i < leaderboard.length - 1 ? "1px solid var(--border)" : "none",
              background: entry.rank <= 3 ? `rgba(249,115,22,${0.04 - entry.rank * 0.01})` : "transparent",
              borderRadius: entry.rank <= 3 ? 10 : 0,
              paddingLeft: entry.rank <= 3 ? 8 : 0,
            }}>
              {/* Rank */}
              <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                <RankBadge rank={entry.rank} />
              </div>

              {/* Avatar */}
              <AddressAvatar address={entry.address} />

              {/* Address + stats */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={`https://sepolia.etherscan.io/address/${entry.address}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text2)", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}>
                  {entry.address.slice(0, 8)}...{entry.address.slice(-6)} ↗
                </a>
                <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                  {entry.campaignCount} campaign{entry.campaignCount !== 1 ? "s" : ""} backed
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: entry.rank === 1 ? "#f97316" : entry.rank === 2 ? "#94a3b8" : entry.rank === 3 ? "#cd7f32" : "var(--text)" }}>
                  {entry.totalDonated.toFixed(4)}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>ETH</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          💎 Donate more to climb the leaderboard and earn NFT badges!
        </p>
      </div>
    </div>
  );
}
