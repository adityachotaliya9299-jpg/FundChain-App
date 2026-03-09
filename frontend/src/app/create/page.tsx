"use client";
import { useState } from "react";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { contract } from "@/app/contract";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const [form, setForm] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = () => {
    if (!account) return setError("Please connect your wallet first.");
    if (!form.title || !form.description || !form.target || !form.deadline)
      return setError("Please fill in all required fields.");

    const deadlineDate = new Date(form.deadline);
    if (deadlineDate <= new Date()) return setError("Deadline must be in the future.");

    const deadlineTimestamp = BigInt(Math.floor(deadlineDate.getTime() / 1000));

    const tx = prepareContractCall({
      contract,
      method:
        "function createCampaign(string _title, string _description, uint256 _target, uint256 _deadline, string _image) returns (uint256)",
      params: [
        form.title,
        form.description,
        toWei(form.target),
        deadlineTimestamp,
        form.image || "https://images.unsplash.com/photo-1559526324-593bc073d938?w=600",
      ],
    });

    sendTx(tx, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2000);
      },
      onError: (err) => setError(err.message || "Transaction failed."),
    });
  };

  const inputStyle = {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "var(--text)",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    color: "var(--muted)",
    fontSize: 13,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  };

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 640, margin: "0 auto", paddingTop: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 99,
            padding: "4px 14px",
            marginBottom: 16,
          }}
        >
          <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>NEW CAMPAIGN</span>
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Launch Your <span style={{ color: "var(--accent)" }}>Campaign</span>
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 10, fontSize: 15 }}>
          Fill in the details below. Your campaign will be stored permanently on the blockchain.
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 32,
        }}
      >
        {success && (
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              color: "#4ade80",
              fontSize: 14,
            }}
          >
            ✅ Campaign created! Redirecting...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              color: "#f87171",
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Campaign Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Build a solar-powered school in Kenya"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell people why this matters and how funds will be used..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Target + Deadline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Goal Amount (ETH) *</label>
              <input
                name="target"
                type="number"
                value={form.target}
                onChange={handleChange}
                placeholder="e.g. 0.5"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Deadline *</label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                style={inputStyle}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label style={labelStyle}>Campaign Image URL (optional)</label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              style={inputStyle}
            />
            {form.image && (
              <img
                src={form.image}
                alt="preview"
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !account || success}
            className="btn-primary"
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              fontSize: 16,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {!account
              ? "Connect Wallet to Continue"
              : isPending
              ? "⏳ Submitting to blockchain..."
              : "🚀 Launch Campaign"}
          </button>
        </div>
      </div>

      {/* Info note */}
      <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", marginTop: 16 }}>
        A small gas fee is required to store your campaign on-chain.
      </p>
    </div>
  );
}