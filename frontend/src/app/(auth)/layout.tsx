import { PublicThemeProvider } from "@/components/theme/theme-provider";

// Ingreso y registro de cuenta: siempre en modo claro, como la landing.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicThemeProvider>{children}</PublicThemeProvider>;
}
