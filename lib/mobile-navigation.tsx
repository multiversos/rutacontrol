import type { LucideIcon } from "lucide-react";
import {
  Bus,
  Ellipsis,
  Home,
  SquarePen,
  TriangleAlert,
} from "lucide-react";

import type { AppRole } from "@/lib/auth/types";

export type MobileSectionId =
  | "alerts"
  | "buses"
  | "home"
  | "more"
  | "register";

export type MobileSectionIconId = MobileSectionId;

export type MobileSection = {
  description: string;
  disabled: boolean;
  href: string;
  iconId: MobileSectionIconId;
  id: MobileSectionId;
  label: string;
};

const mobileIconMap: Record<MobileSectionIconId, LucideIcon> = {
  alerts: TriangleAlert,
  buses: Bus,
  home: Home,
  more: Ellipsis,
  register: SquarePen,
};

const mobileSections = [
  {
    description: "Resumen movil del dia y actividad reciente.",
    href: "/mobile",
    iconId: "home",
    id: "home",
    label: "Inicio",
  },
  {
    description: "Acceso operativo base para registrar o revisar cierres.",
    href: "/mobile/register",
    iconId: "register",
    id: "register",
    label: "Registrar",
  },
  {
    adminOnly: true,
    description: "Catalogo movil y perfil por bus con vista semanal y mensual.",
    href: "/mobile/buses",
    iconId: "buses",
    id: "buses",
    label: "Buses",
  },
  {
    adminOnly: true,
    description: "Alertas recientes, severidad y lectura operativa.",
    href: "/mobile/alerts",
    iconId: "alerts",
    id: "alerts",
    label: "Alertas",
  },
  {
    description: "Sesion, accesos secundarios y salida segura.",
    href: "/mobile/more",
    iconId: "more",
    id: "more",
    label: "Mas",
  },
] as const;

export function getMobileSections(role: AppRole): MobileSection[] {
  return mobileSections.map((section) => {
    const adminOnly = "adminOnly" in section ? section.adminOnly : false;

    return {
      description: section.description,
      disabled: Boolean(adminOnly && role !== "admin"),
      href: section.href,
      iconId: section.iconId,
      id: section.id,
      label: section.label,
    };
  });
}

export function getMobileQuickActionSections(role: AppRole) {
  return getMobileSections(role).filter((section) => section.id !== "home");
}

export function getMobileSectionIcon(iconId: MobileSectionIconId) {
  return mobileIconMap[iconId];
}
