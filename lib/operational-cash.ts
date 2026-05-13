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
  | "description"
  | "direction"
  | "id"
  | "movement_date"
  | "type"
>;

type BusLookup = Pick<Tables<"buses">, "code" | "id" | "plate">;

export type OperationalCashMovementItem = {
  amountUsd: number;
  busCode: string | null;
  createdAt: string;
  description: string;
  direction: Tables<"operational_cash_movements">["direction"];
  id: string;
  movementDate: string;
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
        createdAt: movement.created_at,
        description: movement.description,
        direction: movement.direction,
        id: movement.id,
        movementDate: movement.movement_date,
        signedAmountUsd,
        type: movement.type,
      } satisfies OperationalCashMovementItem;
    });
}

export async function getOperationalCashSummary(selectedDate: string) {
  const supabase = await createClient();
  const { data: movements, error } = await supabase
    .from("operational_cash_movements")
    .select("id, movement_date, type, direction, amount_usd, description, bus_id, created_at")
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, 9999);

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
    new Set((movements ?? []).map((movement) => movement.bus_id).filter(Boolean)),
  ) as string[];
  const { data: buses, error: busesError } =
    busIds.length > 0
      ? await supabase.from("buses").select("id, code, plate").in("id", busIds)
      : { data: [] as BusLookup[], error: null };

  if (busesError) {
    throw busesError;
  }

  const busMap = new Map((buses ?? []).map((bus) => [bus.id, bus]));
  const normalizedMovements = normalizeMovements(movements ?? [], busMap);
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
