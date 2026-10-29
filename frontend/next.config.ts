import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite revisar el servidor de desarrollo desde la red local (celular u otro equipo).
  allowedDevOrigins: ["127.0.0.1", "192.168.1.112", "192.168.1.9"],
};

export default nextConfig;
