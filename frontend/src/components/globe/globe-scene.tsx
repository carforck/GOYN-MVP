"use client";

import { Stars, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { cn } from "@/lib/utils";
import { BARRANQUILLA, EARTH_RADIUS, GOYN_BOGOTA, arcCurve, easeInOutCubic, latLngToVector3 } from "@/components/globe/geo";

// Globo del ecosistema (three.js / react-three-fiber).
// Secuencia: vista global de la Tierra girando → vuelo de cámara hasta Barranquilla, donde está
// el Colaborativo → llegada (onArrive). Inspirado en el globo realista de earth3dmap (textura
// satelital, estrellas, atmósfera) y en los arcos/pulsos del cybermap de Kaspersky, con los
// colores del Manual de identidad GOYN.

export type GlobePoint = { lat: number; lng: number; color: string };

type View = { lat: number; lng: number; distance: number };
type Variant = "home" | "intro";

const VIEWS: Record<Variant, { start: View; orbitTo: View; end: View; lookAtBeacon: boolean; intro: number; fly: number }> = {
  // Home: termina en una vista inclinada del Caribe con el faro de Barranquilla al centro.
  home: {
    start: { lat: 18, lng: 25, distance: 3.2 },
    orbitTo: { lat: 16, lng: -40, distance: 3.1 },
    end: { lat: BARRANQUILLA.lat - 16, lng: BARRANQUILLA.lng + 2, distance: 1.75 },
    lookAtBeacon: true,
    intro: 3.2,
    fly: 3.4,
  },
  // Mapa: baja casi en vertical sobre Barranquilla para empalmar con el mapa detallado.
  intro: {
    start: { lat: 20, lng: 30, distance: 3.3 },
    orbitTo: { lat: 15, lng: -45, distance: 3.2 },
    end: { lat: BARRANQUILLA.lat - 0.6, lng: BARRANQUILLA.lng, distance: EARTH_RADIUS + 0.06 },
    lookAtBeacon: true,
    intro: 2.6,
    fly: 3.8,
  },
};

const lerp = THREE.MathUtils.lerp;

function viewAt(v: Variant, elapsed: number, reduce: boolean) {
  const cfg = VIEWS[v];
  if (reduce) return { view: cfg.end, fly: 1 };
  if (elapsed < cfg.intro) {
    const t = easeInOutCubic(elapsed / cfg.intro);
    return {
      view: {
        lat: lerp(cfg.start.lat, cfg.orbitTo.lat, t),
        lng: lerp(cfg.start.lng, cfg.orbitTo.lng, t),
        distance: lerp(cfg.start.distance, cfg.orbitTo.distance, t),
      },
      fly: 0,
    };
  }
  const t = easeInOutCubic(Math.min(1, (elapsed - cfg.intro) / cfg.fly));
  return {
    view: {
      lat: lerp(cfg.orbitTo.lat, cfg.end.lat, t),
      lng: lerp(cfg.orbitTo.lng, cfg.end.lng, t),
      // La distancia cae con curva exponencial para que el acercamiento final se sienta "entrar".
      distance: cfg.orbitTo.distance * Math.pow(cfg.end.distance / cfg.orbitTo.distance, t),
    },
    fly: t,
  };
}

function CameraRig({ variant, reduce, onArrive, onProgress }: { variant: Variant; reduce: boolean; onArrive?: () => void; onProgress?: (p: number) => void }) {
  const { camera } = useThree();
  const started = useRef<number | null>(null);
  const arrived = useRef(false);
  const beacon = useMemo(() => latLngToVector3(BARRANQUILLA.lat, BARRANQUILLA.lng), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const idle = useRef(0);

  useFrame(({ clock }, delta) => {
    if (started.current === null) started.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - started.current;
    const { view, fly } = viewAt(variant, elapsed, reduce);
    const cfg = VIEWS[variant];

    // Tras llegar, en la home la cámara se mece suavemente alrededor del faro.
    let { lat, lng } = view;
    if (fly >= 1 && variant === "home" && !reduce) {
      idle.current += delta;
      lng += Math.sin(idle.current * 0.18) * 6;
      lat += Math.sin(idle.current * 0.11) * 2;
    }
    camera.position.copy(latLngToVector3(lat, lng, view.distance));
    look.set(0, 0, 0).lerp(beacon, cfg.lookAtBeacon ? easeInOutCubic(fly) : 0);
    camera.lookAt(look);
    onProgress?.(fly);

    if (fly >= 1 && !arrived.current) {
      arrived.current = true;
      onArrive?.();
    }
  });
  return null;
}

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uInner;
  uniform vec3 uOuter;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    vec3 color = mix(uInner, uOuter, clamp(intensity * 0.8, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0) * intensity * 0.9;
  }
`;
const rimFragment = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 4.0);
    gl_FragColor = vec4(uColor, rim * 0.4);
  }
`;

function Earth({ hd }: { hd: boolean }) {
  const [day, relief, water] = useTexture(
    [hd ? "/globe/tierra-dia-4k.webp" : "/globe/tierra-dia-2k.webp", "/globe/tierra-relieve-2k.webp", "/globe/tierra-agua-1k.webp"],
    (textures) => {
      const list = Array.isArray(textures) ? textures : [textures];
      list[0].colorSpace = THREE.SRGBColorSpace;
      list[0].anisotropy = 8;
    },
  );

  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uInner: { value: new THREE.Color("#b44dff") }, uOuter: { value: new THREE.Color("#ff01a2") } },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  const rim = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: rimFragment,
        uniforms: { uColor: { value: new THREE.Color("#c77dff") } },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial map={day} bumpMap={relief} bumpScale={4} specularMap={water} specular={new THREE.Color("#4a4a6a")} shininess={22} />
      </mesh>
      <mesh material={rim}>
        <sphereGeometry args={[EARTH_RADIUS * 1.002, 96, 96]} />
      </mesh>
      <mesh material={atmosphere} scale={1.12}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
      </mesh>
    </group>
  );
}

