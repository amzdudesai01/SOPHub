"use client";
import AuthGuard from "@/components/AuthGuard";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

function fetcher(key: string) { return fetchWithAuth(key).then(r => r.json()); }

export default function SuggestionsPage() {
  const { data, mutate } = useSWR("/suggestions", fetcher);
  const [filter, setFilter] = useState<string>("");
  const filtered = (data || []).filter((s: any) => !filter || s.status === filter);
  async function setStatus(id: number, status: string) {
    await fetchWithAuth(`/suggestions/${id}?status=${encodeURIComponent(status)}`, { method: "PATCH" });
    mutate();
  }
  const [review, setReview] = useState<any|null>(null);
  return (
    <AuthGuard>
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <h1>Suggestions</h1>
        <div style={{ marginTop: 8 }}>
          <select onChange={(e)=>setFilter(e.target.value)} style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd" }}>
            <option value="">All</option>
            <option value="queued">queued</option>
            <option value="review">review</option>
            <option value="merged">merged</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          {!data ? <p>Loading…</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#fafafa" }}>
                <tr><th align="left">ID</th><th align="left">SOP</th><th align="left">User</th><th align="left">Status</th><th align="left">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td>{s.id}</td>
                    <td>{s.sop_id}</td>
                    <td>{s.user_id}</td>
                    <td>{s.status}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-secondary" onClick={()=>setReview(s)}>Review</button>
                      <button className="btn-primary" onClick={()=>setStatus(s.id, "merged")}>Accept</button>
                      <button className="btn-secondary" onClick={()=>setStatus(s.id, "rejected")}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ReviewModal open={!!review} suggestion={review} onClose={()=>{ setReview(null); mutate(); }} />
    </AuthGuard>
  );
}

function ReviewModal({ open, suggestion, onClose }: { open: boolean; suggestion: any; onClose: () => void }) {
  const [sop, setSop] = useState<any|null>(null);
  const [appliedText, setAppliedText] = useState<string>("");
  useEffect(() => {
    let active = true;
    async function load() {
      if (!suggestion) return;
      try {
        const s = await fetchWithAuth(`/sops/by-id/${suggestion.sop_id}`).then(r=>r.json());
        if (!active) return;
        setSop(s);
        setAppliedText(s.content_md || "");
      } catch {}
    }
    if (open) load();
    return () => { active = false; };
  }, [open, suggestion]);
  if (!open || !suggestion) return null;
  async function accept() {
    await fetchWithAuth(`/suggestions/${suggestion.id}?status=merged`, { method: "PATCH" });
    onClose();
  }
  async function reject() {
    await fetchWithAuth(`/suggestions/${suggestion.id}?status=rejected`, { method: "PATCH" });
    onClose();
  }
  async function applyAndAccept() {
    if (!sop) return;
    try {
      await fetchWithAuth(`/sops/${sop.id}`, { method: "PATCH", body: JSON.stringify({ content_md: appliedText }) });
      await fetchWithAuth(`/suggestions/${suggestion.id}?status=merged`, { method: "PATCH" });
      onClose();
      alert("Applied and accepted.");
    } catch (e) { alert(String(e)); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, width: "min(1100px, 96vw)", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Review Suggestion #{suggestion.id}</div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Current SOP</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{sop?.content_md || "(empty)"}</pre>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Suggestion</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{suggestion.raw_text || "(no text)"}</pre>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Apply changes (optional)</div>
          <textarea value={appliedText} onChange={(e)=>setAppliedText(e.target.value)} style={{ width: "100%", minHeight: 160, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn-secondary" onClick={reject}>Reject</button>
          <button className="btn-secondary" onClick={accept}>Accept</button>
          <button className="btn-primary" onClick={applyAndAccept}>Apply + Accept</button>
        </div>
      </div>
    </div>
  );
}


