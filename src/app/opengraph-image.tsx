import { ImageResponse } from "next/og";

export const alt = "Bertona Seguros — Seguros en San Rafael, Mendoza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#143d7a,#091f42)", color: "#fff" }}>
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#ffb938", textTransform: "uppercase" }}>Seguros</div>
        <div style={{ fontSize: 110, fontWeight: 700 }}>Bertona</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#d9e6f8" }}>Un respaldo real y cercano · San Rafael, Mendoza</div>
      </div>
    ),
    size
  );
}
