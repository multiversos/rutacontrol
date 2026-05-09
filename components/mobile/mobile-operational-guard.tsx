"use client";

import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { LogIn, RotateCcw, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type MobileOperationalIssue = {
  actionLabel: string;
  description: string;
  icon: typeof WifiOff;
  tone: "network" | "unexpected";
  title: string;
};

export function MobileOperationalGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [clientError, setClientError] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const readNetworkStatus = useCallback(async () => {
    let connected = typeof navigator === "undefined" ? true : navigator.onLine;
    let nextConnectionType: string | null = null;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();

        connected = status.connected;
        nextConnectionType = status.connectionType;
      } catch {
        nextConnectionType = null;
      }
    }

    setConnectionType(nextConnectionType);
    setIsOffline(!connected);
    return connected;
  }, []);

  useEffect(() => {
    setClientError(false);
  }, [pathname]);

  useEffect(() => {
    let nativeListener: PluginListenerHandle | null = null;
    let disposed = false;

    const handleBrowserNetworkChange = () => {
      void readNetworkStatus();
    };

    window.addEventListener("online", handleBrowserNetworkChange);
    window.addEventListener("offline", handleBrowserNetworkChange);
    void readNetworkStatus();

    if (Capacitor.isNativePlatform()) {
      void (async () => {
        const { Network } = await import("@capacitor/network");
        const listener = await Network.addListener(
          "networkStatusChange",
          (status) => {
            setConnectionType(status.connectionType);
            setIsOffline(!status.connected);
          },
        );

        if (disposed) {
          void listener.remove();
          return;
        }

        nativeListener = listener;
      })();
    }

    return () => {
      disposed = true;
      window.removeEventListener("online", handleBrowserNetworkChange);
      window.removeEventListener("offline", handleBrowserNetworkChange);
      void nativeListener?.remove();
    };
  }, [readNetworkStatus]);

  useEffect(() => {
    const handleClientError = () => {
      setClientError(true);
    };

    window.addEventListener("error", handleClientError);
    window.addEventListener("unhandledrejection", handleClientError);

    return () => {
      window.removeEventListener("error", handleClientError);
      window.removeEventListener("unhandledrejection", handleClientError);
    };
  }, []);

  const issue = useMemo<MobileOperationalIssue | null>(() => {
    if (isOffline) {
      const connectionLabel =
        connectionType && connectionType !== "none"
          ? ` Conexion detectada: ${connectionType}.`
          : "";

      return {
        actionLabel: "Reintentar",
        description: `Revisa datos moviles o Wi-Fi y vuelve a intentar.${connectionLabel}`,
        icon: WifiOff,
        title: "Sin conexion",
        tone: "network",
      };
    }

    if (clientError) {
      return {
        actionLabel: "Recargar",
        description:
          "La pantalla encontro un error temporal. Puedes recargar o volver al login si la sesion vencio.",
        icon: TriangleAlert,
        title: "Operación interrumpida",
        tone: "unexpected",
      };
    }

    return null;
  }, [clientError, connectionType, isOffline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    const connected = await readNetworkStatus();

    if (connected) {
      setClientError(false);
      router.refresh();
    }

    window.setTimeout(() => {
      setIsRetrying(false);
    }, 700);
  };

  if (!issue) {
    return null;
  }

  const Icon = issue.icon;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-[calc(0.75rem+var(--safe-left))] pb-3 pr-[calc(0.75rem+var(--safe-right))] pt-[calc(var(--safe-top)+0.75rem)]"
      role="status"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-[480px] rounded-lg border p-3 shadow-[0_16px_36px_rgba(15,23,42,0.18)]",
          issue.tone === "network"
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-rose-200 bg-rose-50 text-rose-950",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{issue.title}</p>
            <p className="mt-1 text-xs leading-5 opacity-80">{issue.description}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isRetrying}
                onClick={handleRetry}
                type="button"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isRetrying ? "Revisando..." : issue.actionLabel}
              </button>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-current/20 bg-white/80 px-3 text-sm font-semibold"
                href="/login?redirectTo=/mobile"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Revisar sesion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
