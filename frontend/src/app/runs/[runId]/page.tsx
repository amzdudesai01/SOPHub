"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";

function fetcher(key: string) {
  return fetchWithAuth(key).then((r) => r.json());
}

export default function RunDetailPage() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;
  const { data, error, mutate } = useSWR(`/runs/${runId}`, fetcher);
  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;
  if (!data) return <p>Loading…</p>;
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1>Run #{data.id}</h1>
      <p style={{ color: "#666" }}>SOP ID: {data.sop_id} • User: {data.user_id}</p>
      <p>Started: {data.started_at || "-"} • Completed: {data.completed_at || "-"}</p>
      <h3 style={{ marginTop: 16 }}>Actions</h3>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => checkStep(Number(runId), 1, mutate)}>Check step 1</button>
        <button onClick={() => completeRun(Number(runId), true, mutate)}>Complete (passed)</button>
      </div>
    </div>
  );
}

async function checkStep(runId: number, stepNo: number, mutate: () => void) {
  try {
    await fetchWithAuth(`/runs/${runId}/check?step_no=${stepNo}`, { method: "PATCH" });
    mutate();
  } catch (e) {
    alert(String(e));
  }
}

async function completeRun(runId: number, passed: boolean, mutate: () => void) {
  try {
    await fetchWithAuth(`/runs/${runId}/complete?passed=${passed}`, { method: "POST" });
    mutate();
  } catch (e) {
    alert(String(e));
  }
}


