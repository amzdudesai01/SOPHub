"use client";
import AdminGuard from "@/components/AdminGuard";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";
import { useState } from "react";
import { fetchWithAuthForm } from "@/lib/auth";

function fetcher(key: string) { return fetchWithAuth(key).then(r => r.json()); }

export default function AdminSopsAccess() {
  const { data: sops, mutate: mutateSops } = useSWR("/sops", fetcher);
  const { data: teams } = useSWR("/teams", fetcher);
  const [selSop, setSelSop] = useState<number | null>(null);
  const [selTeam, setSelTeam] = useState<number | null>(null);
  async function assign() {
    if (!selSop || !selTeam) return;
    await fetchWithAuth(`/admin/sops/${selSop}/teams?team_id=${selTeam}`, { method: "POST" });
    alert("Assigned");
    mutateSops();
  }
  const [manageSop, setManageSop] = useState<any|null>(null);
  function openManage(id: number) {
    const s = (sops||[]).find((x: any) => x.id === id) || null;
    setManageSop(s);
  }
  return (
    <AdminGuard>
      <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
        <h1>SOP Access</h1>
        <p style={{ color: "#666" }}>Assign teams to SOPs</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select onChange={(e) => setSelSop(Number(e.target.value) || null)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", flex: "1 1 280px" }}>
            <option value="">Select SOP</option>
            {sops?.map((s: any) => (<option key={s.id} value={s.id}>{s.title} (#{s.id})</option>))}
          </select>
          <select onChange={(e) => setSelTeam(Number(e.target.value) || null)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", flex: "1 1 220px" }}>
            <option value="">Select Team</option>
            {teams?.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
          <button onClick={assign} style={{ padding: "10px 16px", borderRadius: 10 }}>Assign</button>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Import DOCX</h3>
          <ImportForm onImported={()=>mutateSops()} />
        </div>
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#fafafa" }}>
              <tr><th align="left">SOP</th><th align="left">Department</th><th align="left">Status</th><th align="left">Teams</th><th align="left">Actions</th></tr>
            </thead>
            <tbody>
              {(sops||[]).map((s: any) => (
                <SopRow key={s.id} sop={s} onChanged={()=>mutateSops()} onManage={()=>openManage(s.id)} />
              ))}
            </tbody>
          </table>
        </div>
        <SopTeamManagerModal open={!!manageSop} sop={manageSop} onClose={()=>setManageSop(null)} />
      </div>
    </AdminGuard>
  );
}

function SopTeams({ sopId }: { sopId: number }) {
  const { data } = useSWR(`/admin/sops/${sopId}/teams`, fetcher);
  if (!data) return <span>Loading…</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {data.length === 0 ? <span style={{ color: "#888" }}>(unrestricted)</span> : data.map((t: any) => (
        <span key={t.id} style={{ padding: "4px 10px", borderRadius: 999, background: "#f6f7f9", border: "1px solid #e5e7eb" }}>{t.name || `Team ${t.id}`}</span>
      ))}
    </div>
  );
}

function SopTeamManagerModal({ open, sop, onClose }: { open: boolean; sop: any; onClose: () => void }) {
  const { data: allTeams } = useSWR("/teams", fetcher);
  const { data, mutate } = useSWR(open && sop ? `/admin/sops/${sop.id}/teams` : null, fetcher);
  if (!open || !sop) return null;
  const assignedIds = new Set<number>((data||[]).map((t: any) => t.id));
  async function toggle(teamId: number) {
    if (assignedIds.has(teamId)) {
      await fetchWithAuth(`/admin/sops/${sop.id}/teams?team_id=${teamId}`, { method: "DELETE" });
    } else {
      await fetchWithAuth(`/admin/sops/${sop.id}/teams?team_id=${teamId}`, { method: "POST" });
    }
    mutate();
  }
  async function clearAll() {
    await fetchWithAuth(`/admin/sops/${sop.id}/teams`, { method: "DELETE" });
    mutate();
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, width: "min(700px, 94vw)", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Manage SOP Teams — {sop.title}</div>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <button className="btn-secondary" onClick={clearAll}>Clear all (unrestrict)</button>
          <div />
        </div>
      </div>
    </div>
  );
}

function ImportForm({ onImported }: { onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [sopId, setSopId] = useState("");
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !sopId || !title || !dept) return alert("Fill all fields");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("sop_id", sopId);
      form.append("title", title);
      form.append("department", dept);
      form.append("file", file);
      await fetchWithAuthForm(`/sops/import_docx`, form);
      setFile(null); setSopId(""); setTitle(""); setDept("");
      onImported();
      alert("Imported.");
    } catch (e) {
      alert(String(e));
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
      <input value={sopId} onChange={(e)=>setSopId(e.target.value)} placeholder="SOP ID (unique)" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
      <input value={dept} onChange={(e)=>setDept(e.target.value)} placeholder="Department" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
      <input type="file" accept=".docx" onChange={(e)=>setFile(e.target.files?.[0] || null)} style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
      <div>
        <button className="btn-primary" disabled={busy} type="submit">{busy?"Importing…":"Import"}</button>
      </div>
    </form>
  );
}

function SopRow({ sop, onChanged, onManage }: { sop: any; onChanged: () => void; onManage: () => void }) {
  const [title, setTitle] = useState<string>(sop.title);
  const [dept, setDept] = useState<string>(sop.department);
  const [busy, setBusy] = useState(false);
  async function saveInline() {
    setBusy(true);
    try {
      await fetchWithAuth(`/sops/${sop.id}`, { method: "PATCH", body: JSON.stringify({ title, department: dept }) });
      onChanged();
    } catch (e) { alert(String(e)); } finally { setBusy(false); }
  }
  async function remove() {
    const okay = confirm(`Delete '${sop.title}' permanently? This cannot be undone.`);
    if (!okay) return;
    try {
      await fetchWithAuth(`/sops/${sop.id}`, { method: "DELETE" });
      onChanged();
    } catch (e) { alert(String(e)); }
  }
  return (
    <tr style={{ borderTop: "1px solid #f0f0f0" }}>
      <td style={{ padding: "8px 10px" }}>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} style={{ width: 220, padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }} />
      </td>
      <td style={{ padding: "8px 10px" }}>
        <input value={dept} onChange={(e)=>setDept(e.target.value)} style={{ width: 180, padding: 8, borderRadius: 10, border: "1px solid #e5e7eb" }} />
      </td>
      <td style={{ padding: "8px 10px" }}>{sop.status}</td>
      <td style={{ padding: "8px 10px" }}><SopTeams sopId={sop.id} /></td>
      <td style={{ padding: "8px 10px", display: "flex", gap: 6 }}>
        <button className="btn-secondary" onClick={onManage}>Manage</button>
        <button className="btn-primary" onClick={saveInline} disabled={busy}>{busy?"Saving…":"Save"}</button>
        <button className="btn-secondary" onClick={remove}>Delete</button>
      </td>
    </tr>
  );
}


