"use client";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        width: 40, height: 40,
        borderRadius: 10,
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border2)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}