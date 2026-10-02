"use client";

import { useInView } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useLive } from "@/components/live/live-provider";
import { catalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { webglSupported } from "@/lib/webgl";

// three.js solo existe en el navegador: se carga bajo demanda y sin SSR.
const GlobeScene = dynamic(() => import("@/components/globe/globe-scene"), {
  ssr: false,
  loading: () => <GlobeFallback />,
});

function GlobeFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="size-56 animate-pulse rounded-full bg-radial from-goyn-violeta/40 via-goyn-violeta/10 to-transparent" />
    </div>
  );
}

const roleColor = new Map(catalogs.roles.map((r) => [r.code, r.color ?? "#9B00FF"]));

export function LiveGlobe({ variant = "home", className, onArrive }: { variant?: "home" | "intro"; className?: string; onArrive?: () => void }) {
  const live = useLive();
  const ref = useRef<HTMLDivElement>(null);
  // Arranca cuando la sección entra en pantalla; se pausa al salir para no gastar batería.
  const seen = useInView(ref, { once: true, margin: "-10%" });
  const visible = useInView(ref);
  const [arrived, setArrived] = useState(false);
  const [canDraw, setCanDraw] = useState(true);
  useEffect(() => {
    if (webglSupported()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capacidad del navegador, solo se conoce en el cliente
    setCanDraw(false);
    onArrive?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = useMemo(
    () => live.orgs.filter((o) => o.lat != null && o.lng != null).map((o) => ({ lat: o.lat!, lng: o.lng!, color: roleColor.get(o.role) ?? "#9B00FF" })),
    [live.orgs],
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      {!canDraw && <GlobeFallback />}
      {seen && canDraw && (
        <ErrorBoundary fallback={<GlobeFallback />} onError={() => onArrive?.()}>
        <GlobeScene
          variant={variant}
          points={points}
          pulseKey={live.version}
          paused={!visible && arrived}
          onArrive={() => {
            setArrived(true);
            onArrive?.();
          }}
          className="absolute inset-0"
        />
        </ErrorBoundary>
      )}
    </div>
  );
}
