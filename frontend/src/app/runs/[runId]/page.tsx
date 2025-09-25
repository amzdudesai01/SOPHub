"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth, getApiBaseUrl } from "@/lib/auth";
// remove invalid import; local helpers defined below
import { useEffect, useMemo, useState } from "react";
import SuggestModal from "@/components/SuggestModal";
import Confetti from "@/components/Confetti";

function fetcher(key: string) { return fetchWithAuth(key).then((r) => r.json()); }

export default function RunDetailPage() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const { data: run, error, mutate } = useSWR(`/runs/${runId}`, fetcher);
  const { data: sop } = useSWR(run ? `/sops/by-id/${run.sop_id}` : null, fetcher);
  type Step = { text: string; html?: string };
  const steps: Step[] = useMemo(() => {
    if (!sop) return [] as Step[];
    if (sop.content_json?.html) {
      const html = sop.content_json.html as string;
      const parsed = parseHtmlSegments(html);
      if (parsed.length) return parsed;
      return [{ text: stripHtml(html), html }];
    }
    return parseStepsFromText(sop.content_md || "").map(t => ({ text: t }));
  }, [sop]);
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
    <div className="run-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 16 }}>
        <div style={{ fontWeight: 700 }}>{sop.title}</div>
        <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, marginTop: 8 }}>
          <div style={{ width: `${percent}%`, height: 4, background: "#111", borderRadius: 4 }} />
        </div>
      </header>
      {/* Top controls */}
      <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 45, borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: 10 }}>
          <button className="btn-secondary" onClick={prev} disabled={index === 0}>Prev</button>
          {index < total - 1 ? (
            <button className="btn-primary" onClick={next}>Next</button>
          ) : (
            <button className="btn-primary" onClick={() => complete(true)}>Complete</button>
          )}
          <SuggestControl sopId={sop.id} runId={run.id} />
        </div>
      </div>
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
                  <span style={{ opacity: 0.9 }}>{(s.text||"").slice(0, 80)}{(s.text||"").length>80?"…":""}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
        {/* Right: content */}
        <section className="run-content" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 8 }}>
          <div style={{ width: "min(840px, 100%)", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Step {index + 1} of {total}</div>
            <div style={{ fontSize: 16, lineHeight: 1.6, textAlign: "left", whiteSpace: "pre-wrap" }}>
              {steps[index]?.html ? (
                <>
                  <DocxStylesLocal />
                  <HtmlWithMediaLocal html={steps[index]!.html!} />
                </>
              ) : (
                steps[index]?.text || sop.title
              )}
            </div>
          </div>
        </section>
      </main>
      {/* Remove bottom dock now that controls are at top */}
      <Confetti show={celebrate} />
      <style jsx>{`
        /* Collapse to single column by default */
        .run-sidebar { display: none; }
        .run-grid { flex-direction: column; }
        .dock-mobile { display: none; }
        .dock-desktop { display: none; }
        /* Desktop */
        @media (min-width: 1024px) {
          .run-grid { flex-direction: row; }
          .run-sidebar { display: block; width: 320px; }
          .dock-mobile { display: none; }
          .dock-desktop { display: none; }
        }
      `}</style>
      <style jsx global>{`
        .run-root { zoom: 0.85; }
        .run-root .btn-primary, .run-root .btn-secondary { padding: 8px 12px; font-size: 14px; border-radius: 10px; }
        .run-root header { padding-top: 10px; padding-bottom: 8px; }
      `}</style>
    </div>
  );
}

function parseStepsFromText(md: string): string[] {
  const text = (md || "").replace(/\r\n?/g, "\n");
  const lines = text.split(/\n/).map(l => l.replace(/\s+/g, ' ').trim());
  const headingRegex = /^(Phase\s*\d+\b.*|\d+\.\d+\s+.+|\d+\.\s+.+|Step\s*\d+\b.*)$/i;
  const headings: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (headingRegex.test(lines[i].trim())) headings.push(i);
  }
  if (headings.length >= 1) {
    const segments: string[] = [];
    for (let j = 0; j < headings.length; j++) {
      const start = headings[j];
      const end = j + 1 < headings.length ? headings[j + 1] : lines.length;
      const chunk = lines.slice(start, end).join("\n").trim();
      if (chunk) segments.push(chunk);
    }
    if (segments.length >= 2) return segments;
  }
  // fallback to simple numeric lines
  const simple = text.split(/\n+/).filter(l => /^\s*\d+[\).\-]\s+/.test(l)).map(l => l.replace(/^\s*\d+[\).\-]\s+/, "").trim());
  if (simple.length >= 2) return simple;
  return [text.trim()].filter(Boolean);
}

