"use client";
import { useState } from "react";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, getContract, toWei } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "@/app/client";

const daoContract = process.env.NEXT_PUBLIC_DAO_ADDRESS
  ? getContract({ client, chain: sepolia, address: process.env.NEXT_PUBLIC_DAO_ADDRESS })
  : null as any;

interface DAOVotingProps {
  campaignId: number;
  isOwner: boolean;
  donorAmount: number; // how much this user donated in wei
}

export default function DAOVoting({ campaignId, isOwner, donorAmount }: DAOVotingProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", recipient: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: proposalIds, refetch } = useReadContract({
    contract: daoContract,
    method: "function getProposalsByCampaign(uint256 _campaignId) returns (uint256[])",
    params: [BigInt(campaignId)],
  });

  const { data: allProposals } = useReadContract({
    contract: daoContract,
    method: "function getAllProposals() returns ((uint256 campaignId, string title, string description, uint256 requestedAmount, address recipient, uint256 votesFor, uint256 votesAgainst, uint256 deadline, bool executed, bool cancelled, address proposer)[])",
    params: [],
  });

  const campaignProposals = allProposals?.filter((_: any, i: number) =>
    proposalIds?.includes(BigInt(i))
  ) || [];

  const handleCreateProposal = () => {
    if (!form.title || !form.amount || !form.recipient) return setError("All fields required");
    setError("");

    const tx = prepareContractCall({
      contract: daoContract,
      method: "function createProposal(uint256,string,string,uint256,address) returns (uint256)",
      params: [
        BigInt(campaignId),
        form.title,
        form.description,
        toWei(form.amount),
        form.recipient as `0x${string}`,
      ],
    });

    sendTx(tx, {
      onSuccess: () => {
        setSuccess("✅ Proposal created!");
        setShowCreate(false);
        setForm({ title: "", description: "", amount: "", recipient: "" });
        refetch();
      },
      onError: (err) => setError(err.message),
    });
  };

  const handleVote = (proposalId: number, support: boolean) => {
    if (!donorAmount) return setError("Only backers can vote!");
    const tx = prepareContractCall({
      contract: daoContract,
      method: "function vote(uint256,bool,uint256)",
      params: [BigInt(proposalId), support, BigInt(donorAmount)],
    });
    sendTx(tx, {
      onSuccess: () => { setSuccess(`✅ Vote cast!`); refetch(); },
      onError: (err) => setError(err.message),
    });
  };

  const handleExecute = (proposalId: number) => {
    const tx = prepareContractCall({
      contract: daoContract,
      method: "function executeProposal(uint256)",
      params: [BigInt(proposalId)],
    });
    sendTx(tx, {
      onSuccess: () => { setSuccess("✅ Proposal executed!"); refetch(); },
      onError: (err) => setError(err.message),
    });
  };

  const formatDeadline = (deadline: bigint) => {
    const d = new Date(Number(deadline) * 1000);
    const hoursLeft = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 3600000));
    return hoursLeft > 0 ? `${hoursLeft}h left` : "Ended";
  };

  if (!daoContract) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          🗳️ DAO Governance
          {campaignProposals.length > 0 && (
            <span style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 99, padding: "2px 10px", fontSize: 12 }}>
              {campaignProposals.length}
            </span>
          )}
        </h3>
        {isOwner && (
          <button onClick={() => setShowCreate(!showCreate)} style={{
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
            color: "#a78bfa", borderRadius: 10, padding: "8px 14px",
            fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 600, cursor: "pointer",
          }}>
            + New Proposal
          </button>
        )}
      </div>

      {/* Create Proposal Form */}
      {showCreate && (
        <div style={{ background: "var(--bg)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 16, color: "#a78bfa" }}>Create Spending Proposal</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Proposal title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none" }} />
            <textarea placeholder="What will this money be used for?" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={3} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none", resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input placeholder="Amount (ETH) *" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none" }} />
              <input placeholder="Recipient address *" value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})}
                style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none" }} />
            </div>
            {error && <p style={{ color: "var(--red)", fontSize: 13 }}>⚠️ {error}</p>}
            <button onClick={handleCreateProposal} disabled={isPending}
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", color: "white", borderRadius: 10, padding: "12px", fontSize: 14, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
              {isPending ? "⏳ Creating..." : "🗳️ Create Proposal"}
            </button>
          </div>
        </div>
      )}

      {success && <p style={{ color: "var(--green)", fontSize: 13, marginBottom: 12 }}>{success}</p>}

      {/* Proposals list */}
      {campaignProposals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", border: "1px dashed var(--border2)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗳️</div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No proposals yet.</p>
          {isOwner && <p style={{ color: "var(--muted)", fontSize: 13 }}>Create a proposal to let backers vote on spending!</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {campaignProposals.map((p: any, i: number) => {
            const totalVotes = Number(p.votesFor) + Number(p.votesAgainst);
            const forPct = totalVotes > 0 ? (Number(p.votesFor) / totalVotes) * 100 : 0;
            const isActive = !p.executed && !p.cancelled && new Date(Number(p.deadline) * 1000) > new Date();
            const isPassed = Number(p.votesFor) > Number(p.votesAgainst);

            return (
              <div key={i} style={{ background: "var(--bg)", border: `1px solid ${p.executed ? "rgba(74,222,128,0.2)" : p.cancelled ? "rgba(248,113,113,0.2)" : "rgba(139,92,246,0.2)"}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</h4>
                    <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5 }}>{p.description}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ color: "#a78bfa", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
                      {(Number(p.requestedAmount) / 1e18).toFixed(4)} ETH
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {p.executed ? "✅ Executed" : p.cancelled ? "❌ Cancelled" : isActive ? formatDeadline(p.deadline) : isPassed ? "✅ Passed" : "❌ Rejected"}
                    </div>
                  </div>
                </div>

                {/* Vote bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                    <span>✅ For: {(Number(p.votesFor) / 1e18).toFixed(4)} ETH</span>
                    <span>❌ Against: {(Number(p.votesAgainst) / 1e18).toFixed(4)} ETH</span>
                  </div>
                  <div style={{ height: 8, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${forPct}%`, background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>

                {/* Vote buttons */}
                {isActive && account && donorAmount > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => handleVote(i, true)} disabled={isPending}
                      style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--green)", borderRadius: 10, padding: "9px", fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                      👍 Vote For
                    </button>
                    <button onClick={() => handleVote(i, false)} disabled={isPending}
                      style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--red)", borderRadius: 10, padding: "9px", fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                      👎 Vote Against
                    </button>
                  </div>
                )}

                {/* Execute button */}
                {!isActive && isPassed && !p.executed && !p.cancelled && isOwner && (
                  <button onClick={() => handleExecute(i)} disabled={isPending}
                    style={{ width: "100%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--green)", borderRadius: 10, padding: "10px", fontSize: 14, fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                    💰 Execute Proposal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
