import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces de los correos de Auth (restablecer, confirmar, acceso).
// Usa token_hash, así que funciona aunque el correo se abra en otro dispositivo o navegador.
const TYPES: EmailOtpType[] = ["recovery", "signup", "magiclink", "email", "invite", "email_change"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("siguiente") ?? (type === "recovery" ? "/cambiar-clave" : "/panel");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${safe}`);
  }
  return NextResponse.redirect(`${origin}/ingresar?error=enlace`);
}
