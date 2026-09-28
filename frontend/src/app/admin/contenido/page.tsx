import { LayoutTemplateIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ecosystem/page-header";

export const metadata: Metadata = { title: "Editor de contenido" };

const blocks = ["Hero de inicio", "Texto", "Imagen", "Cifras", "Accesos por intención", "Logos de aliados", "Banner", "Sección"];

export default function ContenidoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor visual de contenido"
        description="Permitirá al superadministrador ajustar textos, imágenes, logos, banners y el orden de secciones sin tocar código ni los datos del ecosistema (ADR 006)."
      />
      <div className="rounded-3xl border-2 border-dashed border-goyn-violeta/30 bg-card p-8">
        <LayoutTemplateIcon className="size-10 text-goyn-violeta" aria-hidden />
        <p className="mt-3 font-heading text-lg font-bold text-foreground">Próximamente</p>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          La tabla <code>content_block</code> ya existe en la base de datos con bloques tipados, borrador, publicación y versión. Falta la interfaz de edición con vista previa en escritorio y móvil.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {blocks.map((b) => <li key={b} className="rounded-full bg-goyn-lila px-3 py-1 text-sm font-semibold text-goyn-violeta">{b}</li>)}
        </ul>
      </div>
    </div>
  );
}
