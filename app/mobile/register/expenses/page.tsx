import Link from "next/link";
import { ReceiptText, SquarePen, Wallet } from "lucide-react";

import { BusIdentity } from "@/components/buses/bus-identity";
import { ExpenseForm } from "@/components/expense-form";
import { MobileActionTile } from "@/components/mobile/mobile-action-tile";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileSectionHeader } from "@/components/mobile/mobile-section-header";
import { MobileStatCard } from "@/components/mobile/mobile-stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getExpenseFormData } from "@/lib/expenses";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";

type MobileExpensesPageProps = {
  searchParams?: Promise<{
    recordId?: string;
  }>;
};

const categoryLabels = {
  fuel: "Gasoil",
  other: "Otros",
  worker_payment: "Pago a trabajadores",
} as const;

export default async function MobileExpensesPage({
  searchParams,
}: MobileExpensesPageProps) {
  const context = await requireAuth({ redirectTo: "/mobile/register/expenses" });
  const params = searchParams ? await searchParams : undefined;
  const expenseData = await getExpenseFormData({
    role: context.profile.role,
    userId: context.user.id,
  });
  const selectedRecordId = params?.recordId ? String(params.recordId) : undefined;

  return (
    <div className="space-y-4">
      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <MobileSectionHeader
              description="Detalle complementario de gastos ligado a registros diarios en borrador, sin cambiar la logica operativa principal."
              title="Gastos"
            />
            <Badge variant="warning">Complementario</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MobileStatCard
              helper="Borradores visibles donde aun puedes adjuntar detalle de gastos."
              label="Borradores disponibles"
              tone={
                expenseData.summary.availableDraftRecords > 0
                  ? "success"
                  : "warning"
              }
              value={String(expenseData.summary.availableDraftRecords)}
            />
            <MobileStatCard
              helper="Detalle complementario visible sobre la fecha operativa actual."
              label="Gastos del dia"
              value={String(expenseData.summary.todayExpenseCount)}
            />
            <MobileStatCard
              helper="Monto USD visible en los gastos ligados a la fecha operativa actual."
              label="USD detallados hoy"
              value={formatCurrency(expenseData.summary.todayExpenseUsd)}
            />
            <MobileStatCard
              helper={`Fecha operativa ${formatDateLabel(expenseData.businessDate)}.`}
              label="Categorias"
              value={String(expenseData.categoryOptions.length)}
            />
          </div>
        </CardContent>
      </Card>

      {!expenseData.migrationReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="space-y-3 p-5">
            <MobileSectionHeader
              description="Este entorno todavia no tiene disponible la tabla de gastos complementarios."
              title="Modulo pendiente en base de datos"
            />
          </CardContent>
        </Card>
      ) : expenseData.draftRecordOptions.length === 0 ? (
        <MobileEmptyState
          action={
            <Link
              className={buttonVariants({
                className: "w-full",
              })}
              href="/mobile/register"
            >
              Ir a Registrar
            </Link>
          }
          description="Primero necesitas un registro diario en borrador para asociar el detalle complementario del gasto."
          icon={SquarePen}
          title="Sin borradores disponibles"
        />
      ) : (
        <ExpenseForm
          categoryOptions={expenseData.categoryOptions}
          createAnotherHref="/mobile/register/expenses"
          draftRecordOptions={expenseData.draftRecordOptions}
          successContinueHref="/mobile/register"
          successContinueLabel="Volver a Registrar"
          {...(selectedRecordId ? { defaultRecordId: selectedRecordId } : {})}
        />
      )}

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Ultimos detalles visibles para validar soporte, categoria y relacion con la operacion diaria."
            title="Actividad reciente"
          />

          {expenseData.recentExpenses.length === 0 ? (
            <MobileEmptyState
              description="Todavia no hay gastos complementarios visibles para mostrar."
              icon={ReceiptText}
              title="Sin gastos recientes"
            />
          ) : (
            <div className="space-y-3">
              {expenseData.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <BusIdentity
                      className="min-w-0"
                      code={expense.busCode}
                      photoUrl={expense.busPhotoUrl}
                      plate={expense.busPlate}
                      secondaryText={`Fecha ${expense.recordDate}`}
                      size="sm"
                      wrap
                    />
                    <Badge variant="muted">{categoryLabels[expense.category]}</Badge>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Monto
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(expense.amountUsd)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {expense.amountBs ? `${expense.amountBs} Bs` : "Sin monto Bs"}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Registrado
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDateTime(expense.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {expense.description?.trim() || "Sin descripcion adicional."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/88">
        <CardContent className="space-y-4 p-5">
          <MobileSectionHeader
            description="Accesos conectados con el resto de la operacion movil actual."
            title="Siguientes pasos"
          />
          <div className="grid gap-3">
            <MobileActionTile
              description="Volver al cierre diario principal y continuar la operacion."
              href="/mobile/register"
              icon={SquarePen}
              label="Volver a Registrar"
            />
            <MobileActionTile
              description="Abrir tambien el flujo movil de deudas si necesitas cargar un compromiso pendiente."
              href="/mobile/register/debts"
              icon={Wallet}
              label="Ir a Deudas"
              {...(context.profile.role !== "admin" ? { disabled: true, badge: "Solo admin" } : {})}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
