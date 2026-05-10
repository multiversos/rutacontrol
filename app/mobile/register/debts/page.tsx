import Link from "next/link";
import {
  ArrowLeftRight,
  LockKeyhole,
  WalletCards,
} from "lucide-react";

import { DebtForm } from "@/components/debt-form";
import { DebtPaymentForm } from "@/components/debt-payment-form";
import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileListItem } from "@/components/mobile/mobile-list-item";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getDebtsData, type DebtStatusFilter } from "@/lib/debts";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";

type MobileDebtsPageProps = {
  searchParams?: Promise<{
    amountUsd?: string;
    creditor?: string;
    debtQuery?: string;
    notes?: string;
    pay?: string;
    payDebt?: string;
    paymentAmountUsd?: string;
    paymentDate?: string;
    samantha?: string;
    status?: string;
  }>;
};

function cleanText(value: string | undefined, maxLength = 500) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function cleanNumber(value: string | undefined) {
  const text = cleanText(value);
  return text && /^\d+(\.\d+)?$/.test(text) ? text : undefined;
}

function cleanDate(value: string | undefined) {
  const text = cleanText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

export default async function MobileDebtsPage({
  searchParams,
}: MobileDebtsPageProps) {
  const context = await requireAuth({ redirectTo: "/mobile/register/debts" });

  if (context.profile.role !== "admin") {
    return (
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Las deudas conservan el mismo alcance administrativo que en la web actual."
            title="Deudas para administracion"
          />
          <div className="flex gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              No se abrieron permisos nuevos en movil. Si eres registrador, sigue
              operando desde cierres y gastos complementarios.
            </p>
          </div>
          <Link
            className={buttonVariants({
              className: "w-full",
              variant: "outline",
            })}
            href="/mobile/register"
          >
            Volver a Registrar
          </Link>
        </CardContent>
      </Card>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const status =
    params?.status === "pending" ||
    params?.status === "partial" ||
    params?.status === "paid"
      ? (params.status as DebtStatusFilter)
      : "all";
  const payDebtQuery = cleanText(params?.payDebt ?? params?.debtQuery, 160);
  const debtsData = await getDebtsData({
    ...(params?.pay ? { payDebtId: String(params.pay) } : {}),
    ...(payDebtQuery ? { payDebtQuery } : {}),
    status,
  });
  const samanthaDefaults = params?.samantha
    ? {
        amountUsd: cleanNumber(params.amountUsd),
        creditor: cleanText(params.creditor, 160),
      }
    : {};
  const samanthaPaymentDefaults = params?.samantha
    ? {
        amountUsd: cleanNumber(params.paymentAmountUsd),
        notes: cleanText(params.notes, 500),
        paymentDate: cleanDate(params.paymentDate),
      }
    : {};
  const openDebts = debtsData.debts.filter((debt) => debt.status !== "paid");
  const visibleDebts = (openDebts.length > 0 ? openDebts : debtsData.debts).slice(0, 8);

  return (
    <div className="space-y-4">
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <MobileSectionHeader
              description="Flujo movil real para crear deudas y, si hace falta, registrar abonos sin salir de la shell."
              title="Deudas"
            />
            <Badge variant="default">Solo admin</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MobileStatCard
              helper="Saldo abierto visible en deudas pendientes y parciales."
              label="Saldo pendiente"
              tone={
                debtsData.summary.openBalanceUsd > 0 ? "warning" : "success"
              }
              value={formatCurrency(debtsData.summary.openBalanceUsd)}
            />
            <MobileStatCard
              helper="Compromisos abiertos visibles para esta sesion."
              label="Deudas abiertas"
              tone={
                debtsData.summary.pendingCount + debtsData.summary.partialCount > 0
                  ? "warning"
                  : "success"
              }
              value={String(
                debtsData.summary.pendingCount + debtsData.summary.partialCount,
              )}
            />
            <MobileStatCard
              helper="Total ya abonado sobre las deudas visibles."
              label="Total abonado"
              value={formatCurrency(debtsData.summary.totalPaidUsd)}
            />
            <MobileStatCard
              helper="Monto original comprometido en las deudas visibles."
              label="Monto comprometido"
              value={formatCurrency(debtsData.summary.totalAmountUsd)}
            />
          </div>
        </CardContent>
      </Card>

      {!debtsData.migrationReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="space-y-3 p-5">
            <MobileSectionHeader
              description="La app ya soporta el modulo movil, pero este entorno todavia no tiene la migracion de Sprint 5 aplicada."
              title="Modulo pendiente en base de datos"
            />
          </CardContent>
        </Card>
      ) : (
        <DebtForm
          createAnotherHref="/mobile/register/debts?new=1"
          defaultAmountUsd={samanthaDefaults.amountUsd}
          defaultCreditor={samanthaDefaults.creditor}
          mode="mobile"
          successContinueHref="/mobile/register"
          successContinueLabel="Volver a Registrar"
        />
      )}

      {debtsData.migrationReady && debtsData.selectedDebt ? (
        <Card className="bg-white/88">
          <CardContent className="space-y-4 p-5">
            <MobileSectionHeader
              description="Reutiliza la misma accion de abonos parciales del modulo web."
              title="Registrar abono"
            />
            <DebtPaymentForm
              debt={debtsData.selectedDebt}
              defaultAmountUsd={samanthaPaymentDefaults.amountUsd}
              defaultNotes={samanthaPaymentDefaults.notes}
              defaultPaymentDate={samanthaPaymentDefaults.paymentDate}
              mode="mobile"
            />

            {debtsData.paymentHistory.length === 0 ? (
              <MobileEmptyState
                description="Esta deuda todavia no tiene abonos registrados."
                icon={ArrowLeftRight}
                title="Sin historial de pagos"
              />
            ) : (
              <div className="space-y-3">
                {debtsData.paymentHistory.map((payment) => (
                  <MobileListItem
                    key={payment.id}
                    badge={<Badge variant="muted">{formatCurrency(payment.amountUsd)}</Badge>}
                    description={payment.notes?.trim() ? payment.notes : "Sin notas"}
                    icon={ArrowLeftRight}
                    meta={formatDateTime(payment.createdAt)}
                    title={formatDateLabel(payment.paymentDate)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Lectura rapida de las deudas visibles para seguir operando desde telefono."
            title="Deudas visibles"
          />

          {visibleDebts.length === 0 ? (
            <MobileEmptyState
              description="No hay deudas visibles para mostrar en este momento."
              icon={WalletCards}
              title="Sin deudas visibles"
            />
          ) : (
            <div className="space-y-3">
              {visibleDebts.map((debt) => (
                <MobileListItem
                  key={debt.id}
                  badge={
                    <Badge
                      variant={
                        debt.status === "paid"
                          ? "success"
                          : debt.status === "partial"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {debt.status === "paid"
                        ? "Saldada"
                        : debt.status === "partial"
                          ? "Parcial"
                          : "Pendiente"}
                    </Badge>
                  }
                  description={`${debt.description} · saldo ${formatCurrency(debt.balanceDueUsd)}`}
                  icon={WalletCards}
                  meta={
                    debt.dailyRecordLabel ??
                    debt.busCode ??
                    (debt.dueDate ? `Vence ${formatDateLabel(debt.dueDate)}` : "Sin relacion directa")
                  }
                  title={debt.creditor}
                  {...(debt.status !== "paid"
                    ? { href: `/mobile/register/debts?pay=${debt.id}` }
                    : {})}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Accesos conectados con el resto de la operacion diaria movil."
            title="Siguientes pasos"
          />
          <div className="grid gap-3">
            <MobileActionTile
              description="Registrar gastos complementarios ligados a borradores operativos."
              href="/mobile/register/expenses"
              icon={ArrowLeftRight}
              label="Ir a Gastos"
            />
            <MobileActionTile
              description="Abrir el modulo web completo de deudas y pagos parciales."
              href="/dashboard/debts"
              icon={WalletCards}
              label="Abrir modulo completo"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
