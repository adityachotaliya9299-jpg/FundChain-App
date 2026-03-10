"use client";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/app/contract";

interface RefundClaimProps {
  campaignId: number;
  isExpired: boolean;
  isGoalReached: boolean;
}

export default function RefundClaim({ campaignId, isExpired, isGoalReached }: RefundClaimProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const { data: refundAmount, refetch } = useReadContract({
    contract,
    method: "function getRefundAmount(address _donor, uint256 _id) returns (uint256)",
    params: [account?.address as string, BigInt(campaignId)],
  });

  const { data: canClaim } = useReadContract({
    contract,
    method: "function canClaimRefund(address _donor, uint256 _id) returns (bool)",
    params: [account?.address as string, BigInt(campaignId)],
  });

  if (!account || !isExpired || isGoalReached) return null;
  if (!refundAmount || Number(refundAmount) === 0) return null;

  const refundEth = (Number(refundAmount) / 1e18).toFixed(4);

  const handleRefund = () => {
    const tx = prepareContractCall({
      contract,
      method: "function claimRefund(uint256 _id)",
      params: [BigInt(campaignId)],
    });
    sendTx(tx, {
      onSuccess: () => { alert(`✅ Refund of ${refundEth} ETH claimed!`); refetch(); },
      onError: (err) => alert(err.message),
    });
  };

  return (
    <div style={{
      background: "rgba(248,113,113,0.06)",
      border: "1px solid rgba(248,113,113,0.25)",
      borderRadius: 16,
      padding: "20px 24px",
      marginTop: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>💸</span>
        <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--red)" }}>
          Refund Available
        </h4>
      </div>
      <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        This campaign didn't reach its goal. You can claim back your <strong style={{ color: "var(--text)" }}>{refundEth} ETH</strong>.
      </p>
      <button
        onClick={handleRefund}
        disabled={isPending || !canClaim}
        style={{
          width: "100%", padding: "12px", borderRadius: 12, fontSize: 15,
          fontFamily: "'Syne', sans-serif", fontWeight: 700,
          background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)",
          color: "var(--red)", cursor: isPending ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => !isPending && (e.currentTarget.style.background = "rgba(248,113,113,0.2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.12)")}
      >
        {isPending ? "⏳ Processing refund..." : `↩️ Claim ${refundEth} ETH Refund`}
      </button>
    </div>
  );
}