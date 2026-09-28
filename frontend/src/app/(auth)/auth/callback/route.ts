import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces de confirmación y de acceso por correo de Supabase Auth.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("siguiente") ?? "/panel";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safe}`);
  }
  return NextResponse.redirect(`${origin}/ingresar?error=enlace`);
}
