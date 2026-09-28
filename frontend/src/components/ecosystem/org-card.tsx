import { BadgeCheckIcon, MapPinIcon, Share2Icon, LayersIcon } from "lucide-react";
import Link from "next/link";
import { RoleIcon } from "@/components/ecosystem/role-badge";
import { item, label, shortTerritory } from "@/lib/catalogs";
import { formatDate } from "@/lib/format";
import type { PublicOrganization } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrgInitials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .replace(/\(demo\)/i, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-goyn-violeta to-goyn-magenta font-heading text-base font-extrabold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function OrgCard({ org, href }: { org: PublicOrganization; href?: string }) {
  const link = href ?? `/actores/${org.slug}`;
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-goyn-violeta/40 hover:shadow-lg hover:shadow-goyn-violeta/5">
      <div className="flex items-start gap-3">
        <OrgInitials name={org.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base leading-snug font-bold text-goyn-navy">
            <Link href={link} className="after:absolute after:inset-0 focus-visible:outline-none">
              {org.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{org.org_type_label}</p>
        </div>
        {org.verified_at && <BadgeCheckIcon className="size-5 shrink-0 text-goyn-violeta" aria-label="Perfil verificado por GOYN" />}
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-goyn-navy">
        <RoleIcon code={org.primary_role_code} size={24} />
        {org.primary_role_label}
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Áreas de impacto">
        {org.area_codes.map((code) => (
          <li key={code} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-goyn-navy">
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: item("impactAreas", code)?.color }} />
            {label("impactAreas", code)}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon className="size-3.5" aria-hidden />
          {org.location_territory_code ? shortTerritory(org.location_territory_code) : "Sin sede georreferenciada"}
        </span>
        <span className="inline-flex items-center gap-1">
          <LayersIcon className="size-3.5" aria-hidden />
          {org.programs_count} {org.programs_count === 1 ? "programa" : "programas"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Share2Icon className="size-3.5" aria-hidden />
          {org.connections_count} conexiones
        </span>
        <span className="ml-auto">Act. {formatDate(org.updated_at)}</span>
      </div>
    </article>
  );
}
