"use client";

// Último recurso si falla el layout raíz: debe traer su propio <html> y <body>.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#060a28", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 22 }}>GOYN Conecta BAQ</p>
          <p style={{ opacity: 0.8 }}>Algo no cargó como esperábamos.</p>
          <button type="button" onClick={() => retry()} style={{ marginTop: 12, border: 0, borderRadius: 999, padding: "10px 22px", background: "#9b00ff", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
