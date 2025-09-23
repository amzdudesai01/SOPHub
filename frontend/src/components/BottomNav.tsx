"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken, fetchWithAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: 12,
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const authed = !!getToken();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authed) {
        setRole(null);
        return;
      }
      try {
        const res = await fetchWithAuth("/auth/me");
        const me = await res.json();
        if (!cancelled) setRole(me.role);
      } catch {
        if (!cancelled) setRole(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "saturate(180%) blur(12px)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 20,
        padding: 8,
        display: "flex",
        gap: 8,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        zIndex: 50,
      }}
    >
      <Link href="/sops" style={{ ...itemStyle, background: pathname.startsWith("/sops") ? "#eee" : "transparent" }}>
        <span>📄</span>
        <small>My SOPs</small>
      </Link>
      <Link href="/runs" style={{ ...itemStyle, background: pathname.startsWith("/runs") ? "#eee" : "transparent" }}>
        <span>✅</span>
        <small>Runs</small>
      </Link>
      <Link href="/suggestions" style={{ ...itemStyle, background: pathname.startsWith("/suggestions") ? "#eee" : "transparent" }}>
        <span>💡</span>
        <small>Suggest</small>
      </Link>
      {role === "admin" && (
        <Link href="/admin" style={{ ...itemStyle, background: pathname.startsWith("/admin") ? "#eee" : "transparent" }}>
          <span>🛠️</span>
          <small>Admin</small>
        </Link>
      )}
      {authed ? (
        <button onClick={logout} style={{ ...itemStyle }}>🚪
          <small>Logout</small>
        </button>
      ) : (
        <Link href="/login" style={{ ...itemStyle }}>🔐
          <small>Login</small>
        </Link>
      )}
    </div>
  );
}


