import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAuth } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireAuth();

  return (
    <DashboardShell profile={context.profile}>{children}</DashboardShell>
  );
}
