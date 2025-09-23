"use client";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function ClientFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/login");
  return (
    <>
      {children}
      {!hideNav && <BottomNav />}
    </>
  );
}


