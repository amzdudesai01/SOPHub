"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";

function sopFetcher(key: string) {
  return fetchWithAuth(key).then((r) => r.json());
}

export default function SopDetailPage() {
  const params = useParams<{ sopId: string }>();
  const router = useRouter();
  const sopId = decodeURIComponent(params.sopId);
  const { data, error, mutate } = useSWR(`/sops/${sopId}`, sopFetcher);
  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;
  if (!data) return <p>Loading…</p>;
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1>{data.title}</h1>
      <p style={{ color: "#666", marginTop: 4 }}>Department: {data.department} • Status: {data.status} v{data.version}</p>
      <h3 style={{ marginTop: 16 }}>Overview</h3>
      <pre style={{ background: "#f6f8fa", padding: 12, whiteSpace: "pre-wrap" }}>{data.content_md || "(No markdown — use Admin to create/edit)"}</pre>
      <h3 style={{ marginTop: 16 }}>Actions</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <StartRunButton sopNumericId={data.id} onStarted={(runId) => location.assign(`/runs/${runId}`)} />
      </div>
    </div>
  );
}

function StartRunButton({ sopNumericId, onStarted }: { sopNumericId: number; onStarted: (runId: number) => void }) {
  async function start() {
    try {
      const res = await fetchWithAuth(`/runs`, {
        method: "POST",
        body: JSON.stringify({ sop_id: sopNumericId, user_id: 0 }),
      });
      const run = await res.json();
      onStarted(run.id);
    } catch (e) {
      alert(String(e));
    }
  }
  return <button onClick={start}>Start Run</button>;
}


