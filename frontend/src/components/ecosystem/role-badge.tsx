import Image from "next/image";
import { item } from "@/lib/catalogs";
import { cn } from "@/lib/utils";

// Íconos de rol de RECURSOS GRAFICOS/ICONOS/ROLES. Mapeo inferido por iconografía (docs/03).
export function RoleIcon({ code, size = 28, className }: { code: string; size?: number; className?: string }) {
  const role = item("roles", code);
  if (!role?.icon) return null;
  return <Image src={`/images/roles/${role.icon}.webp`} alt="" width={size} height={size} className={cn("shrink-0", className)} />;
}

export function RoleBadge({ code, primary = false, className }: { code: string; primary?: boolean; className?: string }) {
  const role = item("roles", code);
  if (!role) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-xs font-semibold",
        primary ? "border-transparent bg-goyn-navy text-white" : "bg-card text-foreground",
        className,
      )}
      title={role.description}
    >
      <RoleIcon code={code} size={20} />
      {role.label}
    </span>
  );
}
