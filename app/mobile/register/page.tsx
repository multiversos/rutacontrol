import {
  CalendarDays,
  ReceiptText,
  ShieldCheck,
  SquarePen,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import { BusIdentity } from "@/components/buses/bus-identity";
import { DailyForm } from "@/components/daily-form";
import { ConfigAlert } from "@/components/layout/config-alert";
import { LocalDateQuerySync } from "@/components/local-date-query-sync";
import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getDailyFormContext } from "@/lib/daily-record-form";
import { isDateInputValue } from "@/lib/dates";
import {
  formatCurrency,
  formatDateLabel,
  formatDateTime,
} from "@/lib/formatters";
import { getMobileHomeData, getMobileRegisterActivity } from "@/lib/mobile";

type MobileRegisterPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function MobileRegisterPage({
  searchParams,
}: MobileRegisterPageProps) {
  const context = await requireAuth({ redirectTo: "/mobile/register" });
  const params = searchParams ? await searchParams : undefined;
  const businessDate = isDateInputValue(params?.date) ? params.date : undefined;
  const [homeData, formContext, registerActivity] = await Promise.all([
    getMobileHomeData({
      businessDate,
      role: context.profile.role,
      userId: context.user.id,
    }),
    getDailyFormContext(),
    getMobileRegisterActivity({
      businessDate,
      role: context.profile.role,
      userId: context.user.id,
    }),
  ]);

  const registerStats =
    homeData.mode === "admin"
      ? [
          {
            helper: "Registros visibles para la fecha operativa actual.",
            label: "Registros del dia",
            value: String(homeData.recentRecordCount),
          },
          {
            helper: "Alertas no leidas visibles en el alcance actual.",
            label: "Alertas no leidas",
            tone:
              homeData.unreadAlertCount > 0
                ? ("warning" as const)
                : ("success" as const),
            value: String(homeData.unreadAlertCount),
          },
        ]
      : [
          {
            helper: "Registros visibles para la fecha operativa actual.",
            label: "Registros del dia",
            value: String(homeData.todayRecordCount),
          },
          {
            helper: "Diferencias abiertas visibles hoy.",
            label: "Diferencias",
            tone:
              homeData.openDifferenceCount > 0
                ? ("danger" as const)
                : ("success" as const),
            value: String(homeData.openDifferenceCount),
          },
        ];

  return (
    <div className="space-y-4">
      <LocalDateQuerySync currentDate={homeData.businessDate} />

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <MobileSectionHeader
              description="Formulario movil real para crear registros diarios usando las mismas reglas y validaciones de la app web."
              title="Registrar"
            />
            <Badge variant="default">Flujo activo</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {registerStats.map((item) => (
              <MobileStatCard
                key={item.label}
                helper={item.helper}
                label={item.label}
                {...(item.tone ? { tone: item.tone } : {})}
                value={item.value}
              />
            ))}
          </div>

          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              El guardado usa el mismo `saveDailyRecordAction`, el mismo schema
              `dailyRecordSchema` y las mismas validaciones de permisos, bus
              activo y registro unico por bus/fecha.
            </p>
          </div>
        </CardContent>
      </Card>

      {formContext.loadError ? (
        <ConfigAlert
          message={formContext.loadError}
          title="No pudimos preparar el formulario"
        />
      ) : (
        <DailyForm
          buses={formContext.buses}
          createAnotherHref="/mobile/register?new=1"
          currentUserId={context.profile.id}
          existingRecords={formContext.existingRecords}
          mode="mobile"
          successContinueHref="/mobile"
          successContinueLabel="Volver a Inicio"
        />
      )}

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Salta entre las tareas operativas basicas sin depender del dashboard desktop."
            title="Tareas conectadas"
          />
          <div className="grid gap-3">
            <MobileActionTile
              description="Adjunta detalle complementario sobre registros en borrador."
              href="/mobile/register/expenses"
              icon={ReceiptText}
              label="Registrar gasto"
            />
            <MobileActionTile
              description="Crea compromisos pendientes y registra abonos parciales desde movil."
              disabled={context.profile.role !== "admin"}
              href="/mobile/register/debts"
              icon={WalletCards}
              label="Registrar deuda"
              {...(context.profile.role !== "admin" ? { badge: "Solo admin" } : {})}
            />
            <MobileActionTile
              description="Revisa alertas reales del sistema y prioriza pendientes."
              disabled={context.profile.role !== "admin"}
              href="/mobile/alerts"
              icon={TriangleAlert}
              label="Ver alertas"
              {...(context.profile.role !== "admin" ? { badge: "Solo admin" } : {})}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Lectura rapida del dia para seguir operando sin abrir tablas densas."
            title="Actividad reciente"
          />

          {registerActivity.records.length === 0 ? (
            <MobileEmptyState
              description="Todavia no hay registros visibles para mostrar en esta fecha operativa."
              icon={SquarePen}
              title="Sin registros recientes"
            />
          ) : (
            <div className="space-y-3">
              {registerActivity.records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <BusIdentity
                      className="min-w-0"
                      code={record.busCode}
                      photoUrl={record.busPhotoUrl}
                      plate={record.busPlate}
                      secondaryText={
                        record.userName && context.profile.role === "admin"
                          ? record.userName
                          : null
                      }
                      size="sm"
                      wrap
                    />
                    <Badge
                      variant={record.status === "closed" ? "success" : "warning"}
                    >
                      {record.status === "closed" ? "Cerrado" : "Borrador"}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Diferencia
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(record.difference)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Ultimo movimiento
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDateTime(record.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Reglas que se mantienen intactas tambien en la experiencia movil."
            title="Garantias del flujo"
          />

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Roles, RLS y restricciones actuales siguen iguales. El
                registrador crea nuevos cierres, y la edicion sigue reservada
                segun el flujo existente.
              </p>
            </div>
            <div className="flex gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Fecha operativa actual: {formatDateLabel(registerActivity.businessDate)}.
                El bloqueo final y el recalculo siguen ocurriendo en servidor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
