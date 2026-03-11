"use client";
import { useMemo } from "react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";
import Link from "next/link";

export default function ProfilePage() {
  const account = useActiveAccount();

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

  const { myCampaigns, myDonations, totalRaised, totalDonated } = useMemo(() => {
    if (!account?.address) return { myCampaigns: [], myDonations: [], totalRaised: 0, totalDonated: 0 };

    const addr = account.address.toLowerCase();
    const v1 = (campaignsV1 || []).map((c: any, i: number) => ({ ...c, category: "Legacy", _version: 1, _contractIndex: i }));
    const v2 = (campaignsV2 || []).map((c: any, i: number) => ({ ...c, _version: 2, _contractIndex: i }));
    const all = [...v1, ...v2];

    const myCampaigns = all.filter((c: any) => c.owner?.toLowerCase() === addr);
    const totalRaised = myCampaigns.reduce((sum: number, c: any) => sum + Number(c.amountCollected || 0) / 1e18, 0);

    // Find all donations made by this user
    const myDonations: { campaign: any; amount: number }[] = [];
    let totalDonated = 0;

    all.forEach((c: any) => {
      const donators = c.donators || [];
      const donations = c.donations || [];
      donators.forEach((d: string, i: number) => {
        if (d.toLowerCase() === addr) {
          const amt = Number(donations[i] || 0) / 1e18;
          myDonations.push({ campaign: c, amount: amt });
          totalDonated += amt;
        }
      });
    });

    return { myCampaigns, myDonations, totalRaised, totalDonated };
  }, [account, campaignsV1, campaignsV2]);

  if (!account) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, marginBottom: 10 }}>
          Connect Your Wallet
        </h2>
        <p style={{ color: "var(--muted)" }}>Connect your wallet to view your profile.</p>
      </div>
    );
  }

  const hue = parseInt(account.address.slice(2, 8), 16) % 360;

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 80 }}>
      {/* Profile header */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 24, padding: "32px", marginBottom: 32,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `hsl(${hue}, 60%, 35%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, color: "white",
          border: "3px solid var(--accent)", flexShrink: 0,
        }}>
          {account.address.slice(2, 4).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "monospace", fontSize: 16, color: "var(--text2)", marginBottom: 4 }}>
            {account.address.slice(0, 10)}...{account.address.slice(-8)}
          </div>
          <a href={`https://sepolia.etherscan.io/address/${account.address}`}
            target="_blank" rel="noreferrer"
            style={{ color: "var(--accent)", fontSize: 13, textDecoration: "none" }}>
            View on Etherscan ↗
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Campaigns Created", value: myCampaigns.length },
            { label: "Total Raised", value: `${totalRaised.toFixed(4)} ETH` },
            { label: "Campaigns Backed", value: myDonations.length },
            { label: "Total Donated", value: `${totalDonated.toFixed(4)} ETH` },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--bg)", borderRadius: 14, padding: "14px 20px", textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>
                {s.value}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My Campaigns */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
          🚀 My Campaigns <span style={{ color: "var(--muted)", fontSize: 16, fontWeight: 400 }}>({myCampaigns.length})</span>
        </h2>

        {myCampaigns.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <p style={{ color: "var(--muted)", marginBottom: 16 }}>You haven't created any campaigns yet.</p>
            <Link href="/create" className="btn-primary" style={{ padding: "10px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block", fontSize: 14 }}>
              Start a Campaign →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myCampaigns.map((c: any, i: number) => {
              const target = Number(c.target) / 1e18;
              const collected = Number(c.amountCollected) / 1e18;
              const pct = target > 0 ? Math.min((collected / target) * 100, 100) : 0;
              const isExpired = new Date(Number(c.deadline) * 1000) < new Date();
              const image = c.image?.startsWith("ipfs://") ? c.image.replace("ipfs://", "https://ipfs.io/ipfs/") : c.image;

              return (
                <Link key={i} href={`/campaign/${c._version}-${c._contractIndex}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                    transition: "all 0.2s", cursor: "pointer",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
                  >
                    <img src={image || "https://placehold.co/60x60/1a1a2e/f97316?text=FC"}
                      alt={c.title} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/60x60/1a1a2e/f97316?text=FC"; }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.title}</div>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 99, marginBottom: 6 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99 }} />
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                        <span>💰 {collected.toFixed(4)} / {target.toFixed(4)} ETH</span>
                        <span>👥 {(c.donators || []).length} backers</span>
                        <span style={{ color: isExpired ? "var(--red)" : "var(--green)" }}>
                          {isExpired ? "⏰ Ended" : "✅ Active"}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
                        {pct.toFixed(0)}%
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>funded</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* My Donations */}
      <div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
          💎 Campaigns I've Backed <span style={{ color: "var(--muted)", fontSize: 16, fontWeight: 400 }}>({myDonations.length})</span>
        </h2>

        {myDonations.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <p style={{ color: "var(--muted)" }}>You haven't backed any campaigns yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myDonations.map(({ campaign: c, amount }, i) => {
              const image = c.image?.startsWith("ipfs://") ? c.image.replace("ipfs://", "https://ipfs.io/ipfs/") : c.image;
              return (
                <Link key={i} href={`/campaign/${c._version}-${c._contractIndex}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                    transition: "all 0.2s", cursor: "pointer",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
                  >
                    <img src={image || "https://placehold.co/60x60/1a1a2e/f97316?text=FC"}
                      alt={c.title} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/60x60/1a1a2e/f97316?text=FC"; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>by {c.owner?.slice(0, 8)}...{c.owner?.slice(-4)}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>
                        {amount.toFixed(4)} ETH
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>donated</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}