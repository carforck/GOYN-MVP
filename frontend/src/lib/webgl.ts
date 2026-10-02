// ¿El navegador puede dibujar con WebGL2? (MapLibre v6 y three.js lo necesitan)
export function webglSupported() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}
