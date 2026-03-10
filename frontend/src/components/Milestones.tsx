"use client";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/app/contract";

interface MilestonesProps {
  campaignId: number;
  amountCollected: number;
  isOwner: boolean;
}

export default function Milestones({ campaignId, amountCollected, isOwner }: MilestonesProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const { data: milestones, isLoading, refetch } = useReadContract({
    contract,
    method: "function getCampaignMilestones(uint256 _id) returns ((string title, uint256 targetAmount, bool released)[])",
    params: [BigInt(campaignId)],
  });

  const handleRelease = (milestoneIndex: number) => {
    const tx = prepareContractCall({
      contract,
      method: "function releaseMilestone(uint256 _id, uint256 _milestoneIndex)",
      params: [BigInt(campaignId), BigInt(milestoneIndex)],
    });
    sendTx(tx, {
      onSuccess: () => refetch(),
      onError: (err) => alert(err.message),
    });
  };

  if (isLoading) return null;
  if (!milestones || milestones.length === 0) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px", marginTop: 20 }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
        🎯 Campaign Milestones
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {milestones.map((m: any, i: number) => {
          const targetEth = Number(m.targetAmount) / 1e18;
          const isReached = amountCollected >= targetEth;
          const canRelease = isOwner && isReached && !m.released;

          return (
            <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: i < milestones.length - 1 ? "1px solid var(--border)" : "none" }}>
              {/* Status icon */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: m.released ? "rgba(74,222,128,0.15)" : isReached ? "rgba(249,115,22,0.15)" : "var(--bg)",
                border: `2px solid ${m.released ? "var(--green)" : isReached ? "var(--accent)" : "var(--border2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>
                {m.released ? "✓" : isReached ? "🔓" : "🔒"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: m.released ? "var(--green)" : "var(--text)" }}>
                      {m.title}
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                      Unlock at {targetEth.toFixed(3)} ETH raised
                    </p>
                  </div>
                  {m.released && (
                    <span className="badge badge-green">Released ✓</span>
                  )}
                  {canRelease && (
                    <button
                      onClick={() => handleRelease(i)}
                      disabled={isPending}
                      style={{
                        background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                        color: "var(--green)", borderRadius: 10, padding: "7px 14px",
                        fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {isPending ? "⏳" : "💰 Release Funds"}
                    </button>
                  )}
                </div>

                {/* Progress bar for this milestone */}
                <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((amountCollected / targetEth) * 100, 100)}%`,
                    background: m.released ? "var(--green)" : "linear-gradient(90deg, #f97316, #fb923c)",
                    borderRadius: 99,
                    transition: "width 1s ease",
                  }} />
                </div>
                <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>
                  {Math.min(amountCollected / targetEth * 100, 100).toFixed(0)}% toward this milestone
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}