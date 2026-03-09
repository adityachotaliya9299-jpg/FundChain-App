"use client";
import { useState } from "react";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { contract } from "@/app/contract";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const [donationAmount, setDonationAmount] = useState("0.01");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");

  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method:
      "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations, bool withdrawn)[])",
    params: [],
  });

  const campaign = campaigns?.[id];

  const handleDonate = () => {
    if (!account) return setTxError("Please connect your wallet.");
    if (!donationAmount || Number(donationAmount) <= 0) return setTxError("Enter a valid amount.");
    setTxError("");

    const tx = prepareContractCall({
      contract,
      method: "function donateToCampaign(uint256 _id) payable",
      params: [BigInt(id)],
      value: toWei(donationAmount),
    });

    sendTx(tx, {
      onSuccess: () => setTxSuccess(true),
      onError: (err) => setTxError(err.message || "Transaction failed."),
    });
  };

  const handleWithdraw = () => {
    const tx = prepareContractCall({
      contract,
      method: "function withdrawFunds(uint256 _id)",
      params: [BigInt(id)],
    });
    sendTx(tx, {
      onSuccess: () => alert("Funds withdrawn successfully!"),
      onError: (err) => setTxError(err.message),
    });
  };

  if (isLoading) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: 16 }}>Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 20 }}>Campaign not found.</p>
        <Link href="/">
          <button className="btn-primary" style={{ padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15 }}>
            ← Back to Campaigns
          </button>
        </Link>
      </div>
    );
  }

  const target = Number(campaign.target) / 1e18;
  const collected = Number(campaign.amountCollected) / 1e18;
  const progress = Math.min((collected / target) * 100, 100);
  const deadline = new Date(Number(campaign.deadline) * 1000);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpired = deadline.getTime() < Date.now();
  const isOwner = account?.address?.toLowerCase() === campaign.owner?.toLowerCase();
  const canWithdraw = isOwner && collected >= target && !campaign.withdrawn;

  return (
    <div className="animate-fadeUp" style={{ paddingTop: 10 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        style={{
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 16px",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 14,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← All Campaigns
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* LEFT — Campaign info */}
        <div>
          {/* Image */}
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 28, height: 360 }}>
            <img
              src={campaign.image || "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800"}
              alt={campaign.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800";
              }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: "-0.03em",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            {campaign.title}
          </h1>

          {/* Owner */}
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            by{" "}
            <span style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: 13 }}>
              {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
            </span>
          </p>

          {/* Description */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 24,
              marginBottom: 28,
            }}
          >
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 12, fontSize: 16 }}>
              About this campaign
            </h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 15 }}>{campaign.description}</p>
          </div>

          {/* Donators */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
              Backers ({campaign.donators.length})
            </h3>
            {campaign.donators.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No backers yet — be the first!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {campaign.donators.map((addr: string, i: number) => (
                  <div key={i} className="flex justify-between items-center"
                    style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>
                      {addr.slice(0, 8)}...{addr.slice(-6)}
                    </span>
                    <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: 14 }}>
                      {(Number(campaign.donations[i]) / 1e18).toFixed(4)} ETH
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Donate panel */}
        <div style={{ position: "sticky", top: 100 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 28,
            }}
          >
            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22 }}>
                  {collected.toFixed(4)} ETH
                </span>
                <span style={{ color: "var(--muted)", fontSize: 14, alignSelf: "flex-end" }}>
                  of {target.toFixed(4)} ETH
                </span>
              </div>
              <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div className="progress-bar" style={{ height: "100%", width: `${progress}%`, borderRadius: 99 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{progress.toFixed(1)}% funded</span>
                <span
                  style={{
                    color: isExpired ? "#ef4444" : "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {isExpired ? "Campaign ended" : `${daysLeft} days left`}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: "Backers", value: campaign.donators.length },
                { label: "Days Left", value: daysLeft },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "var(--bg)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22 }}>
                    {stat.value}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Donation input */}
            {!isExpired && (
              <>
                {txSuccess ? (
                  <div
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      color: "#4ade80",
                      fontSize: 14,
                      textAlign: "center",
                      marginBottom: 16,
                    }}
                  >
                    ✅ Thank you for your support!
                  </div>
                ) : (
                  <>
                    <label style={{ display: "block", color: "var(--muted)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Donation Amount (ETH)
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      min="0.001"
                      step="0.001"
                      style={{
                        width: "100%",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        color: "var(--text)",
                        fontSize: 15,
                        fontFamily: "'DM Sans', sans-serif",
                        outline: "none",
                        marginBottom: 12,
                      }}
                    />

                    {/* Quick amounts */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {["0.01", "0.05", "0.1", "0.5"].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setDonationAmount(amt)}
                          style={{
                            flex: 1,
                            background: donationAmount === amt ? "var(--accent)" : "var(--bg)",
                            border: `1px solid ${donationAmount === amt ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: 8,
                            padding: "8px 0",
                            color: donationAmount === amt ? "white" : "var(--muted)",
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>

                    {txError && (
                      <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>⚠️ {txError}</p>
                    )}

                    <button
                      onClick={handleDonate}
                      disabled={isPending || !account}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: 12,
                        fontSize: 16,
                        border: "none",
                        cursor: isPending || !account ? "not-allowed" : "pointer",
                      }}
                    >
                      {!account ? "Connect Wallet" : isPending ? "⏳ Processing..." : `Fund ${donationAmount} ETH`}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Withdraw button for owner */}
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={isPending}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "14px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.4)",
                  color: "#4ade80",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Withdraw Funds
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}