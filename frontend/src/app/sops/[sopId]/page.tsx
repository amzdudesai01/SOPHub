"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth, getApiBaseUrl } from "@/lib/auth";
import { useEffect, useState } from "react";
import SuggestModal from "@/components/SuggestModal";
import Confetti from "@/components/Confetti";


function sopFetcher(key: string) {
  return fetchWithAuth(key).then((r) => r.json());
}

export default function SopDetailPage() {
  const params = useParams<{ sopId: string }>();
  const router = useRouter();
  const sopId = decodeURIComponent(params.sopId);
  const { data, error, mutate } = useSWR(`/sops/${sopId}`, sopFetcher);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [deptDraft, setDeptDraft] = useState<string>("");
  const [tab, setTab] = useState<"overview"|"steps"|"qa"|"templates"|"changelog">("overview");
  const [celebrate, setCelebrate] = useState(false);
  const [meRole, setMeRole] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try { const me = await fetchWithAuth(`/auth/me`).then(r=>r.json()); if (active) setMeRole(me.role || null); }
      catch { if (active) setMeRole(null); }
    }
    load();
    return () => { active = false; };
  }, []);
  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;
  if (!data) return <p>Loading…</p>;
  function beginEdit() {
    setDraft(data.content_md || "");
    setTitleDraft(data.title || "");
    setDeptDraft(data.department || "");
    setEditing(true);
  }
  async function save() {
    try {
      const res = await fetchWithAuth(`/sops/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleDraft, department: deptDraft, content_md: draft }),
      });
      await res.json();
      setEditing(false);
      location.reload();
    } catch (e) {
      alert(String(e));
    }
  }
  async function publish() {
    try {
      const res = await fetchWithAuth(`/sops/${data.id}/publish`, { method: "POST" });
      await res.json();
      setCelebrate(true);
      setTimeout(()=>setCelebrate(false), 1700);
      location.reload();
    } catch (e) { alert(String(e)); }
  }
  const steps = parseSteps(data.content_md || "");
  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>
      {!editing ? (
        <>
          <h1 style={{ fontSize: 34 }}>{data.title}</h1>
          <p style={{ color: "#666", marginTop: 4 }}>Department: {data.department} • Status: {data.status} <span style={{ padding: "2px 8px", borderRadius: 999, border: "1px solid #e5e7eb", marginLeft: 6 }}>v{data.version}</span></p>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 8, alignItems: "center" }}>
          <input value={titleDraft} onChange={(e)=>setTitleDraft(e.target.value)} placeholder="Title" style={{ fontSize: 28, padding: 10, border: "1px solid #ddd", borderRadius: 12 }} />
          <input value={deptDraft} onChange={(e)=>setDeptDraft(e.target.value)} placeholder="Department" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ display: "inline-flex", gap: 6, border: "1px solid #e5e7eb", borderRadius: 999, padding: 4, marginTop: 12 }}>
        {[
          {k: "overview", label: "Overview"},
          {k: "steps", label: "Steps"},
          {k: "qa", label: "QA"},
          {k: "templates", label: "Templates"},
          {k: "changelog", label: "Change Log"},
        ].map((t: any) => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: tab===t.k?"#111":"transparent", color: tab===t.k?"#fff":"#111" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "overview" && (
          editing ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={{ width: "100%", minHeight: 260 }} />
          ) : (
            data.content_json?.html ? (
              <HtmlWithMedia html={data.content_json.html} />
            ) : (
              <pre style={{ background: "#f6f8fa", padding: 12, whiteSpace: "pre-wrap" }}>{data.content_md || "(No content)"}</pre>
            )
          )
        )}
        {tab === "steps" && (
          steps.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Step {i+1}</div>
                  <div>{s}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No structured steps detected. Use Overview.</p>
          )
        )}
        {tab === "qa" && <p>(QA criteria coming soon)</p>}
        {tab === "templates" && <p>(Templates coming soon)</p>}
        {tab === "changelog" && <p>(Change log coming soon)</p>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <RunPrimaryButton sopNumericId={data.id} onStarted={(runId) => location.assign(`/runs/${runId}`)} />
        {!editing ? (
          <button className="btn-secondary" onClick={beginEdit}>Edit</button>
        ) : (
          <>
            <button className="btn-primary" onClick={save}>Save</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </>
        )}
        {(meRole === "admin" || meRole === "dept_lead") && (
          <button className="btn-primary" onClick={publish}>Publish</button>
        )}
        <SuggestInline sopId={data.id} />
      </div>
      <Confetti show={celebrate} />
    </div>
  );
}

function RunPrimaryButton({ sopNumericId, onStarted }: { sopNumericId: number; onStarted: (runId: number) => void }) {
  async function start() {
    try {
      // fetch current user to set user_id
      const me = await fetchWithAuth(`/auth/me`).then(r=>r.json());
      const res = await fetchWithAuth(`/runs`, { method: "POST", body: JSON.stringify({ sop_id: sopNumericId, user_id: Number(me.sub) || 0 }) });
      const run = await res.json();
      onStarted(run.id);
    } catch (e) {
      alert(String(e));
    }
  }
  return <button className="btn-primary" onClick={start}>Run this SOP</button>;
}

function parseSteps(md: string): string[] {
  const lines = md.split(/\r?\n/);
  const steps: string[] = [];
  let current: string[] = [];
  const isStep = (line: string) => /^\s*(\d+)[\).\-]/.test(line.trim());
  for (const line of lines) {
    if (isStep(line)) {
      if (current.length) steps.push(current.join(" ").trim());
      current = [line.replace(/^\s*\d+[\).\-]\s*/, "")];
    } else {
      if (line.trim().length) current.push(line.trim());
    }
  }
  if (current.length) steps.push(current.join(" ").trim());
  return steps;
}

function SuggestInline({ sopId }: { sopId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>Suggest</button>
      <SuggestModal open={open} onClose={() => setOpen(false)} sopId={sopId} />
    </>
  );
}


function HtmlWithMedia({ html }: { html: string }) {
  // Prefix relative /media URLs with API base, so Next serves from backend host
  const base = getApiBaseUrl();
  const rewritten = html.replace(/src=("|')\s*(\/media\/[^"'>\s]+)("|')/g, (m, q1, path, q3) => `src=${q1}${base}${path}${q3}`);
  return <div dangerouslySetInnerHTML={{ __html: rewritten }} />;
}


