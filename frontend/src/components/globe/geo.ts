import * as THREE from "three";

export const EARTH_RADIUS = 1;
export const BARRANQUILLA = { lat: 10.9685, lng: -74.7813 } as const;
// Red GOYN confirmada en los documentos: GOYN Bogotá (Polaris, GOYN Conecta).
export const GOYN_BOGOTA = { lat: 4.711, lng: -74.0721 } as const;

// Latitud/longitud → posición sobre una esfera con textura equirectangular (SphereGeometry de three).
export function latLngToVector3(lat: number, lng: number, radius = EARTH_RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

// Curva de arco entre dos puntos del globo que se eleva según la distancia (estilo "cybermap").
export function arcCurve(a: { lat: number; lng: number }, b: { lat: number; lng: number }, lift = 0.35) {
  const start = latLngToVector3(a.lat, a.lng, EARTH_RADIUS * 1.001);
  const end = latLngToVector3(b.lat, b.lng, EARTH_RADIUS * 1.001);
  const distance = start.distanceTo(end);
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS + distance * lift);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
