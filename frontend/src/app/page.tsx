"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    try {
      const t = localStorage.getItem("sophub_token");
      setHasToken(!!t);
    } catch {}
  }, []);

  const { data: sops } = useSWR(hasToken ? "/sops" : null, (key) => fetchWithAuth(key).then((r) => r.json()));
  const { data: me } = useSWR(hasToken ? "/auth/me" : null, (key) => fetchWithAuth(key).then(r=>r.json()));
  const role = me?.role as string | undefined;

  return (
    <main className="home-root"
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
        <h1 style={{ fontSize: 48, margin: 0, letterSpacing: -0.5 }}>AI‑Powered SOP Hub</h1>
        <p style={{ color: "#555", marginTop: 0 }}>
          Create, run, and continuously improve SOPs with role‑based access and
          in‑run suggestions.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <a href={hasToken ? "/sops" : "/login"} className="btn-primary">
            {hasToken ? "Run a SOP" : "Login to Continue"}
          </a>
          {(role === "admin" || role === "dept_lead" || role === "editor") && (
            <a href="/admin/sops" style={{ padding: "12px 20px", borderRadius: 12, background: "#eef2ff", color: "#111", textDecoration: "none", border: "1px solid #d9e0ff" }}>
              Create SOP
            </a>
          )}
          {(role === "admin" || role === "dept_lead") && (
            <a href="/suggestions" style={{ padding: "12px 20px", borderRadius: 12, background: "#f6f7f9", color: "#111", textDecoration: "none", border: "1px solid #e6e8ec" }}>
              Review Suggestions
            </a>
          )}
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
      {/* Quick access grid removed per request */}
      <style jsx global>{`
        .home-root { zoom: 0.85; }
        .home-root .btn-primary { padding: 10px 14px; font-size: 14px; }
      `}</style>
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