// Faro del Colaborativo: núcleo magenta, haz de luz y ondas que se expanden. `pulseKey` dispara
// una onda extra cada vez que llega un evento en vivo.
function Beacon({ pulseKey, labelRef }: { pulseKey: number; labelRef: React.RefObject<HTMLDivElement | null> }) {
  const position = useMemo(() => latLngToVector3(BARRANQUILLA.lat, BARRANQUILLA.lng, EARTH_RADIUS * 1.0005), []);
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()),
    [position],
  );
  const beamQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize()),
    [position],
  );
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const burst = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const beamGroup = useRef<THREE.Group>(null);
  const labelPosition = useMemo(() => position.clone().multiplyScalar(1.035), [position]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const burstStart = useRef(-10);
  const clockRef = useRef(0);

  useEffect(() => {
    burstStart.current = clockRef.current;
  }, [pulseKey]);

  useFrame(({ clock, camera, size }) => {
    clockRef.current = clock.elapsedTime;
    // Etiqueta HTML fuera del canvas, ubicada proyectando el faro a la pantalla.
    const label = labelRef.current;
    if (label) {
      projected.copy(labelPosition).project(camera);
      const facing = labelPosition.clone().normalize().dot(camera.position.clone().normalize()) > 0.2;
      label.style.transform = `translate(-50%, -100%) translate(${((projected.x + 1) / 2) * size.width}px, ${((1 - projected.y) / 2) * size.height - 18}px)`;
      label.dataset.visible = facing && camera.position.length() - EARTH_RADIUS > 0.25 ? "1" : "0";
    }
    // El faro se ajusta a la altura de la cámara: grande en la vista global, discreto de cerca.
    const altitude = camera.position.length() - EARTH_RADIUS;
    const k = THREE.MathUtils.clamp(altitude / 0.75, 0.03, 1.4);
    marker.current?.scale.setScalar(k);
    beamGroup.current?.scale.setScalar(k);
    if (beam.current) {
      (beam.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp((altitude - 0.15) / 0.6, 0, 0.55);
    }
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const t = (clock.elapsedTime * 0.45 + i / 3) % 1;
      const s = 0.02 + t * 0.12;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
    });
    if (burst.current) {
      const t = Math.min(1, (clock.elapsedTime - burstStart.current) / 1.6);
      burst.current.scale.setScalar(0.02 + t * 0.35);
      (burst.current.material as THREE.MeshBasicMaterial).opacity = t >= 1 ? 0 : (1 - t) * 0.9;
    }
  });

  const beamHeight = 0.2;

  return (
    <group>
      <group ref={marker} position={position} quaternion={quaternion}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(m) => void (rings.current[i] = m)}>
            <ringGeometry args={[0.82, 1, 64]} />
            <meshBasicMaterial color="#ff01a2" transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh ref={burst}>
          <ringGeometry args={[0.9, 1, 64]} />
          <meshBasicMaterial color="#ffbd25" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.006, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <group ref={beamGroup} position={position} quaternion={beamQuaternion}>
        <mesh ref={beam} position={[0, beamHeight / 2, 0]}>
          <cylinderGeometry args={[0.0015, 0.007, beamHeight, 16, 1, true]} />
          <meshBasicMaterial color="#ff01a2" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

    </group>
  );
}

const arcVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const arcFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOffset;
  void main() {
    float head = fract(uTime * 0.28 + uOffset);
    float d = head - vUv.x;
    float trail = d >= 0.0 ? pow(1.0 - clamp(d / 0.35, 0.0, 1.0), 3.0) : 0.0;
    float alpha = 0.18 + trail * 0.9;
    gl_FragColor = vec4(uColor * (1.0 + trail), alpha);
  }
