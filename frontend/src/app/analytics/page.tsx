"use client";
import AuthGuard from "@/components/AuthGuard";
import useSWR from "swr";
import { fetchWithAuth } from "@/lib/auth";

function fetcher(key: string) { return fetchWithAuth(key).then(r=>r.json()); }

export default function AnalyticsPage() {
  const { data: runs } = useSWR("/runs", fetcher);
  const { data: suggestions } = useSWR("/suggestions", fetcher);
  const { data: sops } = useSWR("/sops", fetcher);

  const totalRuns = (runs || []).length;
  const completedRuns = (runs || []).filter((r: any) => r.status === "completed").length;
  const openSuggestions = (suggestions || []).filter((s: any) => s.status !== "merged" && s.status !== "rejected").length;
  const publishedSops = (sops || []).filter((s: any) => s.status === "published").length;

  return (
    <AuthGuard>
      <div style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
        <h1>Analytics</h1>
        <p style={{ color: "#666", marginTop: 4 }}>Key activity metrics at a glance.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          <MetricCard title="Total Runs" value={totalRuns} hint="Last 90 days" />
          <MetricCard title="Completed Runs" value={completedRuns} hint="Quality & throughput" />
          <MetricCard title="Open Suggestions" value={openSuggestions} hint="Queue health" />
          <MetricCard title="Published SOPs" value={publishedSops} hint="Adoption" />
        </div>
      </div>
    </AuthGuard>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: number; hint?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ color: "#666", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ color: "#888", fontSize: 12 }}>{hint}</div>}
    </div>
  );
}


