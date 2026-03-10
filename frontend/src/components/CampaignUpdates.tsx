"use client";
import { useState } from "react";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/app/contract";

interface CampaignUpdatesProps {
  campaignId: number;
  isOwner: boolean;
}

export default function CampaignUpdates({ campaignId, isOwner }: CampaignUpdatesProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: updates, isLoading, refetch } = useReadContract({
    contract,
    method: "function getCampaignUpdates(uint256 _id) returns ((string message, uint256 timestamp, address author)[])",
    params: [BigInt(campaignId)],
  });

  const handlePost = () => {
    if (!message.trim()) return setError("Message cannot be empty.");
    if (message.length < 10) return setError("Message too short.");
    setError("");

    const tx = prepareContractCall({
      contract,
      method: "function postUpdate(uint256 _id, string _message)",
      params: [BigInt(campaignId), message],
    });

    sendTx(tx, {
      onSuccess: () => {
        setSuccess(true);
        setMessage("");
        refetch();
        setTimeout(() => setSuccess(false), 3000);
      },
      onError: (err) => setError(err.message || "Failed to post update."),
    });
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        📢 Campaign Updates
        {updates && updates.length > 0 && (
          <span style={{ background: "var(--accent-glow)", border: "1px solid rgba(249,115,22,0.3)", color: "var(--accent)", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
            {updates.length}
          </span>
        )}
      </h3>

      {/* Post update (owner only) */}
      {isOwner && account && (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <p style={{ color: "var(--text2)", fontSize: 13, fontWeight: 600, marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>
            Post an update to your backers
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Share progress, milestones reached, or any news with your backers..."
            rows={3}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              padding: "12px 14px",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              resize: "vertical",
              marginBottom: 10,
              lineHeight: 1.6,
            }}
          />
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>⚠️ {error}</p>}
          {success && <p style={{ color: "var(--green)", fontSize: 13, marginBottom: 8 }}>✅ Update posted on-chain!</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>{message.length} characters</span>
            <button
              onClick={handlePost}
              disabled={isPending || !message.trim()}
              className="btn-primary"
              style={{ padding: "9px 20px", borderRadius: 10, fontSize: 14, border: "none", cursor: isPending ? "not-allowed" : "pointer" }}
            >
              {isPending ? "⏳ Posting..." : "📢 Post Update"}
            </button>
          </div>
        </div>
      )}

      {/* Updates list */}
      {isLoading && (
        <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Loading updates...</div>
      )}

      {!isLoading && (!updates || updates.length === 0) && (
        <div style={{ textAlign: "center", padding: "28px 0", border: "1px dashed var(--border2)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No updates yet.</p>
        </div>
      )}

      {!isLoading && updates && updates.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...updates].reverse().map((update: any, i: number) => (
            <div key={i} style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "16px 18px",
              position: "relative",
            }}>
              {/* Timeline dot */}
              <div style={{
                position: "absolute",
                left: -1,
                top: 20,
                width: 4,
                height: 40,
                background: "linear-gradient(to bottom, var(--accent), transparent)",
                borderRadius: "0 4px 4px 0",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `hsl(${parseInt(update.author.slice(2, 8), 16) % 360}, 60%, 40%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "white",
                  }}>
                    {update.author.slice(2, 4).toUpperCase()}
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>
                    {update.author.slice(0, 6)}...{update.author.slice(-4)}
                  </span>
                  {i === 0 && (
                    <span className="badge badge-green" style={{ fontSize: 10, padding: "2px 8px" }}>Latest</span>
                  )}
                </div>
                <span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {formatDate(update.timestamp)}
                </span>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>{update.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}