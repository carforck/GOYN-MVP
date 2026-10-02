import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy (antes "middleware" en Next ≤15): refresca la sesión de Supabase en cada navegación
// y protege /panel (organizaciones) y /admin (equipo GOYN). La autorización real vive en la
// base de datos (RLS); esto solo evita mostrar pantallas a quien no tiene sesión.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const demoRolesAllowed = !url || !key || process.env.NEXT_PUBLIC_DATOS_SINTETICOS === "1";

// Recorrido demo: el rol se elige con una cookie en /ingresar.
function demoAllows(request: NextRequest, pathname: string) {
  if (!demoRolesAllowed) return false;
  const demoRole = request.cookies.get("goyn_demo_role")?.value;
  return (
    (pathname.startsWith("/panel") && demoRole === "organizacion") ||
    (pathname.startsWith("/admin") && (demoRole === "admin_goyn" || demoRole === "superadmin"))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsSession = pathname.startsWith("/panel") || pathname.startsWith("/admin");

  // Sin base de datos: solo existe el recorrido demo.
  if (!url || !key) {
    if (needsSession && !demoAllows(request, pathname)) return redirectToLogin(request);
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (needsSession && !data?.claims && !demoAllows(request, pathname)) return redirectToLogin(request);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/ingresar";
  target.search = `?siguiente=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|maplibre|fonts|globe|icon.webp|.*\\.(?:webp|png|jpg|svg|ico|mjs)$).*)"],
};
