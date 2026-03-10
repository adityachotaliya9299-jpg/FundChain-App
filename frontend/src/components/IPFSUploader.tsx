"use client";
import { useState } from "react";
import { upload } from "thirdweb/storage";
import { client } from "@/app/client";

interface IPFSUploaderProps {
  onUpload: (url: string) => void;
  label?: string;
}

export default function IPFSUploader({ onUpload, label = "Campaign Image" }: IPFSUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return setError("Please upload an image file.");
    if (file.size > 10 * 1024 * 1024) return setError("File must be under 10MB.");

    setError("");
    setUploading(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Upload to IPFS via thirdweb storage
      const uri = await upload({ client, files: [file] });
      // Convert ipfs:// to https gateway URL
      const gatewayUrl = uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
      onUpload(gatewayUrl);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again or use a URL instead.");
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label style={{ display: "block", marginBottom: 8, color: "var(--text2)", fontSize: 13, fontWeight: 600, fontFamily: "'Syne', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("ipfs-file-input")?.click()}
        style={{
          border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border2)"}`,
          borderRadius: 14,
          padding: preview ? 0 : "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          background: isDragging ? "var(--accent-glow)" : "var(--bg)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {preview ? (
          <div style={{ position: "relative" }}>
            <img src={preview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(8,8,15,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
            >
              <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>
                {uploading ? "⏳ Uploading to IPFS..." : "🔄 Click to replace"}
              </span>
            </div>
            {uploading && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "var(--border)" }}>
                <div style={{ height: "100%", background: "var(--accent)", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%" }} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{uploading ? "⏳" : "🖼️"}</div>
            <p style={{ color: "var(--text2)", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              {uploading ? "Uploading to IPFS..." : "Drop image here or click to browse"}
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>PNG, JPG, GIF up to 10MB • Stored on IPFS forever</p>
          </div>
        )}
      </div>

      <input id="ipfs-file-input" type="file" accept="image/*" onChange={handleInput} style={{ display: "none" }} />

      {uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: "var(--accent)", fontSize: 13 }}>
          <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite" }} />
          Uploading to IPFS decentralized storage...
        </div>
      )}

      {error && (
        <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8 }}>⚠️ {error}</p>
      )}

      {preview && !uploading && (
        <p style={{ color: "var(--green)", fontSize: 12, marginTop: 8 }}>✅ Image stored on IPFS permanently</p>
      )}
    </div>
  );
}