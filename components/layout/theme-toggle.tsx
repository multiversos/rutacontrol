"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rutacontrol-theme";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  const isDark = mode === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("rutacontrol-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("rutacontrol-theme-change", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    () => "light",
  );
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event("rutacontrol-theme-change"));
  };

  return (
    <Button
      aria-label={isDark ? "Activar modo diurno" : "Activar modo nocturno"}
      className="w-full justify-start"
      onClick={toggleTheme}
      size="sm"
      type="button"
      variant="outline"
    >
      <Icon className="mr-2 h-4 w-4" />
      {isDark ? "Modo diurno" : "Modo nocturno"}
    </Button>
  );
}
