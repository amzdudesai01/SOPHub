import Image from "next/image";

"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    try {
      const t = localStorage.getItem("sophub_token");
      setHasToken(!!t);
    } catch {}
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(50% 50% at 50% 0%, #f2f7ff 0%, #ffffff 60%), linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(100%, 960px)",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 42, margin: 0 }}>AI‑Powered SOP Hub</h1>
        <p style={{ color: "#555", marginTop: 0 }}>
          Create, run, and continuously improve SOPs with role‑based access and
          in‑run suggestions.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          <a
            href={hasToken ? "/sops" : "/login"}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            }}
          >
            {hasToken ? "Open My SOPs" : "Login to Continue"}
          </a>
          <a
            href="/sops"
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              background: "#eef2ff",
              color: "#111",
              textDecoration: "none",
              border: "1px solid #d9e0ff",
            }}
          >
            Browse Catalog
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Feature title="Run Mode" desc="Checklist with step tracking and completion." emoji="✅" />
          <Feature title="Suggestions" desc="Propose improvements while working." emoji="💡" />
          <Feature title="RBAC" desc="Teams and roles restrict who sees and edits." emoji="🔒" />
          <Feature title="AI Drafts" desc="Turn raw notes into clean SOPs (later)." emoji="✨" />
        </div>
      </div>
    </main>
  );
}

function Feature({ title, desc, emoji }: { title: string; desc: string; emoji: string }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #eee",
        textAlign: "left",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ color: "#666" }}>{desc}</div>
    </div>
  );
}
