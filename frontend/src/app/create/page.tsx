"use client";
import { useState } from "react";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { contract } from "@/app/contract";
import IPFSUploader from "@/components/IPFSUploader";
import { useRouter } from "next/navigation";

const categories = [
  "Technology",
  "Education",
  "Environment",
  "Healthcare",
  "Arts",
  "Community",
  "Other",
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
    category: "Technology",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateStep1 = () => {
    if (!form.title.trim())
      return (setError("Campaign title is required."), false);
    if (!form.description.trim())
      return (setError("Description is required."), false);
    if (form.description.length < 50)
      return (setError("Description should be at least 50 characters."), false);
    return true;
  };

  const validateStep2 = () => {
    if (!form.target || Number(form.target) <= 0)
      return (setError("Enter a valid funding goal."), false);
    if (!form.deadline) return (setError("Deadline is required."), false);
    if (new Date(form.deadline) <= new Date())
      return (setError("Deadline must be in the future."), false);
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = () => {
    if (!account) return setError("Please connect your wallet first.");
    const deadlineTimestamp = BigInt(
      Math.floor(new Date(form.deadline).getTime() / 1000),
    );
    const tx = prepareContractCall({
      contract,
      method:
        "function createCampaign(string,string,string,uint256,uint256,string,string[],uint256[]) returns (uint256)",
      params: [
        form.title,
        form.description,
        form.category,
        toWei(form.target),
        deadlineTimestamp,
        form.image || `https://picsum.photos/seed/${Date.now()}/800/500`,
        [],
        [],
      ],
    });
    sendTx(tx, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => router.push("/"), 3000);
      },
      onError: (err) => setError(err.message || "Transaction failed."),
    });
  };

  const inputStyle = {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--border2)",
    borderRadius: 12,
    padding: "13px 16px",
    color: "var(--text)",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "all 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    color: "var(--text2)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Syne', sans-serif",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  };

  const steps = ["Campaign Story", "Goal & Timeline", "Preview & Launch"];

  return (
    <div
      className="animate-fadeUp"
      style={{
        maxWidth: 700,
        margin: "0 auto",
        paddingTop: 10,
        paddingBottom: 60,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="badge badge-orange" style={{ marginBottom: 16 }}>
          NEW CAMPAIGN
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 5vw, 40px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          Launch Your <span className="gradient-text">Campaign</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.6 }}>
          Create a transparent, on-chain fundraiser in minutes. Your campaign
          lives forever on Ethereum.
        </p>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 36,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 6,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => i + 1 < step && setStep(i + 1)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 12,
              textAlign: "center",
              background:
                step === i + 1
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "transparent",
              cursor: i + 1 < step ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color:
                  step === i + 1
                    ? "white"
                    : step > i + 1
                      ? "var(--accent)"
                      : "var(--muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {step > i + 1 ? "✓ " : `${i + 1}. `}
              {s}
            </div>
          </div>
        ))}
      </div>

      {/* Form card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "32px 36px",
        }}
      >
        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 24,
              color: "var(--red)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            style={{
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 24,
              color: "var(--green)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              Campaign Launched!
            </div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              Redirecting to homepage in 3 seconds...
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <label style={labelStyle}>Campaign Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Give your campaign a compelling title..."
                style={inputStyle}
                maxLength={80}
              />
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  marginTop: 6,
                  textAlign: "right",
                }}
              >
                {form.title.length}/80
              </div>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Description *{" "}
                <span
                  style={{
                    color: "var(--muted)",
                    fontWeight: 400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (min 50 chars)
                </span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Tell your story. Why does this matter? How will funds be used? What's the impact?"
                rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
              />
              <div
                style={{
                  color:
                    form.description.length < 50
                      ? "var(--red)"
                      : "var(--muted)",
                  fontSize: 12,
                  marginTop: 6,
                  textAlign: "right",
                }}
              >
                {form.description.length} characters{" "}
                {form.description.length < 50 &&
                  `(${50 - form.description.length} more needed)`}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <label style={labelStyle}>Funding Goal (ETH) *</label>
              <div style={{ position: "relative" }}>
                <input
                  name="target"
                  type="number"
                  value={form.target}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.001"
                  step="0.001"
                  style={{ ...inputStyle, paddingRight: 60 }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--accent)",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  ETH
                </span>
              </div>
              {form.target && (
                <div
                  style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}
                >
                  ≈ ${(Number(form.target) * 3500).toLocaleString()} USD at
                  current rates
                </div>
              )}
            </div>

            {/* Quick amounts */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Quick Select
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                }}
              >
                {["0.1", "0.5", "1.0", "5.0"].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setForm({ ...form, target: amt })}
                    style={{
                      padding: "10px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      background:
                        form.target === amt
                          ? "var(--accent-glow)"
                          : "var(--bg)",
                      border: `1px solid ${form.target === amt ? "var(--accent)" : "var(--border2)"}`,
                      color:
                        form.target === amt ? "var(--accent)" : "var(--text2)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {amt} ETH
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Campaign Deadline *</label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                min={
                  new Date(Date.now() + 86400000).toISOString().split("T")[0]
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              />
              {form.deadline && (
                <div
                  style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}
                >
                  📅{" "}
                  {Math.ceil(
                    (new Date(form.deadline).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days from today
                </div>
              )}
            </div>

            <IPFSUploader
             onUpload={(url) =>
  setForm({
    ...form,
    image: url.startsWith("ipfs://")
      ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
      : url,
  })
}
            />
          </div>
        )}

        {/* STEP 3 — Preview */}
        {step === 3 && (
          <div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 20,
                color: "var(--text)",
              }}
            >
              Review Your Campaign
            </h3>
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes("ipfs.io")) {
                      img.src = img.src.replace("ipfs.io/ipfs/", "cloudflare-ipfs.com/ipfs/");
                    } else {
                      img.style.display = "none";
                    }
                  }}
                />
              )}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <span className="badge badge-orange">{form.category}</span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    marginBottom: 8,
                  }}
                >
                  {form.title}
                </h3>
                <p
                  style={{
                    color: "var(--text2)",
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  {form.description}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    { label: "Funding Goal", value: `${form.target} ETH` },
                    {
                      label: "Deadline",
                      value: new Date(form.deadline).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" },
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: "var(--surface)",
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 700,
                          fontSize: 16,
                          color: "var(--accent)",
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!account && (
              <div
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                  color: "var(--red)",
                  fontSize: 14,
                }}
              >
                ⚠️ Please connect your wallet to launch this campaign.
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || !account || success}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 12,
                fontSize: 16,
                border: "none",
                cursor: isPending || !account ? "not-allowed" : "pointer",
              }}
            >
              {!account
                ? "🔌 Connect Wallet to Launch"
                : isPending
                  ? "⏳ Submitting to blockchain..."
                  : "🚀 Launch Campaign on Ethereum"}
            </button>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 12,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              A small gas fee (~$0.01) is required to store your campaign
              on-chain.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 3 && !success && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
              }}
            >
              Next Step →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
