import "server-only";

import { isDemoBus } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type OperationalCashMovementRow = Pick<
  Tables<"operational_cash_movements">,
  | "amount_usd"
  | "bus_id"
  | "created_at"
  | "daily_record_id"
  | "debt_id"
  | "debt_payment_id"
  | "description"
  | "direction"
  | "id"
  | "movement_date"
  | "type"
>;

type BusLookup = Pick<Tables<"buses">, "code" | "id" | "plate">;

const PAGE_SIZE = 1000;

export type OperationalCashMovementItem = {
  amountUsd: number;
  busCode: string | null;
  busId: string | null;
  createdAt: string;
  dailyRecordId?: string | null;
  debtId?: string | null;
  debtPaymentId?: string | null;
  description: string;
  direction: Tables<"operational_cash_movements">["direction"];
  id: string;
  movementDate: string;
  runningBalanceUsd?: number;
  signedAmountUsd: number;
  type: Tables<"operational_cash_movements">["type"];
};

export type OperationalCashSummary = {
  balanceUsd: number;
  latestMovements: OperationalCashMovementItem[];
  migrationReady: boolean;
  netTodayUsd: number;
  outTodayUsd: number;
  inTodayUsd: number;
};

export type OperationalCashFilterState = {
  busId?: string;
  direction?: "in" | "out" | "adjustment";
  from?: string;
  page: number;
  pageSize: 25 | 50;
  q?: string;
  to?: string;
  type?: Tables<"operational_cash_movements">["type"];
};

export type OperationalCashBusOption = {
  code: string;
  id: string;
};

export type OperationalCashTrendPoint = {
  balanceUsd: number;
  date: string;
  inUsd: number;
  outUsd: number;
};

export type OperationalCashLedgerData = {
  balanceUsd: number;
  busOptions: OperationalCashBusOption[];
  errorMessage?: string;
  exportMovements: OperationalCashMovementItem[];
  filteredInUsd: number;
  filteredMovements: OperationalCashMovementItem[];
  filteredNetUsd: number;
  filteredOutUsd: number;
  filters: OperationalCashFilterState;
  lastMovement: OperationalCashMovementItem | null;
  migrationReady: boolean;
  pageInfo: {
    end: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    pageSize: 25 | 50;
    start: number;
    totalItems: number;
    totalPages: number;
  };
  paginatedMovements: OperationalCashMovementItem[];
  trendPoints: OperationalCashTrendPoint[];
};

