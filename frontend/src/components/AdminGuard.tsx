"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/auth/me");
        const me = await res.json();
        if (!cancelled) setAllowed(me.role === "admin");
      } catch {
        if (!cancelled) setAllowed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (allowed === null) return <p style={{ padding: 24 }}>Checking access…</p>;
  if (!allowed) return <p style={{ padding: 24, color: "#b00020" }}>403 — Admins only</p>;
  return <>{children}</>;
}


