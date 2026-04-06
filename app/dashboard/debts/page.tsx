import { DebtForm } from "@/components/debt-form";
import { DebtPaymentForm } from "@/components/debt-payment-form";
import { DebtTable } from "@/components/debt-table";
import { KpiCards } from "@/components/kpi-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDebtsData, type DebtStatusFilter } from "@/lib/debts";
import { requireRole } from "@/lib/auth/session";
import { formatCurrency, formatDateLabel, formatDateTime } from "@/lib/formatters";

type DebtsPageProps = {
  searchParams?: Promise<{
    pay?: string;
    status?: string;
  }>;
};

export default async function DebtsPage({ searchParams }: DebtsPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const status =
    params?.status === "pending" ||
    params?.status === "partial" ||
    params?.status === "paid"
      ? (params.status as DebtStatusFilter)
      : "all";
  const debtsData = await getDebtsData({
    ...(params?.pay ? { payDebtId: String(params.pay) } : {}),
    status,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deudas y abonos parciales</CardTitle>
          <CardDescription>
            Controla compromisos pendientes, registra pagos parciales y manten el
            saldo pendiente visible sin depender de calculos manuales.
          </CardDescription>
        </CardHeader>
      </Card>

      <KpiCards
        items={[
          {
            helper: "Monto original acumulado en las deudas visibles",
            label: "Monto comprometido",
            value: formatCurrency(debtsData.summary.totalAmountUsd),
          },
          {
            helper: "Suma de abonos ya registrados",
            label: "Total abonado",
            value: formatCurrency(debtsData.summary.totalPaidUsd),
          },
          {
            helper: "Saldo pendiente vivo para las deudas visibles",
            label: "Saldo pendiente",
            tone:
              debtsData.summary.openBalanceUsd > 0 ? "warning" : "success",
            value: formatCurrency(debtsData.summary.openBalanceUsd),
          },
          {
            helper: "Cantidad de deudas en pending o partial",
            label: "Deudas abiertas",
            tone:
              debtsData.summary.pendingCount + debtsData.summary.partialCount > 0
                ? "warning"
                : "success",
            value: String(
              debtsData.summary.pendingCount + debtsData.summary.partialCount,
            ),
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DebtTable
          debts={debtsData.debts}
          status={debtsData.filters.status}
          {...(debtsData.filters.payDebtId
            ? { selectedDebtId: debtsData.filters.payDebtId }
            : {})}
        />

        <div className="space-y-6">
          {!debtsData.migrationReady ? (
            <Card className="border-amber-200 bg-amber-50/70">
              <CardHeader>
                <CardTitle>Migracion pendiente en Supabase</CardTitle>
                <CardDescription>
                  El modulo de deudas ya esta listo en la app, pero la migracion
                  `0006_debts_repairs.sql` todavia no esta aplicada en la base real.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Crear deuda</CardTitle>
              <CardDescription>
                Registra compromisos financieros nuevos y vinculos opcionales con
                registros diarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debtsData.migrationReady ? (
                <DebtForm
                  busOptions={debtsData.busOptions}
                  recordOptions={debtsData.recordOptions}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Aplica la migracion de Sprint 5 para habilitar la persistencia de
                  deudas y pagos parciales.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {debtsData.selectedDebt ? "Registrar pago parcial" : "Selecciona una deuda"}
              </CardTitle>
              <CardDescription>
                {debtsData.selectedDebt
                  ? "Cada abono recalcula saldo pendiente y actualiza el estado entre pending, partial y paid."
                  : "Usa la tabla de la izquierda para elegir una deuda y registrar el siguiente abono."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {debtsData.migrationReady && debtsData.selectedDebt ? (
                <>
                  <DebtPaymentForm
                    key={debtsData.selectedDebt.id}
                    debt={debtsData.selectedDebt}
                  />

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Historial de pagos
                      </p>
                    </div>
                    {debtsData.paymentHistory.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Esta deuda todavia no tiene abonos registrados.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-3xl border border-border">
                        <table className="min-w-full divide-y divide-border text-sm">
                          <thead className="bg-muted/60 text-left text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3">Abono</th>
                              <th className="px-4 py-3">Notas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white/70">
                            {debtsData.paymentHistory.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-4 py-3">
                                  <div>
                                    <p>{formatDateLabel(payment.paymentDate)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(payment.createdAt)}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                  {formatCurrency(payment.amountUsd)}
                                </td>
                                <td className="px-4 py-3">
                                  {payment.notes?.trim() ? payment.notes : "--"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : debtsData.migrationReady ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Todavia no hay una deuda seleccionada para abonos.
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  La vista quedara operativa apenas la base tenga aplicada la
                  migracion de Sprint 5.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
