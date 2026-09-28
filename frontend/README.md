# Frontend · GOYN Conecta BAQ

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · MapLibre GL 6 · Recharts.

```bash
npm install     # copia también el worker de MapLibre a public/maplibre (postinstall)
npm run dev     # http://localhost:3000
npm run build
npm run lint
npm run typecheck
```

Copia `.env.example` a `.env.local` para conectar Supabase; sin variables corre en modo demo.
La estructura de vistas está en [../docs/01-vistas-y-rutas.md](../docs/01-vistas-y-rutas.md).
