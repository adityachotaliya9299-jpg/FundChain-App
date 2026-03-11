"use client";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";

// Comments stored in localStorage (off-chain, free, instant)
// For on-chain version, use a Comments smart contract

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  likes: number;
}

interface CampaignCommentsProps {
  campaignId: number;
}

export default function CampaignComments({ campaignId }: CampaignCommentsProps) {
  const account = useActiveAccount();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const storageKey = `fundchain_comments_${campaignId}`;
  const likesKey = `fundchain_likes_${campaignId}_${account?.address}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const liked = JSON.parse(localStorage.getItem(likesKey) || "[]");
      setComments(saved);
      setLikedIds(new Set(liked));
    } catch {}
  }, [campaignId]);

  const handlePost = () => {
    if (!account) return setError("Connect wallet to comment");
    if (!text.trim()) return setError("Write something first");
    if (text.length > 500) return setError("Max 500 characters");
    setError("");

    const newComment: Comment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      author: account.address,
      text: text.trim(),
      timestamp: Date.now(),
      likes: 0,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setText("");
  };

  const handleLike = (id: string) => {
    if (!account) return;
    const newLiked = new Set(likedIds);
    const updated = comments.map(c => {
      if (c.id !== id) return c;
      if (likedIds.has(id)) {
        newLiked.delete(id);
        return { ...c, likes: c.likes - 1 };
      } else {
        newLiked.add(id);
        return { ...c, likes: c.likes + 1 };
      }
    });
    setComments(updated);
    setLikedIds(newLiked);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem(likesKey, JSON.stringify([...newLiked]));
  };

  const handleDelete = (id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          💬 Comments
        </h3>
        {comments.length > 0 && (
          <span style={{
            background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)",
            color: "var(--accent)", borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700,
          }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment input */}
      <div style={{
        background: "var(--bg)", border: "1px solid var(--border2)",
        borderRadius: 14, padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {account && (
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `hsl(${parseInt(account.address.slice(2, 8), 16) % 360}, 60%, 35%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white",
            }}>
              {account.address.slice(2, 4).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setError(""); }}
              placeholder={account ? "Share your thoughts on this campaign..." : "Connect wallet to comment..."}
              disabled={!account}
              rows={3}
              style={{
                width: "100%", background: "var(--surface)",
                border: "1px solid var(--border2)", borderRadius: 10,
                padding: "10px 14px", color: "var(--text)", fontSize: 14,
                outline: "none", resize: "vertical", lineHeight: 1.6,
                opacity: !account ? 0.5 : 1,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: text.length > 450 ? "var(--red)" : "var(--muted)", fontSize: 12 }}>
                {text.length}/500
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {error && <span style={{ color: "var(--red)", fontSize: 12 }}>⚠️ {error}</span>}
                <button onClick={handlePost} disabled={!account || !text.trim()}
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    border: "none", borderRadius: 10, padding: "8px 18px",
                    color: "white", fontSize: 13, fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, cursor: !account || !text.trim() ? "not-allowed" : "pointer",
                    opacity: !account || !text.trim() ? 0.6 : 1,
                  }}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", border: "1px dashed var(--border2)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No comments yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {comments.map(c => {
            const hue = parseInt(c.author.slice(2, 8), 16) % 360;
            const isOwn = c.author.toLowerCase() === account?.address?.toLowerCase();
            const hasLiked = likedIds.has(c.id);

            return (
              <div key={c.id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "14px 16px",
              }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: `hsl(${hue}, 60%, 35%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "white",
                  }}>
                    {c.author.slice(2, 4).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <a href={`https://sepolia.etherscan.io/address/${c.author}`}
                          target="_blank" rel="noreferrer"
                          style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                          {c.author.slice(0, 8)}...{c.author.slice(-4)}
                        </a>
                        {isOwn && (
                          <span style={{ background: "rgba(249,115,22,0.1)", color: "var(--accent)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>{formatTime(c.timestamp)}</span>
                    </div>
                    <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
                      {c.text}
                    </p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button onClick={() => handleLike(c.id)} style={{
                        background: hasLiked ? "rgba(249,115,22,0.1)" : "none",
                        border: `1px solid ${hasLiked ? "rgba(249,115,22,0.3)" : "var(--border2)"}`,
                        borderRadius: 8, padding: "4px 10px",
                        color: hasLiked ? "var(--accent)" : "var(--muted)",
                        fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      }}>
                        👍 {c.likes}
                      </button>
                      {isOwn && (
                        <button onClick={() => handleDelete(c.id)} style={{
                          background: "none", border: "none",
                          color: "var(--muted)", fontSize: 12, cursor: "pointer",
                          padding: "4px 8px",
                        }}>
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}