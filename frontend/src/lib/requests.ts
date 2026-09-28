// Estados de solicitud y su presentación en la consola GOYN.
export const statusStyle: Record<string, { label: string; className: string }> = {
  enviada: { label: "Pendiente", className: "bg-goyn-naranja/15 text-[#a3450b]" },
  ajustes_solicitados: { label: "Ajustes solicitados", className: "bg-goyn-cian/15 text-[#006a80]" },
  aprobada: { label: "Aprobada", className: "bg-goyn-lila text-goyn-violeta" },
  rechazada: { label: "Rechazada", className: "bg-destructive/10 text-destructive" },
};