`;

// Arcos animados con estela luminosa (cometa) entre dos puntos del globo.
function Arc({ from, to, color, offset = 0, lift = 0.4, width = 0.0035 }: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color: string; offset?: number; lift?: number; width?: number }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(arcCurve(from, to, lift), 96, width, 8, false), [from, to, lift, width]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: arcVertex,
        fragmentShader: arcFragment,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOffset: { value: offset } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, offset],
  );
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (m) m.uniforms.uTime.value = clock.elapsedTime;
  });
  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

// Organizaciones como puntos de color de su rol (visibles al acercarse).
function Points({ points }: { points: GlobePoint[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      m.setPosition(latLngToVector3(p.lat, p.lng, EARTH_RADIUS * 1.0008));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new THREE.Color(p.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [points]);
  if (!points.length) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[0.0011, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

// Luz que acompaña a la cámara: el hemisferio visible siempre está iluminado, como en earth3dmap.
function PlainEarth() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial color="#1b1060" emissive="#2a0a5e" shininess={10} />
    </mesh>
  );
}

function CameraLight() {
  const light = useRef<THREE.DirectionalLight>(null);
  useFrame(({ camera }) => {
    light.current?.position.copy(camera.position).add(new THREE.Vector3(-0.6, 0.8, 0.4));
  });
  return <directionalLight ref={light} intensity={1.6} color="#fff8f0" />;
}

function Scene({ variant, points, pulseKey, reduce, hd, onArrive, onProgress, labelRef }: SceneProps) {
  const territories = useMemo(
    () => [
      { lat: 10.9124, lng: -74.7672 }, // Soledad
      { lat: 10.8595, lng: -74.7739 }, // Malambo
      { lat: 10.8968, lng: -74.8858 }, // Galapa
      { lat: 10.9878, lng: -74.9547 }, // Puerto Colombia
    ],
    [],
  );
  return (
    <>
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#ffffff", "#3b1a66", 0.6]} />
      <CameraLight />
      <Stars radius={70} depth={45} count={hd ? 5000 : 2500} factor={3.2} saturation={0.6} fade speed={0.6} />
      {/* Si las texturas no llegan, el globo queda como esfera de marca en vez de romper la escena. */}
      <ErrorBoundary fallback={<PlainEarth />}>
        <Suspense fallback={<PlainEarth />}>
          <Earth hd={hd} />
        </Suspense>
      </ErrorBoundary>
      <Beacon pulseKey={pulseKey} labelRef={labelRef} />
      <Points points={points} />
      <Arc from={BARRANQUILLA} to={GOYN_BOGOTA} color="#ff01a2" lift={0.5} width={0.004} />
      <Arc from={GOYN_BOGOTA} to={BARRANQUILLA} color="#9b00ff" lift={0.62} width={0.003} offset={0.5} />
      {territories.map((t, i) => (
        <Arc key={i} from={BARRANQUILLA} to={t} color={i % 2 ? "#00a0cc" : "#ffbd25"} lift={1.4} width={0.0006} offset={i * 0.23} />
      ))}
      <CameraRig variant={variant} reduce={reduce} onArrive={onArrive} onProgress={onProgress} />
    </>
  );
}

type SceneProps = {
  variant: Variant;
  points: GlobePoint[];
  pulseKey: number;
  reduce: boolean;
  hd: boolean;
  onArrive?: () => void;
  onProgress?: (p: number) => void;
  labelRef: React.RefObject<HTMLDivElement | null>;
};

export default function GlobeScene({
  variant,
  points,
  pulseKey = 0,
  onArrive,
  onProgress,
  paused = false,
  className,
}: {
  variant: Variant;
  points: GlobePoint[];
  pulseKey?: number;
  onArrive?: () => void;
  onProgress?: (p: number) => void;
  paused?: boolean;
  className?: string;
}) {
  const [env] = useState(() => ({
    reduce: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    hd: typeof window !== "undefined" && window.innerWidth >= 1024 && window.devicePixelRatio <= 2,
  }));

  const labelRef = useRef<HTMLDivElement>(null);
  return (
    <div className={cn("relative overflow-hidden", className)}>
    <Canvas
      className="absolute! inset-0"
      frameloop={paused ? "never" : "always"}
      dpr={[1, env.hd ? 2 : 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 42, near: 0.001, far: 200, position: [0, 0, 3.2] }}
    >
      <Scene variant={variant} points={points} pulseKey={pulseKey} reduce={env.reduce} hd={env.hd} onArrive={onArrive} onProgress={onProgress} labelRef={labelRef} />
    </Canvas>
      <div
        ref={labelRef}
        data-visible="0"
        className="pointer-events-none absolute top-0 left-0 rounded-xl border border-white/20 bg-[#060a28]/80 px-3 py-1.5 text-center whitespace-nowrap text-white opacity-0 shadow-xl backdrop-blur transition-opacity duration-500 data-[visible=1]:opacity-100"
      >
        <p className="font-heading text-sm leading-tight font-bold">Barranquilla</p>
        <p className="text-[10px] text-white/75">{points.length} organizaciones · Colaborativo GOYN</p>
      </div>
    </div>
  );
}
