"use client";
import { useState, useMemo } from "react";
import { useReadContract } from "thirdweb/react";
import { contract, contractV1 } from "@/app/contract";
import Link from "next/link";

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="stat-card animate-fadeUp">
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "var(--text)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function CampaignCard({ campaign, index }: { campaign: any; index: number }) {
  const target = Number(campaign.target) / 1e18;
  const collected = Number(campaign.amountCollected) / 1e18;
  const progress = Math.min((collected / target) * 100, 100);
  const deadline = new Date(Number(campaign.deadline) * 1000);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpired = deadline.getTime() < Date.now();
  const isGoalReached = collected >= target;

  return (
    <Link href={`/campaign/${campaign._version || 2}-${campaign._contractIndex ?? index}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card-hover" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        animationDelay: `${index * 0.07}s`,
      }}>
        {/* Image */}
        <div style={{ position: "relative", height: 210, overflow: "hidden", flexShrink: 0 }}>
          <img
            src={campaign.image || `https://picsum.photos/seed/${index + 10}/600/400`}
            alt={campaign.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${index + 10}/600/400`; }}
          />
          {/* Gradient overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(15,15,26,0.9), transparent)" }} />
          {/* Badges */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
            {isGoalReached && <span className="badge badge-green">✓ Funded</span>}
          </div>
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span className={`badge ${isExpired ? "badge-red" : "badge-orange"}`}>
              {isExpired ? "Ended" : `${daysLeft}d left`}
            </span>
          </div>
          {/* Category chip */}
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <span style={{ background: "rgba(8,8,15,0.7)", backdropFilter: "blur(8px)", border: "1px solid var(--border2)", borderRadius: 99, padding: "3px 10px", fontSize: 11, color: "var(--text2)", fontWeight: 500 }}>
              #{campaign.donators.length} backers
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 8, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
            {campaign.title}
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.65, marginBottom: "auto", paddingBottom: 16,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {campaign.description}
          </p>

          {/* Progress */}
          <div>
            <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
              <div className="progress-bar" style={{ height: "100%", width: `${progress}%`, borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
                  {collected.toFixed(3)} ETH
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 1 }}>of {target.toFixed(3)} ETH goal</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--text)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{progress.toFixed(0)}%</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 1 }}>funded</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
      <div className="skeleton" style={{ height: 210 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 20, width: "70%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 14, width: "100%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 5, marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton" style={{ height: 18, width: "35%" }} />
          <div className="skeleton" style={{ height: 18, width: "20%" }} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

 const { data: campaignsV2, isLoading: loadingV2 } = useReadContract({
    contract,
    method: "function getCampaigns() returns ((address owner, string title, string description, string category, uint256 target, uint256 deadline, uint256 amountCollected, string image, bool withdrawn, address[] donators, uint256[] donations)[])",
    params: [],
  });

  const { data: campaignsV1, isLoading: loadingV1 } = useReadContract({
    contract: contractV1,
    method: "function getCampaigns() returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
    params: [],
  });

const campaigns = useMemo(() => {
    const v1 = (campaignsV1 || []).map((c: any, i: number) => ({
      owner: c[0], title: c[1], description: c[2],
      category: "Legacy",
      target: c[3], deadline: c[4], amountCollected: c[5],
      image: c[6], donators: c[7] || [], donations: c[8] || [],
      _version: 1, _contractIndex: i,
    }));
    const v2 = (campaignsV2 || []).map((c: any, i: number) => ({
      owner: c[0], title: c[1], description: c[2],
      category: c[3] || "Other",
      target: c[4], deadline: c[5], amountCollected: c[6],
      image: c[7], donators: c[9] || [], donations: c[10] || [],
      _version: 2, _contractIndex: i,
    }));
    return [...v1, ...v2];
  }, [campaignsV1, campaignsV2]);

  const isLoading = loadingV1 || loadingV2;

  const stats = useMemo(() => {
    if (!campaigns) return { total: 0, totalRaised: "0", totalBackers: 0, active: 0 };
    const totalRaised = campaigns.reduce((acc: number, c: any) => acc + Number(c.amountCollected) / 1e18, 0);
    const totalBackers = campaigns.reduce((acc: number, c: any) => acc + c.donators.length, 0);
    const active = campaigns.filter((c: any) => Number(c.deadline) * 1000 > Date.now()).length;
    return { total: campaigns.length, totalRaised: totalRaised.toFixed(3), totalBackers, active };
  }, [campaigns]);

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    let result = campaigns.map((c: any, i: number) => ({ ...c, _index: i }));
    if (search) result = result.filter((c: any) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === "active") result = result.filter((c: any) => Number(c.deadline) * 1000 > Date.now() && Number(c.amountCollected) < Number(c.target));
    if (filter === "funded") result = result.filter((c: any) => Number(c.amountCollected) >= Number(c.target));
    if (filter === "ended") result = result.filter((c: any) => Number(c.deadline) * 1000 < Date.now() || Number(c.amountCollected) >= Number(c.target));
    if (sortBy === "newest") result = result.reverse();
    if (sortBy === "mostFunded") result = result.sort((a: any, b: any) => Number(b.amountCollected) - Number(a.amountCollected));
    if (sortBy === "endingSoon") result = result.sort((a: any, b: any) => Number(a.deadline) - Number(b.deadline));
    return result;
  }, [campaigns, search, filter, sortBy]);

  const filterBtnStyle = (active: boolean) => ({
    padding: "8px 18px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    border: active ? "1px solid rgba(249,115,22,0.4)" : "1px solid var(--border2)",
    background: active ? "var(--accent-glow)" : "transparent",
    color: active ? "var(--accent)" : "var(--text2)",
    transition: "all 0.2s",
  });

  return (
    <div style={{ position: "relative" }}>

      {/* Hero section */}
      <div className="hero-grid" style={{
        borderRadius: 24,
        marginBottom: 60,
        padding: "70px 40px 60px",
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, background: "radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div className="badge badge-orange animate-fadeUp" style={{ marginBottom: 20, display: "inline-flex" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse-glow 2s infinite" }} />
            Live on Ethereum Sepolia
          </div>

          <h1 className="animate-fadeUp-1" style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(38px, 6vw, 68px)",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: 20,
          }}>
            Fund Ideas That<br />
            <span className="gradient-text">Change the World</span>
          </h1>

          <p className="animate-fadeUp-2" style={{ color: "var(--text2)", fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.7, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
            Transparent, on-chain crowdfunding. Back campaigns you believe in. Every transaction is permanent and verifiable.
          </p>

          <div className="animate-fadeUp-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/create" className="btn-primary" style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
              🚀 Launch a Campaign
            </Link>
            <a href="#campaigns" className="btn-secondary" style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
              Browse Campaigns ↓
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="animate-fadeUp-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 56 }}>
        <StatCard value={String(stats.total)} label="Total Campaigns" icon="📋" />
        <StatCard value={`${stats.totalRaised} ETH`} label="Total Raised" icon="💰" />
        <StatCard value={String(stats.totalBackers)} label="Total Backers" icon="👥" />
        <StatCard value={String(stats.active)} label="Active Now" icon="⚡" />
      </div>

      {/* Campaigns section */}
      <div id="campaigns" className="animate-fadeUp-3">
        {/* Section header */}
       <div style={{ marginBottom: 28, textAlign: "center" }}>
  <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 4 }}>
    Active <span className="gradient-text">Campaigns</span>
  </h2>
  <p style={{ color: "var(--muted)", fontSize: 14 }}>{filtered.length} campaign{filtered.length !== 1 ? "s" : ""} found</p>
</div>

        {/* Search + Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {/* Search */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search campaigns..."
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 12,
                padding: "11px 16px",
                color: "var(--text)",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
            )}
          </div>

          {/* Filters + Sort in one row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["all","All"],["active","Active"],["funded","Funded"],["ended","Ended"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} style={filterBtnStyle(filter === val)}>{label}</button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "var(--text2)",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="mostFunded">Most Funded</option>
              <option value="endingSoon">Ending Soon</option>
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 40px", border: "1px dashed var(--border2)", borderRadius: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{search ? "🔍" : "🚀"}</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10 }}>
              {search ? "No campaigns match your search" : "No campaigns yet"}
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 15 }}>
              {search ? "Try different keywords" : "Be the first to launch a campaign on FundChain"}
            </p>
            {!search && (
              <Link href="/create" className="btn-primary" style={{ padding: "12px 28px", borderRadius: 12, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
                Create First Campaign
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, maxWidth: 1140, margin: "0 auto" }}>
            {filtered.map((campaign: any) => (
              <CampaignCard key={campaign._index} campaign={campaign} index={campaign._index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}