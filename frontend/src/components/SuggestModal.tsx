"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function SuggestModal({ open, onClose, sopId, runId }: { open: boolean; onClose: () => void; sopId: number; runId?: number; }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open) { setText(""); } }, [open]);
  if (!open) return null;
  async function submit() {
    setSubmitting(true);
    try {
      const me = await fetchWithAuth(`/auth/me`).then(r=>r.json());
      await fetchWithAuth(`/suggestions`, { method: "POST", body: JSON.stringify({ sop_id: sopId, user_id: Number(me.sub)||0, raw_text: text, source_run_id: runId||null }) });
      onClose();
      alert("Suggestion submitted. Thank you!");
    } catch (e) {
      alert(String(e));
    } finally { setSubmitting(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, width: "min(680px, 92vw)", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Suggest Improvement</div>
        <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Describe the improvement, add context/evidence links…" style={{ width: "100%", minHeight: 160, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={submitting || !text.trim()}>Submit</button>
        </div>
      </div>
    </div>
  );
}