function toNumber(value: number | string | null | undefined) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(value === "" || value == null ? "0" : value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isDateInputValue(value?: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isMovementType(
  value?: string | null,
): value is Tables<"operational_cash_movements">["type"] {
  return (
    value === "daily_net" ||
    value === "debt_payment" ||
    value === "manual_adjustment"
  );
}

function isMovementDirection(
  value?: string | null,
): value is Tables<"operational_cash_movements">["direction"] {
  return value === "in" || value === "out" || value === "adjustment";
}

export function normalizeOperationalCashFilters(input?: {
  busId?: string;
  direction?: string;
  from?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  to?: string;
  type?: string;
}) {
  const parsedPage = Number.parseInt(input?.page ?? "1", 10);
  const parsedPageSize = Number.parseInt(input?.pageSize ?? "25", 10);
  const pageSize = parsedPageSize === 50 ? 50 : 25;
  const filters: OperationalCashFilterState = {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize,
  };
  const busId = input?.busId?.trim();
  const direction = input?.direction;
  const from = input?.from;
  const q = input?.q?.trim();
  const to = input?.to;
  const type = input?.type;

  if (busId) filters.busId = busId;
  if (isMovementDirection(direction)) filters.direction = direction;
  if (isDateInputValue(from)) filters.from = from;
  if (q) filters.q = q;
  if (isDateInputValue(to)) filters.to = to;
  if (isMovementType(type)) filters.type = type;

  return filters;
}

export function getOperationalCashSignedAmount(
  direction: Tables<"operational_cash_movements">["direction"],
  amountUsd: number | string,
) {
  const amount = toNumber(amountUsd);

  if (direction === "out") {
    return -Math.abs(amount);
  }

  if (direction === "in") {
    return Math.abs(amount);
  }

  return amount;
}

export async function syncOperationalCashFromDailyRecord(
  recordId: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? (await createClient());
  const { error } = await client.rpc("sync_operational_cash_from_daily_record", {
    _record_id: recordId,
  });

  if (error) {
    throw error;
  }
}

export async function syncOperationalCashFromDebtPayment(
  paymentId: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? (await createClient());
  const { error } = await client.rpc("sync_operational_cash_from_debt_payment", {
    _payment_id: paymentId,
  });

  if (error) {
    throw error;
  }
}

function normalizeMovements(
  movements: OperationalCashMovementRow[],
  busMap: Map<string, BusLookup>,
) {
  return movements
    .filter((movement) => {
      if (!movement.bus_id) {
        return true;
      }

      const bus = busMap.get(movement.bus_id);

      return bus ? !isDemoBus(bus) : true;
    })
    .map((movement) => {
      const amountUsd = toNumber(movement.amount_usd);
      const signedAmountUsd = getOperationalCashSignedAmount(
        movement.direction,
        amountUsd,
      );

      return {
        amountUsd,
        busCode: movement.bus_id
          ? (busMap.get(movement.bus_id)?.code ?? movement.bus_id)
          : null,
        busId: movement.bus_id,
        createdAt: movement.created_at,
        dailyRecordId: movement.daily_record_id,
        debtId: movement.debt_id,
        debtPaymentId: movement.debt_payment_id,
        description: movement.description,
        direction: movement.direction,
        id: movement.id,
        movementDate: movement.movement_date,
        signedAmountUsd,
        type: movement.type,
      } satisfies OperationalCashMovementItem;
    });
}

async function fetchOperationalCashMovements(supabase: SupabaseClient) {
  const allMovements: OperationalCashMovementRow[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("operational_cash_movements")
      .select(
        "id, movement_date, type, direction, amount_usd, description, daily_record_id, debt_payment_id, bus_id, debt_id, created_at",
      )
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { error, movements: allMovements };
    }

    allMovements.push(...(data ?? []));

    if (!data || data.length < PAGE_SIZE) {
      return { error: null, movements: allMovements };
    }

    page += 1;
  }
}

async function fetchBusMap(supabase: SupabaseClient, busIds: string[]) {
  const busMap = new Map<string, BusLookup>();

  for (let index = 0; index < busIds.length; index += PAGE_SIZE) {
    const chunk = busIds.slice(index, index + PAGE_SIZE);
    const { data, error } =
      chunk.length > 0
        ? await supabase.from("buses").select("id, code, plate").in("id", chunk)
        : { data: [] as BusLookup[], error: null };

    if (error) {
      throw error;
    }

    (data ?? []).forEach((bus) => {
      busMap.set(bus.id, bus);
    });
  }

  return busMap;
}

export async function getOperationalCashSummary(selectedDate: string) {
  const supabase = await createClient();
  const { error, movements } = await fetchOperationalCashMovements(supabase);

  if (error) {
    if (["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
      return {
        balanceUsd: 0,
        inTodayUsd: 0,
        latestMovements: [],
        migrationReady: false,
        netTodayUsd: 0,
        outTodayUsd: 0,
      } satisfies OperationalCashSummary;
    }

    throw error;
  }

  const busIds = Array.from(
    new Set(movements.map((movement) => movement.bus_id).filter(Boolean)),
  ) as string[];
  const busMap = await fetchBusMap(supabase, busIds);
  const normalizedMovements = normalizeMovements(movements, busMap);
  const todayMovements = normalizedMovements.filter(
    (movement) => movement.movementDate === selectedDate,
  );
  const inTodayUsd = todayMovements
    .filter((movement) => movement.signedAmountUsd > 0)
    .reduce((total, movement) => total + movement.signedAmountUsd, 0);
  const outTodayUsd = todayMovements
    .filter((movement) => movement.signedAmountUsd < 0)
    .reduce((total, movement) => total + Math.abs(movement.signedAmountUsd), 0);

  return {
    balanceUsd: roundMoney(
      normalizedMovements.reduce(
        (total, movement) => total + movement.signedAmountUsd,
        0,
      ),
    ),
    inTodayUsd: roundMoney(inTodayUsd),
    latestMovements: normalizedMovements.slice(0, 5),
    migrationReady: true,
    netTodayUsd: roundMoney(inTodayUsd - outTodayUsd),
    outTodayUsd: roundMoney(outTodayUsd),
  } satisfies OperationalCashSummary;
}

function compareMovementsAscending(
  first: OperationalCashMovementItem,
  second: OperationalCashMovementItem,
) {
  return (
    first.movementDate.localeCompare(second.movementDate) ||
    first.createdAt.localeCompare(second.createdAt) ||
    first.id.localeCompare(second.id)
  );
}

function compareMovementsDescending(
  first: OperationalCashMovementItem,
  second: OperationalCashMovementItem,
) {
  return (
    second.movementDate.localeCompare(first.movementDate) ||
    second.createdAt.localeCompare(first.createdAt) ||
    second.id.localeCompare(first.id)
  );
}

function withRunningBalances(movements: OperationalCashMovementItem[]) {
  const runningBalanceById = new Map<string, number>();
  let runningBalance = 0;

  [...movements].sort(compareMovementsAscending).forEach((movement) => {
    runningBalance = roundMoney(runningBalance + movement.signedAmountUsd);
    runningBalanceById.set(movement.id, runningBalance);
  });

  return movements.map((movement) => ({
    ...movement,
    runningBalanceUsd: runningBalanceById.get(movement.id) ?? 0,
  }));
}

function buildTrendPoints(movements: OperationalCashMovementItem[]) {
  const dayMap = new Map<string, OperationalCashTrendPoint>();
  let runningBalance = 0;

  [...movements].sort(compareMovementsAscending).forEach((movement) => {
    runningBalance = roundMoney(runningBalance + movement.signedAmountUsd);
    const existing =
      dayMap.get(movement.movementDate) ??
      ({
        balanceUsd: runningBalance,
        date: movement.movementDate,
        inUsd: 0,
        outUsd: 0,
      } satisfies OperationalCashTrendPoint);

    dayMap.set(movement.movementDate, {
      balanceUsd: runningBalance,
      date: movement.movementDate,
      inUsd:
        existing.inUsd +
        (movement.signedAmountUsd > 0 ? movement.signedAmountUsd : 0),
      outUsd:
        existing.outUsd +
        (movement.signedAmountUsd < 0 ? Math.abs(movement.signedAmountUsd) : 0),
    });
  });

  return Array.from(dayMap.values()).map((point) => ({
    ...point,
    inUsd: roundMoney(point.inUsd),
    outUsd: roundMoney(point.outUsd),
  }));
}

function matchesOperationalCashFilters(
  movement: OperationalCashMovementItem,
  filters: OperationalCashFilterState,
) {
  const query = filters.q?.toLocaleLowerCase("es-VE");

  return (
    (!filters.from || movement.movementDate >= filters.from) &&
    (!filters.to || movement.movementDate <= filters.to) &&
    (!filters.type || movement.type === filters.type) &&
    (!filters.direction || movement.direction === filters.direction) &&
    (!filters.busId || movement.busId === filters.busId) &&
    (!query || movement.description.toLocaleLowerCase("es-VE").includes(query))
  );
}

export async function getOperationalCashLedgerData(
  filters: OperationalCashFilterState,
) {
  const supabase = await createClient();
  const { error, movements } = await fetchOperationalCashMovements(supabase);

  if (error) {
    if (["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
      return {
        balanceUsd: 0,
        busOptions: [],
        exportMovements: [],
        filteredInUsd: 0,
        filteredMovements: [],
        filteredNetUsd: 0,
        filteredOutUsd: 0,
        filters,
        lastMovement: null,
        migrationReady: false,
        pageInfo: {
          end: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          page: filters.page,
          pageSize: filters.pageSize,
          start: 0,
          totalItems: 0,
          totalPages: 1,
        },
        paginatedMovements: [],
        trendPoints: [],
      } satisfies OperationalCashLedgerData;
    }

    return {
      balanceUsd: 0,
      busOptions: [],
      errorMessage: "No pudimos cargar los movimientos de Caja operativa.",
      exportMovements: [],
      filteredInUsd: 0,
      filteredMovements: [],
      filteredNetUsd: 0,
      filteredOutUsd: 0,
      filters,
      lastMovement: null,
      migrationReady: true,
      pageInfo: {
        end: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        page: filters.page,
        pageSize: filters.pageSize,
        start: 0,
        totalItems: 0,
        totalPages: 1,
      },
      paginatedMovements: [],
      trendPoints: [],
    } satisfies OperationalCashLedgerData;
  }

  const busIds = Array.from(
    new Set(movements.map((movement) => movement.bus_id).filter(Boolean)),
  ) as string[];
  const busMap = await fetchBusMap(supabase, busIds);
  const normalizedMovements = withRunningBalances(
    normalizeMovements(movements, busMap),
  ).sort(compareMovementsDescending);
  const balanceUsd = roundMoney(
    normalizedMovements.reduce(
      (total, movement) => total + movement.signedAmountUsd,
      0,
    ),
  );
  const busOptionMap = new Map<string, OperationalCashBusOption>();

  normalizedMovements.forEach((movement) => {
    if (movement.busId && movement.busCode) {
      busOptionMap.set(movement.busId, {
        code: movement.busCode,
        id: movement.busId,
      });
    }
  });

  const busOptionItems = Array.from(busOptionMap.values()).sort((first, second) =>
    first.code.localeCompare(second.code, "es-VE", { numeric: true }),
  );

  const filteredMovements = normalizedMovements.filter((movement) =>
    matchesOperationalCashFilters(movement, filters),
  );
  const totalItems = filteredMovements.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const startIndex = (page - 1) * filters.pageSize;
  const paginatedMovements = filteredMovements.slice(
    startIndex,
    startIndex + filters.pageSize,
  );
  const filteredInUsd = filteredMovements
    .filter((movement) => movement.signedAmountUsd > 0)
    .reduce((total, movement) => total + movement.signedAmountUsd, 0);
  const filteredOutUsd = filteredMovements
    .filter((movement) => movement.signedAmountUsd < 0)
    .reduce((total, movement) => total + Math.abs(movement.signedAmountUsd), 0);

  return {
    balanceUsd,
    busOptions: busOptionItems,
    exportMovements: filteredMovements,
    filteredInUsd: roundMoney(filteredInUsd),
    filteredMovements,
    filteredNetUsd: roundMoney(filteredInUsd - filteredOutUsd),
    filteredOutUsd: roundMoney(filteredOutUsd),
    filters: {
      ...filters,
      page,
    },
    lastMovement: normalizedMovements[0] ?? null,
    migrationReady: true,
    pageInfo: {
      end: totalItems === 0 ? 0 : startIndex + paginatedMovements.length,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      page,
      pageSize: filters.pageSize,
      start: totalItems === 0 ? 0 : startIndex + 1,
      totalItems,
      totalPages,
    },
    paginatedMovements,
    trendPoints: buildTrendPoints(normalizedMovements),
  } satisfies OperationalCashLedgerData;
}
