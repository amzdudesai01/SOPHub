"use client";
import AdminGuard from "@/components/AdminGuard";
import Link from "next/link";

export default function AdminHome() {
  return (
    <AdminGuard>
      <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
        <h1>Admin</h1>
        <p style={{ color: "#666", marginTop: 4 }}>Manage users, teams, and SOP access.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 16 }}>
          <Card title="Users" desc="Set roles and assign teams" href="/admin/users" />
          <Card title="Teams" desc="Create and manage teams" href="/admin/teams" />
          <Card title="SOP Access" desc="Assign teams to SOPs" href="/admin/sops" />
          <Card title="Analytics" desc="Usage, completion, suggestions" href="/analytics" />
        </div>
      </div>
    </AdminGuard>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} style={{
      display: "block",
      padding: 16,
      borderRadius: 14,
      background: "#fff",
      border: "1px solid #eee",
      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      transition: "transform .15s ease, box-shadow .15s ease",
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)")}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ color: "#666" }}>{desc}</div>
    </Link>
  );
}


