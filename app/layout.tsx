import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { CapacitorSetup } from "@/components/native/capacitor-setup";

import "./globals.css";

const themeScript = `
(() => {
  try {
    const theme = window.localStorage.getItem("rutacontrol-theme");
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch (_) {}
})();
`;

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "RutaControl",
  description:
    "Control operativo y financiero interno para empresas de transporte de pasajeros.",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#0f4a73",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${manrope.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <CapacitorSetup />
        {children}
      </body>
    </html>
  );
}
