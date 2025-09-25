"use client";
import AdminGuard from "@/components/AdminGuard";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";
import { useMemo, useState } from "react";

function fetcher(key: string) { return fetchWithAuth(key).then(r => r.json()); }

export default function AdminUsers() {
  const { data, error, mutate } = useSWR("/users", fetcher);
  const { data: teams } = useSWR("/teams", fetcher);
  async function setRole(userId: number, role: string) {
    await fetchWithAuth(`/admin/users/${userId}/role?role=${encodeURIComponent(role)}`, { method: "POST" });
    mutate();
  }
  const [manageUser, setManageUser] = useState<any|null>(null);
  const users = useMemo(() => (data ? [...data].sort((a: any, b: any) => a.id - b.id) : []), [data]);
  return (
    <AdminGuard>
      <div className="admin-users-root" style={{ maxWidth: 1100, margin: "40px auto", padding: 16 }}>
        <h1>Users</h1>
        <p style={{ color: "#666" }}>Set roles and assign teams</p>
        {error && <p style={{ color: "#b00020" }}>{String(error)}</p>}
        {!data ? <p>Loading…</p> : (
          <div style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,.06)",
            marginTop: 12,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Teams</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #f0f0f0", background: i%2?"#fff":"#fcfcfd" }}>
                    <Td>{u.name}</Td>
                    <Td>{u.email}</Td>
                    <Td><span style={{ padding: "4px 10px", borderRadius: 999, background: "#eef2ff", border: "1px solid #dbe3ff" }}>{u.role}</span></Td>
                    <Td>
                      <UserTeamsCell userId={u.id} teams={teams||[]} />
                    </Td>
                    <Td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(["admin","dept_lead","editor","contributor","viewer"] as const).map(r => (
                          <RoleChip key={r} active={u.role===r} label={r} onClick={() => setRole(u.id, r)} />
                        ))}
                        <button className="btn-secondary" onClick={() => setManageUser(u)} style={{ marginLeft: 6 }}>Manage Teams</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TeamManagerModal open={!!manageUser} user={manageUser} allTeams={teams||[]} onClose={()=>setManageUser(null)} />
        <style jsx global>{`
          .admin-users-root { zoom: 0.85; }
        `}</style>
      </div>
    </AdminGuard>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 14px" }}>{children}</td>;
}
function RoleChip({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: active?"1px solid #111":"1px solid #e5e7eb",
        background: active?"#111":"#fff",
        color: active?"#fff":"#111",
        cursor: "pointer",
        transition: "all .15s ease",
      }}
    >{label}</button>
  );
}

function UserTeamsCell({ userId, teams }: { userId: number; teams: any[] }) {
  const { data } = useSWR(`/admin/users/${userId}/teams`, fetcher);
  const idToName = new Map<number, string>((teams||[]).map((t: any) => [t.id, t.name]));
  const names = (data||[]).map((t: any) => idToName.get(t.id) || `Team ${t.id}`);
  if (!data) return <span>Loading…</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {names.length === 0 ? <span style={{ color: "#888" }}>(none)</span> : names.map((n: string, i: number) => (
        <span key={i} style={{ padding: "4px 10px", borderRadius: 999, background: "#f6f7f9", border: "1px solid #e5e7eb" }}>{n}</span>
      ))}
    </div>
  );
}

function TeamManagerModal({ open, user, allTeams, onClose }: { open: boolean; user: any; allTeams: any[]; onClose: () => void }) {
  const { data, mutate } = useSWR(open && user ? `/admin/users/${user.id}/teams` : null, fetcher);
  if (!open || !user) return null;
  const assignedIds = new Set<number>((data||[]).map((t: any) => t.id));
  async function toggle(teamId: number) {
    if (assignedIds.has(teamId)) {
      await fetchWithAuth(`/admin/users/${user.id}/teams?team_id=${teamId}`, { method: "DELETE" });
    } else {
      await fetchWithAuth(`/admin/users/${user.id}/teams?team_id=${teamId}`, { method: "POST" });
    }
    mutate();
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, width: "min(700px, 94vw)", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Manage Teams — {user.name}</div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        {!data ? <p>Loading…</p> : (
          <div style={{ display: "grid", gap: 8 }}>
            {allTeams && allTeams.length ? allTeams.map((t: any) => (
              <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }}>
                <input type="checkbox" checked={assignedIds.has(t.id)} onChange={() => toggle(t.id)} />
                <div style={{ fontWeight: 600 }}>{t.name}</div>
              </label>
            )) : <p>No teams found. Create one in Admin → Teams.</p>}
          </div>
        )}
      </div>
    </div>
  );
}