function parseStepsFromHtml(html: string): string[] {
  if (!html) return [];
  const container = document.createElement("div");
  container.innerHTML = html;
  const result: string[] = [];
  // Prefer ordered list items as steps
  const ols = Array.from(container.querySelectorAll("ol"));
  for (const ol of ols) {
    const items = Array.from(ol.querySelectorAll(":scope > li"));
    if (items.length >= 2) {
      for (const li of items) {
        const text = (li.textContent || "").replace(/\s+/g, " ").trim();
        if (text) result.push(text);
      }
      if (result.length) return result;
    }
  }
  // Build paragraph lines to detect real headings at line starts
  const blocks = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,li")) as HTMLElement[];
  const lines = blocks.map(el => (el.textContent || "").replace(/\s+/g, ' ').trim()).filter(Boolean);
  const dottedIdx: number[] = [];
  lines.forEach((l, i) => { if (/^\d+\.\d+\s+/.test(l)) dottedIdx.push(i); });
  if (dottedIdx.length >= 2) {
    const segments: string[] = [];
    for (let j = 0; j < dottedIdx.length; j++) {
      const start = dottedIdx[j];
      const end = j + 1 < dottedIdx.length ? dottedIdx[j + 1] : lines.length;
      segments.push(lines.slice(start, end).join(" "));
    }
    return segments.map(s => s.replace(/\s+/g, " ").trim());
  }
  // Heuristic 2: Phase headings
  const phaseIdx: number[] = [];
  lines.forEach((l, i) => { if (/^Phase\s*\d+/i.test(l)) phaseIdx.push(i); });
  if (phaseIdx.length >= 2) {
    const segments: string[] = [];
    for (let j = 0; j < phaseIdx.length; j++) {
      const start = phaseIdx[j];
      const end = j + 1 < phaseIdx.length ? phaseIdx[j + 1] : lines.length;
      segments.push(lines.slice(start, end).join(" "));
    }
    return segments.map(s => s.replace(/\s+/g, " ").trim());
  }
  // Fallback: any element whose text starts with a number and a dot or paren
  const numbered = lines.filter(l => /^\s*\d+[\).\-]\s+/.test(l)).map(l => l.replace(/^\s*\d+[\).\-]\s+/, "").trim());
  if (numbered.length) return numbered;
  // Final fallback: large paragraphs as single step
  const para = (container.textContent || "").trim();
  return para ? [para] : [];
}

