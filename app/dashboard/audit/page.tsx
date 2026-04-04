import { AuditTable } from "@/components/audit-table";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/session";
import { getDailyAuditData } from "@/lib/dashboard";

type AuditPageProps = {
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireRole("admin");
  const params = searchParams ? await searchParams : undefined;
  const auditData = await getDailyAuditData({
    busId: undefined,
    dateFrom: params?.dateFrom ? String(params.dateFrom) : undefined,
    dateTo: params?.dateTo ? String(params.dateTo) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badges={[{ label: `${auditData.entries.length} eventos`, variant: "muted" }]}
        description="Revisa quien creo, actualizo o cerro registros diarios y cuando ocurrio cada evento."
        eyebrow="Monitoreo"
        title="Auditoria operativa"
      />

      <AuditTable entries={auditData.entries} filters={auditData.filters} />
    </div>
  );
}
