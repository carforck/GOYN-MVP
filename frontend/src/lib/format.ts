const numberFmt = new Intl.NumberFormat("es-CO");
const compactFmt = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota",
});

export const formatNumber = (n: number) => numberFmt.format(n);
export const formatCompact = (n: number) => compactFmt.format(n);
// Node y los navegadores usan espacios Unicode distintos en "p. m."; se normalizan para que el
// HTML del servidor y del cliente coincidan (evita errores de hidratación).
const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");
export const formatDate = (iso: string | null | undefined) => (iso ? clean(dateFmt.format(new Date(iso))) : "—");
export const formatDateTime = (iso: string | null | undefined) => (iso ? clean(dateTimeFmt.format(new Date(iso))) : "—");

// "2025-T3" → "T3 2025"
export const formatPeriod = (label: string) => {
  const [year, q] = label.split("-");
  return q ? `${q} ${year}` : label;
};

// Regla de frescura: aviso a los 6 meses sin actualización (arquitectura de datos §7).
export const isStale = (iso: string, months = 6) => Date.now() - new Date(iso).getTime() > months * 30.4 * 24 * 60 * 60 * 1000;
