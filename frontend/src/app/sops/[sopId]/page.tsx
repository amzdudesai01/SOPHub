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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState<string>("");
  const [aiDept, setAiDept] = useState<string>("");
  const [aiOutline, setAiOutline] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
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
    setDraft(data.content_json?.html || data.content_md || "");
    setTitleDraft(data.title || "");
    setDeptDraft(data.department || "");
    setEditing(true);
  }
  async function save() {
    try {
      // derive a plain-text fallback from HTML for search/steps parse
      const el = document.createElement("div");
      el.innerHTML = draft || "";
      const plain = (el.textContent || "").trim();
      const res = await fetchWithAuth(`/sops/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleDraft, department: deptDraft, content_md: plain, content_json: { html: draft } }),
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
    <div className="sop-root" style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>
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
            <>
              <DocxStyles />
              <RichTextEditor initialHtml={data.content_json?.html || data.content_md || ""} onSaveHtml={(html)=>{ setDraft(html); }} />
            </>
          ) : (
            <div className="card" style={{ padding: 16, borderRadius: 14, border: "1px solid #e5e7eb" }}>
              {data.content_json?.html ? (
                <>
                  <DocxStyles />
                  <HtmlWithMedia html={data.content_json.html} />
                </>
              ) : (
                <pre style={{ background: "#f6f8fa", padding: 12, whiteSpace: "pre-wrap", borderRadius: 10 }}>{data.content_md || "(No content)"}</pre>
              )}
            </div>
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
        {tab === "qa" && <QaEditor sopId={data.id} />}
        {tab === "templates" && <TemplatesEditor sopId={data.id} />}
        {tab === "changelog" && <ChangeLogViewer sopId={data.id} />}
      </div>

      {/* Desktop floating actions on the left; hidden on mobile */}
      <aside className="sop-actions-desktop" style={{ position: "fixed", left: 12, top: 120, display: "flex", flexDirection: "column", gap: 8, zIndex: 60 }}>
        <RunPrimaryButton sopNumericId={data.id} onStarted={(runId) => location.assign(`/runs/${runId}`)} />
        {(meRole === "admin" || meRole === "dept_lead" || meRole === "editor") && (
          <button className="btn-secondary" onClick={()=>setAiOpen(true)}>AI Draft</button>
        )}
        {!editing ? (
          (meRole === "admin" || meRole === "dept_lead" || meRole === "editor") ? (
            <button className="btn-secondary" onClick={beginEdit}>Edit</button>
          ) : null
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
      </aside>

      <div className="sop-actions-inline" style={{ display: "none", gap: 8, marginTop: 16 }}>
        <RunPrimaryButton sopNumericId={data.id} onStarted={(runId) => location.assign(`/runs/${runId}`)} />
        {(meRole === "admin" || meRole === "dept_lead" || meRole === "editor") && (
          <button className="btn-secondary" onClick={()=>setAiOpen(true)}>AI Draft</button>
        )}
        {!editing ? (
          (meRole === "admin" || meRole === "dept_lead" || meRole === "editor") ? (
            <button className="btn-secondary" onClick={beginEdit}>Edit</button>
          ) : null
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
      {aiOpen && (
        <AiDraftModal onClose={()=>setAiOpen(false)} onApply={(html)=>{ setDraft(html); setEditing(true); setAiOpen(false); }} defaultTitle={data.title} defaultDept={data.department} />
      )}
      <style jsx>{``}</style>
      <style jsx global>{`
        .sop-root { zoom: 0.85; }
        .sop-root .btn-primary, .sop-root .btn-secondary { padding: 8px 12px; font-size: 14px; border-radius: 10px; }
      `}</style>
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

function AiDraftModal({ onClose, onApply, defaultTitle, defaultDept }: { onClose: () => void; onApply: (html: string) => void; defaultTitle?: string; defaultDept?: string; }) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [dept, setDept] = useState(defaultDept || "");
  const [outline, setOutline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function generate() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/ai/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, department: dept, outline }) });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      // Convert markdown-ish text to simple HTML (minimal)
      const html = data.draft_md.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
      onApply(html);
    } catch (e: any) {
      setError(String(e));
    } finally { setBusy(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, width: "min(820px, 94vw)", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>AI Draft — Create SOP</div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
          <input value={dept} onChange={(e)=>setDept(e.target.value)} placeholder="Department" style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }} />
          <textarea value={outline} onChange={(e)=>setOutline(e.target.value)} placeholder="Optional outline: bullet points or notes" style={{ width: "100%", minHeight: 140, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }} />
        </div>
        {error && <p style={{ color: "#b00020", marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn-primary" disabled={busy} onClick={generate}>{busy?"Generating…":"Generate"}</button>
        </div>
      </div>
    </div>
  );
}

function AiCleanButton({ html, md, onApply }: { html?: string; md?: string; onApply: (html: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function clean() {
    setBusy(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/ai/clean`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text_html: html||null, text_md: md||null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      const converted = data.clean_md.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
      onApply(converted);
    } catch (e) { alert(String(e)); } finally { setBusy(false); }
  }
  return <button className="btn-secondary" onClick={clean} disabled={busy}>{busy?"Cleaning…":"AI Clean"}</button>;
}


