"use client";
import { useState } from "react";
import {
  useReadContract,
  useSendTransaction,
  useActiveAccount,
} from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { contract, contractV1 } from "@/app/contract";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CampaignUpdates from "@/components/CampaignUpdates";
import Milestones from "@/components/Milestones";
import DAOVoting from "@/components/DAOVoting";
import MultiTokenDonate from "@/components/MultiTokenDonate";
import RefundClaim from "@/components/RefundClaim";

function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: 10,
        padding: "9px 16px",
        color: "var(--text2)",
        fontSize: 13,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border2)";
        e.currentTarget.style.color = "var(--text2)";
      }}
    >
      {copied ? "✓ Copied!" : "🔗 Share"}
    </button>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = String(params.id);
  const version = rawId.startsWith("1-") ? 1 : 2;
  const id = Number(rawId.split("-")[1]);
  const account = useActiveAccount();
  
  const activeContract = version === 1 ? contractV1 : contract;
  const donorAddress = account?.address || "0x0000000000000000000000000000000000000000";
const { data: donorAmount } = useReadContract({
  contract: activeContract,
  method: "function getRefundAmount(address,uint256) returns (uint256)",
  params: [donorAddress as `0x${string}`, BigInt(id)],
});

  const { mutate: sendTx, isPending } = useSendTransaction();

  const [donationAmount, setDonationAmount] = useState("0.01");
  const [customAmount, setCustomAmount] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");
  const [activeTab, setActiveTab] = useState<"about" | "backers">("about");

  const {
    data: campaigns,
    isLoading,
    refetch,
  } = useReadContract({
    contract: activeContract,
    method:
      version === 1
        ? "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])"
        : "function getCampaigns() returns ((address owner, string title, string description, string category, uint256 target, uint256 deadline, uint256 amountCollected, string image, bool withdrawn, address[] donators, uint256[] donations)[])",
    params: [],
  });

  const campaign = campaigns?.[id];

  const handleDonate = () => {
    if (!account) return setTxError("Please connect your wallet first.");
    if (!donationAmount || Number(donationAmount) <= 0)
      return setTxError("Enter a valid amount.");
    setTxError("");
    const tx = prepareContractCall({
      contract: activeContract,
      method: "function donateToCampaign(uint256 _id) payable",
      params: [BigInt(id)],
      value: toWei(donationAmount),
    });
    sendTx(tx, {
      onSuccess: () => {
        setTxSuccess(true);
        refetch();
      },
      onError: (err) => setTxError(err.message || "Transaction failed."),
    });
  };

  const handleWithdraw = () => {
    const tx = prepareContractCall({
      contract: activeContract,
      method: "function withdrawFunds(uint256 _id)",
      params: [BigInt(id)],
    });
    sendTx(tx, {
      onSuccess: () => {
        alert("✅ Funds withdrawn successfully!");
        refetch();
      },
      onError: (err) => setTxError(err.message),
    });
  };

  if (isLoading)
    return (
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin-slow 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--muted)" }}>Loading campaign...</p>
      </div>
    );

  if (!campaign)
    return (
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 10,
          }}
        >
          Campaign not found
        </h3>
        <p style={{ color: "var(--muted)", marginBottom: 28 }}>
          This campaign may have been removed or the ID is invalid.
        </p>
        <Link
          href="/"
          className="btn-primary"
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            textDecoration: "none",
            display: "inline-block",
            fontSize: 15,
          }}
        >
          ← Back to Campaigns
        </Link>
      </div>
    );

  const target = Number(campaign.target) / 1e18;
  const collected = Number(campaign.amountCollected) / 1e18;
  const progress = Math.min((collected / target) * 100, 100);
  const deadline = new Date(Number(campaign.deadline) * 1000);
  const daysLeft = Math.max(
    0,
    Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const isExpired = deadline.getTime() < Date.now();
  const isOwner =
    account?.address?.toLowerCase() === campaign.owner?.toLowerCase();
  const isGoalReached = collected >= target;
  const canWithdraw =
    isOwner &&
    isGoalReached &&
    !((campaign as any).withdrawn ?? false) &&
    !isExpired;

  const quickAmounts = ["0.005", "0.01", "0.05", "0.1"];

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 80 }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          Campaigns
        </Link>
        <span>›</span>
        <span style={{ color: "var(--text2)" }}>
          {campaign.title.slice(0, 40)}
          {campaign.title.length > 40 ? "..." : ""}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 36,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          {/* Hero image */}
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 28,
              height: 380,
              position: "relative",
            }}
          >
            <img
              src={campaign.image || `https://picsum.photos/seed/${id}/800/500`}
              alt={campaign.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://picsum.photos/seed/${id}/800/500`;
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(8,8,15,0.7) 0%, transparent 50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                display: "flex",
                gap: 8,
              }}
            >
              <span
                className={`badge ${isExpired ? "badge-red" : "badge-orange"}`}
              >
                {isExpired ? "Campaign Ended" : `${daysLeft} days left`}
              </span>
              {isGoalReached && (
                <span className="badge badge-green">✓ Goal Reached</span>
              )}
            </div>
            {isOwner && (
              <div style={{ position: "absolute", top: 16, left: 16 }}>
                <span
                  className="badge"
                  style={{
                    background: "rgba(8,8,15,0.8)",
                    border: "1px solid var(--border2)",
                    color: "var(--text2)",
                  }}
                >
                  👤 Your Campaign
                </span>
              </div>
            )}
          </div>

          {/* Title row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(22px, 4vw, 32px)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  marginBottom: 8,
                }}
              >
                {campaign.title}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Created by
                </span>
                <a
                  href={`https://sepolia.etherscan.io/address/${campaign.owner}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: "var(--accent)",
                    textDecoration: "none",
                    background: "var(--accent-glow)",
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(249,115,22,0.2)",
                  }}
                >
                  {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)} ↗
                </a>
              </div>
            </div>
            <ShareButton
              title={campaign.title}
              url={typeof window !== "undefined" ? window.location.href : ""}
            />
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 24,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 4,
            }}
          >
            {(["about", "backers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  background:
                    activeTab === tab
                      ? "linear-gradient(135deg, #f97316, #ea580c)"
                      : "transparent",
                  color: activeTab === tab ? "white" : "var(--text2)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textTransform: "capitalize",
                }}
              >
                {tab === "about"
                  ? "📖 About"
                  : `👥 Backers (${campaign.donators.length})`}
              </button>
            ))}
          </div>

          {/* About tab */}
          {activeTab === "about" && (
            <div
              className="animate-fadeIn"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "24px 28px",
              }}
            >
              <p
                style={{
                  color: "var(--text2)",
                  lineHeight: 1.85,
                  fontSize: 15,
                  whiteSpace: "pre-wrap",
                }}
              >
                {campaign.description}
              </p>
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={`https://sepolia.etherscan.io/address/${campaign.owner}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--muted)",
                    fontSize: 13,
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--muted)")
                  }
                >
                  🔍 View on Etherscan ↗
                </a>
              </div>
            </div>
          )}

          {/* Milestones */}
          <Milestones
            campaignId={id}
            amountCollected={collected}
            isOwner={isOwner}
          />

          {/* Campaign Updates */}
          <CampaignUpdates campaignId={id} isOwner={isOwner} />

         {/* Multi Token Donate */}
          <MultiTokenDonate campaignId={id} onSuccess={() => refetch()} />

          {/* DAO Voting */}
          <DAOVoting
            campaignId={id}
            isOwner={isOwner}
            donorAmount={Number(donorAmount || 0)}
          />

          {/* Backers tab */}
          {activeTab === "backers" && (
            <div
              className="animate-fadeIn"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "24px 28px",
              }}
            >
              {campaign.donators.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                  <p style={{ color: "var(--muted)" }}>
                    No backers yet — be the first to support!
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {[...campaign.donators]
                    .reverse()
                    .map((addr: string, i: number) => {
                      const realIndex = campaign.donators.length - 1 - i;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 0",
                            borderBottom:
                              i < campaign.donators.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: `hsl(${parseInt(addr.slice(2, 8), 16) % 360}, 60%, 40%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "white",
                              }}
                            >
                              {addr.slice(2, 4).toUpperCase()}
                            </div>
                            <a
                              href={`https://sepolia.etherscan.io/address/${addr}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontFamily: "monospace",
                                fontSize: 13,
                                color: "var(--text2)",
                                textDecoration: "none",
                              }}
                            >
                              {addr.slice(0, 8)}...{addr.slice(-6)}
                            </a>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                color: "var(--accent)",
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                fontSize: 15,
                              }}
                            >
                              {(
                                Number(campaign.donations[realIndex]) / 1e18
                              ).toFixed(4)}{" "}
                              ETH
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Sticky donate panel */}
        <div style={{ position: "sticky", top: 88 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "28px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 26,
                      color: "var(--accent)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {collected.toFixed(4)}
                  </span>
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: 14,
                      marginLeft: 4,
                    }}
                  >
                    ETH raised
                  </span>
                </div>
                <span style={{ color: "var(--text2)", fontSize: 14 }}>
                  of {target.toFixed(4)} ETH
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "var(--border)",
                  borderRadius: 99,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  className="progress-bar"
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    borderRadius: 99,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {progress.toFixed(1)}% funded
                </span>
                <span
                  style={{
                    color: isExpired ? "var(--red)" : "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {isExpired ? "Ended" : `${daysLeft}d remaining`}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 24,
              }}
            >
              {[
                { v: campaign.donators.length, l: "Backers" },
                { v: daysLeft, l: "Days Left" },
                { v: `${progress.toFixed(0)}%`, l: "Funded" },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: "var(--bg)",
                    borderRadius: 12,
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                      color: "var(--text)",
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Donate section */}
            {!isExpired && !txSuccess && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      color: "var(--text2)",
                      fontSize: 12,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                    }}
                  >
                    Quick Donate
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          setDonationAmount(amt);
                          setCustomAmount(false);
                        }}
                        style={{
                          padding: "9px 4px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 700,
                          background:
                            donationAmount === amt && !customAmount
                              ? "var(--accent-glow)"
                              : "var(--bg)",
                          border: `1px solid ${donationAmount === amt && !customAmount ? "var(--accent)" : "var(--border2)"}`,
                          color:
                            donationAmount === amt && !customAmount
                              ? "var(--accent)"
                              : "var(--text2)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCustomAmount(!customAmount)}
                    style={{
                      width: "100%",
                      padding: "9px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      background: customAmount
                        ? "var(--accent-glow)"
                        : "var(--bg)",
                      border: `1px solid ${customAmount ? "var(--accent)" : "var(--border2)"}`,
                      color: customAmount ? "var(--accent)" : "var(--text2)",
                      cursor: "pointer",
                      marginBottom: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    ✏️ Custom Amount
                  </button>
                  {customAmount && (
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="0.001"
                        step="0.001"
                        placeholder="0.000"
                        style={{
                          width: "100%",
                          background: "var(--bg)",
                          border: "1px solid var(--border2)",
                          borderRadius: 10,
                          padding: "11px 50px 11px 14px",
                          color: "var(--text)",
                          fontSize: 15,
                          fontFamily: "'DM Sans', sans-serif",
                          outline: "none",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--accent)",
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        ETH
                      </span>
                    </div>
                  )}
                </div>

                {txError && (
                  <p
                    style={{
                      color: "var(--red)",
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    ⚠️ {txError}
                  </p>
                )}

                <button
                  onClick={handleDonate}
                  disabled={isPending || !account}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    fontSize: 16,
                    border: "none",
                    cursor: isPending || !account ? "not-allowed" : "pointer",
                  }}
                >
                  {!account
                    ? "🔌 Connect Wallet"
                    : isPending
                      ? "⏳ Processing..."
                      : `💎 Fund ${donationAmount} ETH`}
                </button>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 11,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Secured by Ethereum • No platform fees
                </p>
              </>
            )}


            {/* Success state */}
            {txSuccess && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--green)",
                    marginBottom: 6,
                  }}
                >
                  Thank you for your support!
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  Your donation has been confirmed on-chain.
                </div>
                <button
                  onClick={() => {
                    setTxSuccess(false);
                    refetch();
                  }}
                  style={{
                    background: "none",
                    border: "1px solid var(--border2)",
                    borderRadius: 10,
                    padding: "8px 20px",
                    color: "var(--text2)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Donate Again
                </button>
              </div>
            )}

            {/* Expired */}
            {isExpired && (
              <div
                style={{
                  background: "rgba(248,113,113,0.07)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 12,
                  padding: "14px",
                  textAlign: "center",
                  color: "var(--red)",
                  fontSize: 14,
                }}
              >
                This campaign has ended.
              </div>
            )}

            {/* Withdraw */}
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={isPending}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "14px",
                  borderRadius: 14,
                  fontSize: 15,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  color: "var(--green)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74,222,128,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(74,222,128,0.08)";
                }}
              >
                💰 Withdraw Funds
              </button>
            )}

            {/* Refund */}
            <RefundClaim
              campaignId={id}
              isExpired={isExpired}
              isGoalReached={isGoalReached}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

