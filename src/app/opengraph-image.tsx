import { ImageResponse } from "next/og";

export const alt = "Grupo Bertona — Seguros en San Rafael, Mendoza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#2080c8,#0d1e3a)", color: "#fff" }}>
        <div style={{ fontSize: 30, letterSpacing: 12, color: "#ffbf3f", textTransform: "uppercase" }}>Grupo</div>
        <div style={{ fontSize: 130, fontWeight: 800, textTransform: "uppercase" }}>Bertona</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#d7ecfa" }}>Protegemos lo que más querés · San Rafael, Mendoza</div>
      </div>
    ),
    size
  );
}
