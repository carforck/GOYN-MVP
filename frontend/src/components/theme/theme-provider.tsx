"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Modo oscuro SOLO en las áreas con cuenta (/panel y /admin). La landing y el ingreso van
// siempre en claro, como las piezas del Manual de identidad.
export function AccountThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" storageKey="goyn-tema-cuenta" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

export function PublicThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
