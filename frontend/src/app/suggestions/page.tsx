"use client";
import AuthGuard from "@/components/AuthGuard";

export default function SuggestionsPage() {
  return (
    <AuthGuard>
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
        <h1>Suggestions</h1>
        <p>Coming soon: list your suggestions and statuses.</p>
      </div>
    </AuthGuard>
  );
}


