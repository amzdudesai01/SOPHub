"use client";
import useSWR from "swr";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/auth";

async function fetcher() {
  const res = await fetchWithAuth("/sops");
  return res.json();
}

export default function SopListPage() {
  const { data, error, isLoading, mutate } = useSWR("/sops", fetcher);
  if (isLoading) return <Section title="My SOPs" subtitle="SOPs you can access based on your teams" body={<p>Loading…</p>} />;
  if (error) return <Section title="My SOPs" subtitle="SOPs you can access based on your teams" body={<p style={{ color: "red" }}>{String(error)}</p>} />;
  return (
    <Section
      title="My SOPs"
      subtitle="SOPs you can access based on your teams"
      body={
        <ul>
          {data?.map((s: any) => (
            <li key={s.id}>
              <Link href={`/sops/${encodeURIComponent(s.sop_id)}`}>{s.title} ({s.sop_id})</Link>
            </li>
          ))}
        </ul>
      }
    />
  );
}

function Section({ title, subtitle, body }: { title: string; subtitle?: string; body: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1>{title}</h1>
      {subtitle && <p style={{ color: "#666", marginTop: 4 }}>{subtitle}</p>}
      <div style={{ marginTop: 12 }}>{body}</div>
    </div>
  );
}


