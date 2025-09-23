"use client";
import { useState } from "react";
import { setToken, fetchWithAuth, getApiBaseUrl } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setToken(data.access_token);
      router.push("/sops");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(60% 60% at 50% -10%, #eef4ff 0%, #ffffff 60%), linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "100%",
          background: "#fff",
          border: "1px solid #ececec",
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <h1 style={{ margin: "8px 0" }}>Welcome back</h1>
          <p style={{ color: "#667", margin: 0 }}>
            Enter your email to sign in. New emails are created automatically for dev.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          <div style={{ margin: "12px 0" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
              }}
            />
          </div>
          <div style={{ margin: "12px 0" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{ color: "#b00020", background: "#ffe9ec", padding: 10, borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 16px",
              marginTop: 12,
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </form>

        <div style={{ marginTop: 16, color: "#667", fontSize: 14 }}>
          <p style={{ margin: 0 }}>
            Tip: Use your pre‑seeded emails (e.g., admin, editor, contributor, viewer) to test
            role‑based access.
          </p>
        </div>
      </div>
    </div>
  );
}


