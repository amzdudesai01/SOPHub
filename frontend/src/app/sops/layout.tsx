import AuthGuard from "@/components/AuthGuard";

export default function SopSectionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}


