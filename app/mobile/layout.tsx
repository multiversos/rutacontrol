import { MobileShell } from "@/components/mobile/mobile-shell";
import { requireAuth } from "@/lib/auth/session";

export default async function MobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireAuth({ redirectTo: "/mobile" });

  return <MobileShell profile={context.profile}>{children}</MobileShell>;
}
