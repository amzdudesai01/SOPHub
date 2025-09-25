"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import SuggestModal from "@/components/SuggestModal";
import Confetti from "@/components/Confetti";

function fetcher(key: string) { return fetchWithAuth(key).then((r) => r.json()); }

export default function RunDetailPage() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const { data: run, error, mutate } = useSWR(`/runs/${runId}`, fetcher);
  const { data: sop } = useSWR(run ? `/sops/by-id/${run.sop_id}` : null, fetcher);
  const steps = useMemo(() => parseSteps(sop?.content_md || ""), [sop]);
  const [index, setIndex] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => { setIndex(0); }, [run?.id]);

  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;
  if (!run || !sop) return <p>Loading…</p>;

  const total = Math.max(steps.length, 1);
  const percent = Math.round(((index) / total) * 100);

  async function next() {
    const stepNo = index + 1;
    try { await fetchWithAuth(`/runs/${run.id}/check?step_no=${stepNo}`, { method: "PATCH" }); } catch {}
    if (index < total - 1) setIndex(index + 1);
  }
  function prev() { if (index > 0) setIndex(index - 1); }
  async function complete(passed: boolean) {
    await fetchWithAuth(`/runs/${run.id}/complete?passed=${passed}`, { method: "POST" });
    setCelebrate(true);
    setTimeout(()=>setCelebrate(false), 1700);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 16 }}>
        <div style={{ fontWeight: 700 }}>{sop.title}</div>
        <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, marginTop: 8 }}>
          <div style={{ width: `${percent}%`, height: 4, background: "#111", borderRadius: 4 }} />
        </div>
      </header>
      {/* Two-pane layout on desktop, single column on mobile */}
      <main className="run-grid" style={{ flex: 1, display: "flex", gap: 16, padding: 24, paddingBottom: 160 }}>
        {/* Left: progress + steps list */}
        <aside className="run-sidebar card" style={{ padding: 12, height: "fit-content" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Progress</div>
          <div style={{ height: 6, background: "#f0f0f0", borderRadius: 6 }}>
            <div style={{ width: `${percent}%`, height: 6, background: "#0a84ff", borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{percent}% complete</div>
          <div style={{ fontWeight: 600, marginTop: 14, marginBottom: 6 }}>Steps</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {steps.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => setIndex(i)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: i === index ? "#eef5ff" : "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 8,
                    color: i === index ? "#0a84ff" : "inherit",
                  }}
                >
                  <span style={{ fontWeight: 600, marginRight: 6 }}>{i + 1}.</span>
                  <span style={{ opacity: 0.9 }}>{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
        {/* Right: content + sticky controls (desktop) */}
        <section className="run-content" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "min(840px, 100%)", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Step {index + 1} of {total}</div>
            <div style={{ fontSize: 28, lineHeight: 1.35 }}>{steps[index] || sop.title}</div>
          </div>
          <div className="dock-desktop" style={{ position: "sticky", bottom: 24, marginTop: 24, display: "none", justifyContent: "center" }}>
            <div style={{ padding: 10, background: "#fff", border: "1px solid #eee", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.06)", display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={prev} disabled={index === 0}>Prev</button>
              {index < total - 1 ? (
                <button className="btn-primary" onClick={next}>Next</button>
              ) : (
                <button className="btn-primary" onClick={() => complete(true)}>Complete</button>
              )}
              <SuggestControl sopId={sop.id} runId={run.id} />
            </div>
          </div>
        </section>
      </main>
      {/* Mobile dock above bottom navbar */}
      <footer className="dock-mobile" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 100, padding: 10, background: "#fff", border: "1px solid #eee", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.06)", display: "flex", gap: 8, justifyContent: "center", zIndex: 40 }}>
        <button className="btn-secondary" onClick={prev} disabled={index === 0}>Prev</button>
        {index < total - 1 ? (
          <button className="btn-primary" onClick={next}>Next</button>
        ) : (
          <button className="btn-primary" onClick={() => complete(true)}>Complete</button>
        )}
        <SuggestControl sopId={sop.id} runId={run.id} />
      </footer>
      <Confetti show={celebrate} />
      <style jsx>{`
        /* Collapse to single column by default */
        .run-sidebar { display: none; }
        .run-grid { flex-direction: column; }
        .dock-mobile { display: flex; }
        .dock-desktop { display: none; }
        /* Desktop */
        @media (min-width: 1024px) {
          .run-grid { flex-direction: row; }
          .run-sidebar { display: block; width: 320px; }
          .dock-mobile { display: none; }
          .dock-desktop { display: flex; }
        }
      `}</style>
    </div>
  );
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
    } else if (line.trim()) {
      current.push(line.trim());
    }
  }
  if (current.length) steps.push(current.join(" ").trim());
  return steps.length ? steps : [md || ""];
}

function SuggestControl({ sopId, runId }: { sopId: number; runId: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>Suggest</button>
      <SuggestModal open={open} onClose={() => setOpen(false)} sopId={sopId} runId={runId} />
    </>
  );
}


