"use client";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/app/contract";
import Link from "next/link";

type Campaign = {
  owner: string;
  title: string;
  description: string;
  target: bigint;
  deadline: bigint;
  amountCollected: bigint;
  image: string;
  donators: string[];
  donations: bigint[];
  withdrawn: boolean;
};

function CampaignCard({
  campaign,
  index,
}: {
  campaign: Campaign;
  index: number;
}) {
  const target = Number(campaign.target) / 1e18;
  const collected = Number(campaign.amountCollected) / 1e18;
  const progress = Math.min((collected / target) * 100, 100);
  const deadline = new Date(Number(campaign.deadline) * 1000);
  const daysLeft = Math.max(
    0,
    Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const isExpired = deadline.getTime() < Date.now();

  return (
    <Link href={`/campaign/${index}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
  className="card-hover rounded-2xl overflow-hidden cursor-pointer"
  style={{
    background: "var(--surface)",
    border: "1px solid var(--border)",
    animationDelay: `${index * 0.08}s`,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(249,115,22,0.08)",
  }}
>
        {/* Campaign image */}
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img
            src={
              campaign.image ||
              "https://images.unsplash.com/photo-1559526324-593bc073d938?w=600"
            }
            alt={campaign.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1559526324-593bc073d938?w=600";
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: isExpired ? "#ef4444" : "var(--accent)",
              color: "white",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
            }}
          >
            {isExpired ? "Ended" : `${daysLeft}d left`}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text)",
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {campaign.title}
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 16,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {campaign.description}
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                height: 6,
                background: "var(--border)",
                borderRadius: 99,
                overflow: "hidden",
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
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center">
            <div>
              <p
                style={{
                  color: "var(--accent)",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {collected.toFixed(4)} ETH
              </p>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                raised of {target.toFixed(4)} ETH
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  color: "var(--text)",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {campaign.donators.length}
              </p>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>backers</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method:
      "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations, bool withdrawn)[])",
    params: [],
  });

  return (
    <div>
      {/* Hero */}
      <div
        className="animate-fadeUp"
        style={{ textAlign: "center", padding: "60px 0 50px" }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 99,
            padding: "6px 16px",
            marginBottom: 20,
          }}
        >
          <span
            style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600 }}
          >
            ⚡ Powered by Ethereum Sepolia
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 6vw, 64px)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          Fund Ideas That
          <br />
          <span style={{ color: "var(--accent)" }}>Change the World</span>
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 18,
            maxWidth: 500,
            margin: "0 auto 32px",
          }}
        >
          Transparent, decentralized crowdfunding. Every transaction on-chain.
          No middlemen.
        </p>
        <Link
          href="/create"
          className="btn-primary"
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            fontSize: 16,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Start a Campaign →
        </Link>
      </div>

      {/* Campaigns Grid */}
      <div className="animate-fadeUp-2">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
  <h2
    style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 32,
      background: "linear-gradient(135deg, #f97316, #fb923c, #fbbf24)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      letterSpacing: "-0.02em",
    }}
  >
    Active Campaigns
  </h2>
  <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
    {campaigns ? `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} on-chain` : ""}
  </p>
</div>
        

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  height: 360,
                  backgroundImage:
                    "linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && campaigns && campaigns.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              border: "1px dashed var(--border)",
              borderRadius: 16,
            }}
          >
            <p style={{ fontSize: 48, marginBottom: 16 }}>🚀</p>
            <p
              style={{ color: "var(--muted)", fontSize: 18, marginBottom: 24 }}
            >
              No campaigns yet. Be the first!
            </p>
            <Link
              href="/create"
              className="btn-primary"
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                fontSize: 16,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Start a Campaign →
            </Link>
          </div>
        )}

        {!isLoading && campaigns && campaigns.length > 0 && (
          <div style={{
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 360px))",
  gap: 28,
  justifyContent: "center",
  maxWidth: 1140,
  margin: "0 auto",
}}>
            {campaigns.map((campaign: any, index: number) => (
              <CampaignCard key={index} campaign={campaign} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