function HtmlWithMedia({ html }: { html: string }) {
  // Prefix relative /media URLs with API base, so Next serves from backend host
  const base = getApiBaseUrl();
  const rewritten = html.replace(/src=("|')\s*(\/media\/[^"'>\s]+)("|')/g, (m, q1, path, q3) => `src=${q1}${base}${path}${q3}`);
  return (
    <div className="docx-html" dangerouslySetInnerHTML={{ __html: rewritten }}>
    </div>
  );
}

// Scoped styles for DOCX-rendered HTML to match Word-like spacing and visible tables
function DocxStyles() {
  return (
    <style jsx global>{`
      .docx-html { line-height: 1.65; font-size: 16px; }
      .docx-html h1, .docx-html h2, .docx-html h3 { margin: 18px 0 8px; line-height: 1.25; }
      .docx-html p { margin: 10px 0; }
      .docx-html ul, .docx-html ol { margin: 10px 0; padding-left: 26px; }
      .docx-html ul { list-style: disc outside; }
      .docx-html ol { list-style: decimal outside; }
      .docx-html li { margin: 6px 0; }
      .docx-html li::marker { color: #3a3a3a; font-size: 1.1em; }
      .docx-html ul ul, .docx-html ol ol, .docx-html ul ol, .docx-html ol ul { margin-top: 6px; }
      .docx-html img { max-width: 100%; height: auto; }
      .docx-html table { width: 100%; border-collapse: collapse; margin: 14px 0; }
      .docx-html th, .docx-html td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
      .docx-html thead th { background: #fafafa; font-weight: 600; }
      .docx-html td p { margin: 6px 0; }
    `}</style>
  );
}

// Minimal rich-text editor using contentEditable for HTML parity with the overview
function RichTextEditor({ initialHtml, onSaveHtml }: { initialHtml: string; onSaveHtml: (html: string) => void }) {
  const [value, setValue] = useState<string>(initialHtml);
  const ref = (node: HTMLDivElement | null) => {
    if (node && node.innerHTML !== value) node.innerHTML = value;
  };
  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    setValue((e.target as HTMLDivElement).innerHTML);
    onSaveHtml((e.target as HTMLDivElement).innerHTML);
  }
  return (
    <div className="docx-html" contentEditable suppressContentEditableWarning ref={ref} onInput={handleInput} style={{ minHeight: 260, border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }} />
  );
}

function QaEditor({ sopId }: { sopId: number }) {
  const [text, setText] = useState<string>("");
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ color: "#666", marginBottom: 8 }}>Define acceptance criteria operators must meet.</div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="List QA criteria…" style={{ width: "100%", minHeight: 160, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }} />
    </div>
  );
}

function TemplatesEditor({ sopId }: { sopId: number }) {
  const [text, setText] = useState<string>("");
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ color: "#666", marginBottom: 8 }}>Reusable snippets, email drafts, CSV formats, etc.</div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Add templates or snippets…" style={{ width: "100%", minHeight: 160, border: "1px solid #e5e7eb", borderRadius: 12, padding: 10 }} />
    </div>
  );
}

function ChangeLogViewer({ sopId }: { sopId: number }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ color: "#666" }}>Version history will appear here (author, date, summary).</div>
    </div>
  );
}


