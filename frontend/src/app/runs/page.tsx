"use client";
import AuthGuard from "@/components/AuthGuard";

export default function RunsPage() {
  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
        <h1>Runs</h1>
        <p>Coming soon: list recent runs for the signed-in user.</p>
      </div>
    </AuthGuard>
  );
}


