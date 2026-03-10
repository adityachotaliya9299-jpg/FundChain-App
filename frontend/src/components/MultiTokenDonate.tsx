"use client";
import { useState } from "react";
import { useSendTransaction, useActiveAccount, useReadContract } from "thirdweb/react";
import { prepareContractCall, getContract, toWei } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { client } from "@/app/client";

const multiTokenContract = process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS
  ? getContract({ client, chain: sepolia, address: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS })
  : null as any;

// ERC20 ABI for approve
const ERC20_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
] as const;

const TOKENS = [
  { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "⟠" },
  { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6, icon: "💵" },
  { symbol: "USDT", address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", decimals: 6, icon: "💰" },
];

interface MultiTokenDonateProps {
  campaignId: number;
  onSuccess?: () => void;
}

export default function MultiTokenDonate({ campaignId, onSuccess }: MultiTokenDonateProps) {
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState("0.01");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"idle" | "approving" | "donating">("idle");

  const { data: balances } = useReadContract({
    contract: multiTokenContract,
    method: "function getCampaignBalance(uint256) returns (address[], uint256[], string[])",
    params: [BigInt(campaignId)],
  });

  const handleDonate = async () => {
    if (!account) return setError("Connect wallet first");
    if (!amount || Number(amount) <= 0) return setError("Enter valid amount");
    setError("");

    if (selectedToken.symbol === "ETH") {
      // ETH donation
      setStep("donating");
      const tx = prepareContractCall({
        contract: multiTokenContract,
        method: "function donateETH(uint256) payable",
        params: [BigInt(campaignId)],
        value: toWei(amount),
      });
      sendTx(tx, {
        onSuccess: () => { setSuccess(true); setStep("idle"); onSuccess?.(); },
        onError: (err) => { setError(err.message); setStep("idle"); },
      });
    } else {
      // ERC20: first approve, then donate
      setStep("approving");
      const tokenAmount = BigInt(Math.floor(Number(amount) * 10 ** selectedToken.decimals));

      const tokenContract = getContract({ client, chain: sepolia, address: selectedToken.address as `0x${string}` });
      const approveTx = prepareContractCall({
        contract: tokenContract,
        method: "function approve(address,uint256) returns (bool)",
        params: [process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS as `0x${string}`, tokenAmount],
      });

      sendTx(approveTx, {
        onSuccess: () => {
          setStep("donating");
          const donateTx = prepareContractCall({
            contract: multiTokenContract,
            method: "function donateToken(uint256,address,uint256)",
            params: [BigInt(campaignId), selectedToken.address as `0x${string}`, tokenAmount],
          });
          sendTx(donateTx, {
            onSuccess: () => { setSuccess(true); setStep("idle"); onSuccess?.(); },
            onError: (err) => { setError(err.message); setStep("idle"); },
          });
        },
        onError: (err) => { setError(err.message); setStep("idle"); },
      });
    }
  };

  if (!multiTokenContract) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", marginTop: 16 }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        💳 Multi-Token Donation
      </h3>

      {/* Token balances */}
      {balances && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {balances[2]?.map((sym: string, i: number) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{sym} Raised</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>
                {sym === "ETH"
                  ? (Number(balances[1][i]) / 1e18).toFixed(4)
                  : (Number(balances[1][i]) / 1e6).toFixed(2)
                } {sym}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Token selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {TOKENS.map(token => (
          <button key={token.symbol} onClick={() => setSelectedToken(token)} style={{
            padding: "10px 8px", borderRadius: 10, fontSize: 13,
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            background: selectedToken.symbol === token.symbol ? "var(--accent-glow)" : "var(--bg)",
            border: `1px solid ${selectedToken.symbol === token.symbol ? "var(--accent)" : "var(--border2)"}`,
            color: selectedToken.symbol === token.symbol ? "var(--accent)" : "var(--text2)",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {token.icon} {token.symbol}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0.00" min="0" step="0.01"
          style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 10, padding: "11px 60px 11px 14px", color: "var(--text)", fontSize: 15, outline: "none" }} />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--accent)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>
          {selectedToken.symbol}
        </span>
      </div>

      {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</p>}

      {success ? (
        <div style={{ textAlign: "center", padding: "12px 0", color: "var(--green)", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
          🎉 Donation successful!
        </div>
      ) : (
        <button onClick={handleDonate} disabled={isPending || !account}
          style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700,
            background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", color: "white",
            cursor: isPending || !account ? "not-allowed" : "pointer", opacity: isPending || !account ? 0.7 : 1 }}>
          {!account ? "🔌 Connect Wallet" :
           step === "approving" ? "⏳ Step 1/2: Approving..." :
           step === "donating" ? "⏳ Step 2/2: Donating..." :
           `💳 Donate ${amount} ${selectedToken.symbol}`}
        </button>
      )}

      {selectedToken.symbol !== "ETH" && (
        <p style={{ color: "var(--muted)", fontSize: 11, textAlign: "center", marginTop: 8 }}>
          ⚠️ 2-step process: Approve then Donate
        </p>
      )}
    </div>
  );
}