function stripHtml(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

function parseHtmlSegments(html: string): { text: string; html: string }[] {
  // Split the HTML by headings (Phase, 1.1 etc.) and keep the inner HTML for rendering
  const container = document.createElement("div");
  container.innerHTML = html;
  const blocks = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,table,ul,ol,section"));
  const isHeading = (t: string) => /^Phase\s*\d+/i.test(t) || /^\d+\.\d+\s+/.test(t) || /^\d+\.\s+/.test(t) || /^General\s+Rules/i.test(t) || /^Step\s*\d+/i.test(t);
  const indices: number[] = [];
  const texts = blocks.map(b => (b.textContent || "").replace(/\s+/g, " ").trim());
  blocks.forEach((b, i) => { if (isHeading(texts[i])) indices.push(i); });
  if (indices.length < 1) return [];
  const segments: { text: string; html: string }[] = [];
  for (let j = 0; j < indices.length; j++) {
    const start = indices[j];
    const end = j + 1 < indices.length ? indices[j + 1] : blocks.length;
    const frag = document.createElement("div");
    for (let k = start; k < end; k++) {
      const node = blocks[k].cloneNode(true) as HTMLElement;
      if (node.tagName && node.tagName.toLowerCase() === 'table') {
        // ensure the whole table including header/body is copied
        frag.appendChild(node);
      } else {
        frag.appendChild(node);
      }
    }
    const segHtml = frag.innerHTML;
    const segText = texts.slice(start, end).join(" \n");
    segments.push({ text: segText, html: segHtml });
  }
  return segments;
}

function HtmlWithMediaLocal({ html }: { html: string }) {
  const base = getApiBaseUrl();
  const rewritten = html.replace(/src=("|')\s*(\/media\/[^"'>\s]+)("|')/g, (m, q1, path, q3) => `src=${q1}${base}${path}${q3}`);
  // Heuristic: remove textual reprints immediately following a table
  const container = document.createElement("div");
  container.innerHTML = rewritten;
  // If no real table exists but we detect the General Rules label/value pattern,
  // synthesize a two-column table for better readability
  if (!container.querySelector('table')) {
    const labels = [
      'Naming Consistency',
      'Budget Allocation',
      'Keyword Harvesting',
      'Negative Targeting',
      'Bid Strategy',
      'Placement Focus',
      'Data Review Frequency'
    ];
    const nodes = Array.from(container.querySelectorAll('p,div,li')) as HTMLElement[];
    const found: { label: string; value: string }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const text = (nodes[i].textContent || '').replace(/\s+/g,' ').trim();
      const label = labels.find(l => text.toLowerCase() === l.toLowerCase());
      if (label) {
        // value is the next non-empty sibling paragraph/div
        let j = i + 1; let val = '';
        while (j < nodes.length) {
          const vt = (nodes[j].textContent || '').replace(/\s+/g,' ').trim();
          if (vt) { val = vt; break; }
          j++;
        }
        if (val) found.push({ label, value: val });
      }
    }
    if (found.length >= 4) {
      const tblRows = found.map(r => `<tr><td><strong>${r.label}</strong></td><td>${r.value}</td></tr>`).join('');
      const tbl = `<table border="1" style="width:100%; border-collapse:collapse; margin:14px 0"><thead><tr><th>Element</th><th>Rule/Best Practice</th></tr></thead><tbody>${tblRows}</tbody></table>`;
      container.innerHTML = tbl;
    }
  }
  const tables = Array.from(container.querySelectorAll("table"));
  for (const table of tables) {
    const tableText = (table.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    // Build a set of normalized row strings for duplicate detection
    const rowSet = new Set<string>();
    const trs = Array.from(table.querySelectorAll("tr"));
    for (const tr of trs) {
      const cells = Array.from(tr.querySelectorAll("th,td"));
      const cellTexts = cells.map(c => (c.textContent || "").replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean);
      if (cellTexts.length) {
        rowSet.add(cellTexts.join(" "));
        for (const ct of cellTexts) rowSet.add(ct);
      }
    }
    let removed = 0;
    let sib = table.nextElementSibling as HTMLElement | null;
    while (sib && removed < 30) {
      const tag = sib.tagName.toLowerCase();
      if (tag !== "p" && tag !== "div" && tag !== "ul" && tag !== "ol") break;
      const t = (sib.textContent || "").trim();
      // stop when next section begins
      if (/(Targeting\s*&\s*Structure|Objective|Phase\s*\d+)/i.test(t)) break;
      // remove duplicate textual reprint of the table rows
      const norm = t.replace(/\s+/g, " ").trim().toLowerCase();
      const isList = tag === 'ul' || tag === 'ol';
      let listMatches = false;
      if (isList) {
        const items = Array.from(sib.querySelectorAll('li')).map(li => (li.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()).filter(Boolean);
        if (items.length) {
          const hits = items.filter(it => rowSet.has(it) || Array.from(rowSet).some(rs => rs.includes(it) || it.includes(rs)) || /\bPN-[A-Za-z0-9-]+/.test(it) || /(headline|video)\s*ads/.test(it));
          // consider it duplicate list if most items hit
          if (hits.length >= Math.max(1, Math.floor(items.length*0.6))) listMatches = true;
        }
      }
      const matchesRow = rowSet.has(norm) || Array.from(rowSet).some(rs => rs.startsWith(norm) || norm.startsWith(rs) || rs.includes(norm) || norm.includes(rs));
      if (listMatches
          || /^(Campaign\s*Type|Naming\s*Convention)$/i.test(t)
          || /^(Headline\s*Ads|Video\s*Ads)/i.test(t)
          || /\bPN-[A-Za-z0-9-]+/.test(t)
          || matchesRow
          || (norm.length > 0 && norm.length < 160 && tableText.includes(norm))) {
        const toRemove = sib;
        sib = sib.nextElementSibling as HTMLElement | null;
        toRemove.remove();
        removed++;
        continue;
      }
      break;
    }
  }
  // Keep table structure intact; also add minimal borders if missing
  const outHtml = container.innerHTML.replace(/<table(?![^>]*border)/g, '<table border="1"');
  return <div className="docx-html" dangerouslySetInnerHTML={{ __html: outHtml }} />;
}
function DocxStylesLocal() {
  return (
    <style jsx global>{`
      .docx-html { line-height: 1.65; font-size: 16px; }
      .docx-html p { margin: 10px 0; }
      .docx-html ul, .docx-html ol { margin: 10px 0; padding-left: 26px; }
      .docx-html ul { list-style: disc outside; }
      .docx-html ol { list-style: decimal outside; }
      .docx-html li { margin: 6px 0; }
      .docx-html img { max-width: 100%; height: auto; }
      .docx-html table { width: 100%; border-collapse: collapse; margin: 14px 0; }
      .docx-html th, .docx-html td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
      .docx-html thead th { background: #fafafa; font-weight: 600; }
    `}</style>
  );
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


