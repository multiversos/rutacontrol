import { MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { MobileOperationalGuard } from "@/components/mobile/mobile-operational-guard";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Profile } from "@/lib/auth/types";
import { formatDateLabel, getBusinessTodayDate } from "@/lib/formatters";
import { getMobileSections } from "@/lib/mobile-navigation";

type MobileShellProps = {
  children: React.ReactNode;
  profile: Profile;
};

export function MobileShell({ children, profile }: MobileShellProps) {
  const todayLabel = formatDateLabel(getBusinessTodayDate());
  const navItems = getMobileSections(profile.role);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_24%),linear-gradient(180deg,#f8fbfd_0%,#eef4f8_100%)]">
      <MobileOperationalGuard />
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-[calc(1rem+var(--safe-left))] pb-[calc(var(--mobile-tabbar-height)+var(--safe-bottom)+1rem)] pr-[calc(1rem+var(--safe-right))] pt-[calc(var(--safe-top)+1rem)]">
        <header className="sticky top-[calc(var(--safe-top)+0.5rem)] z-20">
          <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.1)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <MobileSectionHeader
                className="flex-1"
                description="Experiencia movil separada, conectada al mismo backend y auth actuales."
                eyebrow="RutaControl movil"
                title="Operacion en telefono"
              />
              <Badge variant="default">{ROLE_LABELS[profile.role]}</Badge>
            </div>

            <div className="mt-4 rounded-[24px] bg-slate-50/85 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-slate-500">{profile.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="muted">Fecha {todayLabel}</Badge>
                  <Badge variant="muted">Sesion protegida</Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-4">{children}</main>
      </div>

      <MobileTabBar items={navItems} />
    </div>
  );
}
