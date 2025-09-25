"use client";
import useSWR from "swr";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

async function fetcher() {
  const res = await fetchWithAuth("/sops");
  return res.json();
}

export default function SopListPage() {
  const { data, error, isLoading, mutate } = useSWR("/sops", fetcher);
  if (isLoading) return <Section title="My SOPs" subtitle="SOPs you can access based on your teams" body={<p>Loading…</p>} />;
  if (error) return <Section title="My SOPs" subtitle="SOPs you can access based on your teams" body={<p style={{ color: "red" }}>{String(error)}</p>} />;
  return (
    <Section
      title="My SOPs"
      subtitle="SOPs you can access based on your teams"
      body={
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {data?.map((s: any) => (
            <SopCard key={s.id} sop={s} />
          ))}
        </div>
      }
    />
  );
}

function Section({ title, subtitle, body }: { title: string; subtitle?: string; body: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1>{title}</h1>
      {subtitle && <p style={{ color: "#666", marginTop: 4 }}>{subtitle}</p>}
      <div style={{ marginTop: 12 }}>{body}</div>
    </div>
  );
}


function SopCard({ sop }: { sop: any }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest?.(`#sop-card-${sop.id}`)) setMenuOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [sop?.id]);
  async function runNow() {
    try {
      const me = await fetchWithAuth(`/auth/me`).then(r=>r.json());
      const res = await fetchWithAuth(`/runs`, { method: "POST", body: JSON.stringify({ sop_id: sop.id, user_id: Number(me.sub)||0 }) });
      const run = await res.json();
      location.assign(`/runs/${run.id}`);
    } catch (e) { alert(String(e)); }
  }
  return (
    <div id={`sop-card-${sop.id}`} className="card" style={{ padding: 12, position: "relative", cursor: "pointer", textDecoration: "none" }}>
      <Link href={`/sops/${encodeURIComponent(sop.sop_id)}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 26 }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, lineHeight: 1.25, marginBottom: 4 }}>{sop.title}</div>
            <div style={{ color: "#666", fontSize: 13 }}>{sop.department} • v{sop.version}</div>
          </div>
          <button onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }} style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "4px 8px" }}>⋯</button>
        </div>
      </Link>
      {menuOpen && (
        <div style={{ position: "absolute", right: 8, top: 44, background: "#fff", border: "1px solid #eee", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.12)", padding: 6, zIndex: 30, minWidth: 160 }}>
          <MenuItem href={`/sops/${encodeURIComponent(sop.sop_id)}`}>Open</MenuItem>
          <MenuItem onClick={runNow}>Run</MenuItem>
          <MenuItem href={`/suggestions`}>Review Suggestions</MenuItem>
        </div>
      )}
      <style jsx>{`
        #sop-card-${sop.id}:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,.08); }
      `}</style>
    </div>
  );
}

function MenuItem({ children, href, onClick }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const common = { display: "block", padding: "8px 10px", borderRadius: 10, color: "#111", textDecoration: "none" } as React.CSSProperties;
  if (href) return <Link href={href} style={{ ...common }}> {children} </Link>;
  return <button onClick={onClick} style={{ ...common, width: "100%", textAlign: "left", background: "transparent", border: "none" }}>{children}</button>;
}


