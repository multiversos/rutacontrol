import Link from "next/link";

import { OperationalCashAdjustmentForm } from "@/components/operational-cash-adjustment-form";
import { OperationalCashExportButton } from "@/components/operational-cash-export-button";
import { OperationalCashFilters } from "@/components/operational-cash-filters";
import { OperationalCashMovementsTable } from "@/components/operational-cash-movements-table";
import { OperationalCashSummary } from "@/components/operational-cash-summary";
import { OperationalCashTrendChart } from "@/components/operational-cash-trend-chart";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getBusinessTodayDate } from "@/lib/formatters";
import {
  getOperationalCashLedgerData,
  normalizeOperationalCashFilters,
} from "@/lib/operational-cash";

type OperationalCashPageProps = {
  searchParams?: Promise<{
    busId?: string;
    direction?: string;
    from?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    to?: string;
    type?: string;
  }>;
};

export default async function OperationalCashPage({
  searchParams,
}: OperationalCashPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const filters = normalizeOperationalCashFilters(params);
  const ledgerData = await getOperationalCashLedgerData(filters);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Caja operativa</CardTitle>
            <CardDescription>
              Historial completo del dinero disponible generado por los buses,
              pagos de deuda y ajustes administrativos.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <OperationalCashAdjustmentForm defaultDate={getBusinessTodayDate()} />
            <OperationalCashExportButton movements={ledgerData.exportMovements} />
            <Link
              className={buttonVariants({
                variant: "secondary",
              })}
              href="/dashboard"
            >
              Volver al resumen
            </Link>
          </div>
        </CardHeader>
      </Card>

      {!ledgerData.migrationReady ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-5 text-sm text-amber-800">
            La Caja operativa ya está integrada en la app, pero falta aplicar la
            migración del ledger en esta base.
          </CardContent>
        </Card>
      ) : ledgerData.errorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {ledgerData.errorMessage}
          </CardContent>
        </Card>
      ) : (
        <>
          <OperationalCashSummary
            balanceUsd={ledgerData.balanceUsd}
            filteredInUsd={ledgerData.filteredInUsd}
            filteredNetUsd={ledgerData.filteredNetUsd}
            filteredOutUsd={ledgerData.filteredOutUsd}
            lastMovement={ledgerData.lastMovement}
            movementCount={ledgerData.pageInfo.totalItems}
          />

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                La URL conserva el rango, tipo, dirección, bus y búsqueda aplicada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OperationalCashFilters
                busOptions={ledgerData.busOptions}
                filters={ledgerData.filters}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolución de caja</CardTitle>
              <CardDescription>
                Saldo acumulado por día calculado desde todo el ledger.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OperationalCashTrendChart points={ledgerData.trendPoints} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Movimientos</CardTitle>
              <CardDescription>
                Cada línea conserva su relación operativa y el saldo acumulado real
                hasta ese movimiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OperationalCashMovementsTable
                filters={ledgerData.filters}
                movements={ledgerData.paginatedMovements}
                pageInfo={ledgerData.pageInfo}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
