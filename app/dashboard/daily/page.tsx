import { DailyTable, type DailyFilters } from "@/components/daily-table";
import { KpiCards } from "@/components/kpi-cards";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

async function getDailyContext(filters: DailyFilters) {
  const supabase = await createClient();
  let recordsQuery = supabase
    .from("daily_records")
    .select(
      "id, bus_id, user_id, record_date, income_bs, exchange_rate, income_usd, fuel_cost, worker_payment, other_expenses, net_profit_usd, calculated_net, difference, status",
    )
    .order("record_date", { ascending: false });

  if (filters.date) {
    recordsQuery = recordsQuery.eq("record_date", filters.date);
  }

  if (filters.busId) {
    recordsQuery = recordsQuery.eq("bus_id", filters.busId);
  }

  const [{ data: records }, { data: buses }, { data: profiles }] = await Promise.all([
    recordsQuery,
    supabase.from("buses").select("id, code").order("code"),
    supabase.from("profiles").select("id, name"),
  ]);

  const busMap = new Map((buses ?? []).map((bus) => [bus.id, bus.code]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));
  const normalizedRecords = (records ?? []).map((record) => ({
    busCode: busMap.get(record.bus_id) ?? record.bus_id,
    calculatedNet: record.calculated_net,
    difference: record.difference,
    exchangeRate: record.exchange_rate,
    fuelCost: record.fuel_cost,
    id: record.id,
    incomeBs: record.income_bs,
    incomeUsd: record.income_usd,
    netProfitUsd: record.net_profit_usd,
    otherExpenses: record.other_expenses,
    recordDate: record.record_date,
    status: record.status,
    userName: profileMap.get(record.user_id) ?? undefined,
    workerPayment: record.worker_payment,
  }));

  return {
    busOptions: (buses ?? []).map((bus) => ({
      code: bus.code,
      id: bus.id,
    })),
    records: normalizedRecords,
  };
}

type DailyPageProps = {
  searchParams?: Promise<{
    busId?: string;
    date?: string;
  }>;
};

export default async function DailyPage({ searchParams }: DailyPageProps) {
  const context = await requireAuth();

  const params = searchParams ? await searchParams : undefined;
  const filters: DailyFilters = {
    busId: params?.busId ? String(params.busId) : undefined,
    date: params?.date ? String(params.date) : undefined,
  };
  const { busOptions, records } = await getDailyContext(filters);
  const totals = records.reduce(
    (accumulator, record) => ({
      difference: accumulator.difference + Number.parseFloat(record.difference),
      incomeUsd: accumulator.incomeUsd + Number.parseFloat(record.incomeUsd),
      netProfitUsd:
        accumulator.netProfitUsd + Number.parseFloat(record.netProfitUsd),
      totalRecords: accumulator.totalRecords + 1,
    }),
    {
      difference: 0,
      incomeUsd: 0,
      netProfitUsd: 0,
      totalRecords: 0,
    },
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {context.profile.role === "admin"
              ? "Operacion diaria"
              : "Mis registros diarios"}
          </CardTitle>
          <CardDescription>
            Filtra por fecha o por bus y revisa los principales datos financieros del
            dia.
          </CardDescription>
        </CardHeader>
      </Card>

      {context.profile.role === "admin" ? (
        <KpiCards
          totalDifference={totals.difference}
          totalIncomeUsd={totals.incomeUsd}
          totalNetProfitUsd={totals.netProfitUsd}
          totalRecords={totals.totalRecords}
        />
      ) : null}

      <DailyTable
        busOptions={busOptions}
        filters={filters}
        isAdmin={context.profile.role === "admin"}
        records={records}
      />
    </div>
  );
}
