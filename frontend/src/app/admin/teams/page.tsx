"use client";
import AdminGuard from "@/components/AdminGuard";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";
import { useState } from "react";

function fetcher(key: string) { return fetchWithAuth(key).then(r => r.json()); }

export default function AdminTeams() {
  const { data, error, mutate } = useSWR("/teams", fetcher);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  async function createTeam() {
    await fetchWithAuth(`/teams`, { method: "POST", body: JSON.stringify({ name, department: dept }) });
    setName(""); setDept(""); mutate();
  }
  return (
    <AdminGuard>
      <div className="admin-teams-root" style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
        <h1>Teams</h1>
        <p style={{ color: "#666" }}>Create and manage teams</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10, flex: "1 1 220px" }} />
          <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10, flex: "1 1 220px" }} />
          <button onClick={createTeam} style={{ padding: "10px 16px", borderRadius: 10 }}>Create</button>
        </div>
        {error && <p style={{ color: "#b00020" }}>{String(error)}</p>}
        {!data ? <p>Loading…</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
            {data.map((t: any) => (
              <div key={t.id} style={{ padding: 14, borderRadius: 14, border: "1px solid #eee", background: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,.05)" }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ color: "#666" }}>{t.department}</div>
              </div>
            ))}
          </div>
        )}
        <style jsx global>{`
          .admin-teams-root { zoom: 0.85; }
        `}</style>
      </div>
    </AdminGuard>
  );
}


