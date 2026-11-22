"use client";
import qrcode from "qrcode-generator";
import { useMemo, useState } from "react";
import { btnGhost, btnPrimary, inputCls } from "@/components/panel/ui";

const MARGEN = 4; // zona blanca alrededor, en módulos (lo que pide el estándar QR)

/** Mismo criterio que el backend para el origen: minúsculas, sin tildes, solo letras, números y guiones. */
const slug = (v: string) =>
  v.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");

function matriz(texto: string, nivel: "Q" | "H") {
  const qr = qrcode(0, nivel);
  qr.addData(texto);
  qr.make();
  const n = qr.getModuleCount();
  return { n, oscuro: (f: number, c: number) => qr.isDark(f, c) };
}

/** Trazo SVG del QR: una tira por cada tramo de módulos oscuros seguidos (archivo chico y bordes nítidos). */
function trazo(m: ReturnType<typeof matriz>) {
  let d = "";
  for (let f = 0; f < m.n; f++) {
    for (let c = 0; c < m.n; c++) {
      if (!m.oscuro(f, c)) continue;
      let largo = 1;
      while (c + largo < m.n && m.oscuro(f, c + largo)) largo++;
      d += `M${c + MARGEN} ${f + MARGEN}h${largo}v1h-${largo}z`;
      c += largo - 1;
    }
  }
  return d;
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function GeneradorQR({ base, sugeridos }: { base: string; sugeridos: string[] }) {
  const [nombre, setNombre] = useState("cartel-pista");
  const [nivel, setNivel] = useState<"Q" | "H">("Q");
  const [color, setColor] = useState("#000000");
  const [tamano, setTamano] = useState(2048);
  const [copiado, setCopiado] = useState(false);
  const origen = slug(nombre);
  const url = `${base.replace(/\/$/, "")}/sorteo${origen ? `?src=${origen}` : ""}`;
  const m = useMemo(() => matriz(url, nivel), [url, nivel]);
  const d = useMemo(() => trazo(m), [m]);
  const lado = m.n + MARGEN * 2;
  const archivo = `qr-sorteo-${origen || "general"}`;

  const svg = () =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges">` +
    `<title>${url.replace(/&/g, "&amp;")}</title><rect width="${lado}" height="${lado}" fill="#ffffff"/><path d="${d}" fill="${color}"/></svg>\n`;

  const png = () => {
    const px = Math.max(1, Math.floor(tamano / lado)); // módulos de un número entero de píxeles: bordes nítidos
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px * lado;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    for (let f = 0; f < m.n; f++) for (let c = 0; c < m.n; c++) if (m.oscuro(f, c)) ctx.fillRect((c + MARGEN) * px, (f + MARGEN) * px, px, px);
    canvas.toBlob((b) => b && descargar(b, `${archivo}.png`), "image/png");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5 border border-line bg-white p-5">
        <label className="block text-base font-semibold text-brand-900">
          ¿Dónde va este QR? (origen)
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej: cartel-pista" className={inputCls} />
          <span className="mt-1 block text-sm font-normal text-ink-soft">
            Se guarda como <code className="font-semibold text-brand-900">{origen || "(sin origen)"}</code>: así sabés en las métricas cuántos se anotaron desde cada QR.
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {sugeridos.map((s) => (
            <button key={s} type="button" onClick={() => setNombre(s)}
              className={`border px-3 py-1.5 text-sm font-semibold ${origen === s ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-brand-800 hover:border-brand-500"}`}>
              {s}
            </button>
          ))}
        </div>

        <div>
          <p className="text-sm font-semibold text-ink-soft">Dirección del QR</p>
          <p className="mt-1 break-all border border-line bg-soft px-3 py-2 font-mono text-sm text-brand-900">{url}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
            <button type="button" className="text-brand-700 hover:underline"
              onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }, () => {})}>
              {copiado ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">Probar el enlace</a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-brand-900">
            Color
            <select value={color} onChange={(e) => setColor(e.target.value)} className={inputCls}>
              <option value="#000000">Negro</option>
              <option value="#0d1e3a">Azul Bertona</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-soft">El negro es el que mejor se lee.</span>
          </label>
          <label className="text-sm font-semibold text-brand-900">
            Resistencia a daños
            <select value={nivel} onChange={(e) => setNivel(e.target.value as "Q" | "H")} className={inputCls}>
              <option value="Q">Alta</option>
              <option value="H">Máxima</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-soft">Máxima: carteles a la intemperie.</span>
          </label>
          <label className="text-sm font-semibold text-brand-900">
            Tamaño del PNG
            <select value={tamano} onChange={(e) => setTamano(Number(e.target.value))} className={inputCls}>
              <option value={1024}>1024 px</option>
              <option value={2048}>2048 px</option>
              <option value={4096}>4096 px</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-soft">1024 redes · 2048 flyer · 4096 cartel.</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={png} className={btnPrimary}>Descargar PNG</button>
          <button type="button" onClick={() => descargar(new Blob([svg()], { type: "image/svg+xml" }), `${archivo}.svg`)} className={btnGhost}>Descargar SVG (vectorial)</button>
        </div>
        <p className="text-sm text-ink-soft">
          Para imprenta conviene el SVG: se agranda sin perder calidad. Imprimilo de 3 cm de lado como mínimo; para leerlo de lejos,
          calculá 1 cm por cada 10 cm de distancia (a 5 metros, unos 50 cm de lado). Probalo con un celular antes de mandarlo a imprimir.
        </p>
      </div>

      <div className="border border-line bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-soft">Vista previa</p>
        <svg viewBox={`0 0 ${lado} ${lado}`} shapeRendering="crispEdges" role="img" aria-label={`Código QR que abre ${url}`} className="mx-auto block aspect-square w-full max-w-[20rem]">
          <rect width={lado} height={lado} fill="#ffffff" />
          <path d={d} fill={color} />
        </svg>
        <p className="mt-3 text-center text-xs text-ink-soft">{m.n}×{m.n} módulos · {nivel === "H" ? "corrección máxima (30 %)" : "corrección alta (25 %)"}</p>
      </div>
    </div>
  );
}
