// Cuentas de prueba visibles en /ingresar (decisión del cliente para la prueba GOYN del 30-oct).
// Las credenciales NO viven en el código: salen de NEXT_PUBLIC_CUENTAS_PRUEBA (JSON).
// Sin la variable (o vacía / inválida) no hay cuentas: el bloque se oculta y el usuario corto no aplica.
// Formato: [{"rol":"Organización","usuario":"organizacion","email":"...","clave":"..."}, ...]

export type CuentaPrueba = { rol: string; usuario: string; email: string; clave: string };

const isCuenta = (v: unknown): v is CuentaPrueba => {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return ["rol", "usuario", "email", "clave"].every((k) => typeof c[k] === "string" && (c[k] as string).trim() !== "");
};

export function parseCuentasPrueba(raw: string | undefined): CuentaPrueba[] {
  if (!raw || !raw.trim()) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isCuenta) : [];
  } catch {
    return [];
  }
}

export const getCuentasPrueba = () => parseCuentasPrueba(process.env.NEXT_PUBLIC_CUENTAS_PRUEBA);

// Acepta correo o usuario corto ("admin", "organizacion", "superadmin"). Devuelve el correo o null.
export function resolveLoginEmail(input: string, cuentas: CuentaPrueba[] = getCuentasPrueba()): string | null {
  const value = input.trim();
  if (!value) return null;
  if (value.includes("@")) return value;
  const match = cuentas.find((c) => c.usuario.toLowerCase() === value.toLowerCase());
  return match ? match.email : null;
}
