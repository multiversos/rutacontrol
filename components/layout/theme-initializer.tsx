"use client";

import { useEffect } from "react";

const STORAGE_KEY = "rutacontrol-theme";

export function ThemeInitializer() {
  useEffect(() => {
    const theme = window.localStorage.getItem(STORAGE_KEY);
    const isDark = theme === "dark";

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.dispatchEvent(new Event("rutacontrol-theme-change"));
  }, []);

  return null;
}
