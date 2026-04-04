import { notFound } from "next/navigation";

import { BusAlertsSummary } from "@/components/bus-alerts-summary";
import { BusDebtSummary } from "@/components/bus-debt-summary";
import { BusFinancialSummary } from "@/components/bus-financial-summary";
import { BusMaintenanceHistory } from "@/components/bus-maintenance-history";
import { BusOperationalHistory } from "@/components/bus-operational-history";
import { BusProfileHeader } from "@/components/bus-profile-header";
import { BusProfileKpis } from "@/components/bus-profile-kpis";
import { BusRepairHistory } from "@/components/bus-repair-history";
import { requireRole } from "@/lib/auth/session";
import { getBusProfileData } from "@/lib/bus-profile";

type BusProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
    recordStatus?: "all" | "closed" | "draft";
  }>;
};

export default async function BusProfilePage({
  params,
  searchParams,
}: BusProfilePageProps) {
  await requireRole("admin");

  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = {
    ...(resolvedSearchParams?.dateFrom
      ? { dateFrom: resolvedSearchParams.dateFrom }
      : {}),
    ...(resolvedSearchParams?.dateTo ? { dateTo: resolvedSearchParams.dateTo } : {}),
    ...(resolvedSearchParams?.recordStatus
      ? { recordStatus: resolvedSearchParams.recordStatus }
      : {}),
  };

  const profile = await getBusProfileData(resolvedParams.id, filters);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BusProfileHeader summary={profile.summary} />
      <BusProfileKpis items={profile.kpis} />
      <BusOperationalHistory
        filters={profile.filters}
        records={profile.operationHistory}
      />
      <BusFinancialSummary summary={profile.financialSummary} />
      <BusMaintenanceHistory
        busId={profile.summary.bus.id}
        componentHistory={profile.maintenance.componentHistory}
        currentCycles={profile.maintenance.currentCycles}
        maintenanceRecords={profile.maintenance.maintenanceRecords}
        nextMaintenance={profile.summary.nextMaintenance}
      />
      <BusRepairHistory
        busId={profile.summary.bus.id}
        nextServiceSuggestion={profile.repairs.nextServiceSuggestion}
        repairs={profile.repairs.repairs}
      />
      <BusDebtSummary
        associatedDebts={profile.debtSummary.associatedDebts}
        openBalanceUsd={profile.debtSummary.openBalanceUsd}
      />
      <BusAlertsSummary alerts={profile.alerts} busId={profile.summary.bus.id} />
    </div>
  );
}
