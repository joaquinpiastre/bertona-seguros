import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { DIRECCION_COMPLETA, EMPRESA, PRODUCTOR, RECIBO_LEGAL, SSN_TELEFONO, TELEFONO_COBRANZA_VISIBLE } from "./empresa";
import { fecha, money } from "./format";
import { LOGO_B64 } from "./logo-b64";
import { MERIDIONAL_B64, MERIDIONAL_RATIO } from "./meridional-b64";
import { SSN_B64, SSN_RATIO } from "./ssn-b64";

// ───────── Datos ─────────
export type ReciboLinea = {
  poliza: string;
  compania: string;
  riesgo: string;
  dominio: string;
  cuota: string; // "3 de 12"
  vtoCuota: string;
  importe: number;
};

export type ReciboData = {
  nro: number;
  cliente: string;
  documento?: string;
  fecha: string;
  metodo: string;
  anulado: boolean;
  proxVenc: string;
  lineas: ReciboLinea[];
};

// ───────── Estilo ─────────
const NAVY = rgb(0.051, 0.118, 0.227);
const GOLD = rgb(0.627, 0.541, 0.373);
const GOLD_L = rgb(0.863, 0.796, 0.651);
const SKY = rgb(0.125, 0.502, 0.784);
const SKY_L = rgb(0.84, 0.925, 0.98);
const SOFT = rgb(0.949, 0.965, 0.984);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.07, 0.1, 0.17);
const GRAY = rgb(0.42, 0.46, 0.53);
const LINE = rgb(0.84, 0.87, 0.91);

// pdf-lib (fuentes estándar) solo codifica WinAnsi.
const safe = (t: string) =>
  (t ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

function ajustar(font: PDFFont, texto: string, ancho: number, max: number, min = 6) {
  let size = max;
  while (size > min && font.widthOfTextAtSize(texto, size) > ancho) size -= 0.25;
  return size;
}

function envolver(font: PDFFont, texto: string, size: number, ancho: number) {
  const lineas: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let actual = "";
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > ancho && actual) {
        lineas.push(actual);
        actual = palabra;
      } else actual = prueba;
    }
    lineas.push(actual);
  }
  return lineas;
}

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  bold: PDFFont;
  reg: PDFFont;
  ital: PDFFont;
  emblema: PDFImage;
  ssn: PDFImage;
  mer: PDFImage;
  H: number;
};

async function crear(titulo: string, H = 842): Promise<Ctx> {
  const doc = await PDFDocument.create();
  doc.setTitle(titulo);
  doc.setAuthor("Grupo Bertona");
  const page = doc.addPage([595, H]);
  return {
    doc,
    page,
    H,
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    reg: await doc.embedFont(StandardFonts.Helvetica),
    ital: await doc.embedFont(StandardFonts.TimesRomanItalic),
    emblema: await doc.embedPng(Buffer.from(LOGO_B64, "base64")),
    ssn: await doc.embedPng(Buffer.from(SSN_B64, "base64")),
    mer: await doc.embedPng(Buffer.from(MERIDIONAL_B64, "base64")),
  };
}

/** Logo: la B del emblema pegada a "ERTONA", con "GRUPO" arriba. (x, top) = esquina superior izquierda. */
function logo(c: Ctx, x: number, top: number, alto: number, textoColor = WHITE, grupoColor = GOLD_L) {
  const { page, H } = c;
  page.drawImage(c.emblema, { x, y: H - top - alto, width: alto, height: alto });
  const tx = x + alto * 1.0;
  const size = alto * 0.7;
  page.drawText("ERTONA", { x: tx, y: H - top - alto * 0.8, size, font: c.bold, color: textoColor });
  page.drawText("G R U P O", { x: tx + 2, y: H - top - alto * 0.06 - alto * 0.12, size: alto * 0.15, font: c.bold, color: grupoColor });
  return tx + c.bold.widthOfTextAtSize("ERTONA", size);
}

const txt = (c: Ctx, t: string, x: number, top: number, size: number, font: PDFFont, color = INK) =>
  c.page.drawText(safe(t), { x, y: c.H - top, size, font, color });
const derecha = (c: Ctx, t: string, xr: number, top: number, size: number, font: PDFFont, color = INK) =>
  txt(c, t, xr - font.widthOfTextAtSize(safe(t), size), top, size, font, color);
const centro = (c: Ctx, t: string, xc: number, top: number, size: number, font: PDFFont, color = INK) =>
  txt(c, t, xc - font.widthOfTextAtSize(safe(t), size) / 2, top, size, font, color);
const rect = (c: Ctx, x: number, top: number, w: number, h: number, color: ReturnType<typeof rgb>) =>
  c.page.drawRectangle({ x, y: c.H - top - h, width: w, height: h, color });

// ───────── Recibo (media hoja A4: arriba el recibo, abajo queda en blanco) ─────────
/**
 * El recibo ocupa la mitad superior de una hoja A4 vertical (595 x 421), de modo que al imprimirlo
 * queda del tamaño de media hoja. Cubre una o varias cuotas pagadas juntas.
 */
export async function generarReciboPdf(d: ReciboData): Promise<Uint8Array> {
  const c = await crear(`Recibo ${String(d.nro).padStart(6, "0")}`);
  const W = 595;
  const M = 28;
  const total = d.lineas.reduce((s, l) => s + l.importe, 0);

  // Encabezado
  rect(c, 0, 0, W, 64, NAVY);
  rect(c, 0, 64, W, 4, GOLD);
  logo(c, M, 9, 46);
  derecha(c, d.anulado ? "RECIBO ANULADO" : "RECIBO DE PAGO", W - M, 28, 8.5, c.bold, GOLD_L);
  derecha(c, `N° ${String(d.nro).padStart(6, "0")}`, W - M, 52, 19, c.bold, WHITE);

  // Importe y datos del pago
  rect(c, M, 78, W - 2 * M, 54, SOFT);
  rect(c, M, 78, 4, 54, GOLD);
  txt(c, d.anulado ? "IMPORTE (ANULADO)" : "IMPORTE ABONADO", M + 16, 92, 7, c.bold, GRAY);
  txt(c, money(total), M + 16, 120, 25, c.bold, NAVY);
  const col = (x: number, lab: string, val: string) => {
    txt(c, lab, x, 94, 6.8, c.bold, GRAY);
    txt(c, val, x, 112, ajustar(c.bold, safe(val), 105, 10.5, 7), c.bold, INK);
  };
  col(290, "FECHA DE PAGO", fecha(d.fecha));
  col(384, "FORMA DE PAGO", d.metodo);
  col(474, "PRÓX. VENCIMIENTO", d.proxVenc ? fecha(d.proxVenc) : "-");
  txt(c, `${d.lineas.length} ${d.lineas.length === 1 ? "cuota abonada" : "cuotas abonadas"}`, 290, 126, 7.5, c.reg, GRAY);

  // Cliente
  rect(c, M, 140, W - 2 * M, 28, WHITE);
  c.page.drawRectangle({ x: M, y: c.H - 168, width: W - 2 * M, height: 28, borderColor: LINE, borderWidth: 0.8 });
  txt(c, "CLIENTE", M + 8, 151, 6.3, c.bold, GRAY);
  txt(c, d.cliente, M + 8, 162, ajustar(c.bold, safe(d.cliente), 210, 10.5, 7), c.bold, INK);
  txt(c, "DNI", 250, 151, 6.3, c.bold, GRAY);
  txt(c, d.documento || "-", 250, 162, 10.5, c.bold, INK);

  // Sello
  const sello = d.anulado ? "ANULADO" : "PAGADO";
  const colorSello = d.anulado ? rgb(0.45, 0.45, 0.45) : rgb(0.13, 0.5, 0.3);
  const sw = c.bold.widthOfTextAtSize(sello, 15);
  c.page.drawRectangle({ x: 458, y: c.H - 163, width: sw + 16, height: 22, borderColor: colorSello, borderWidth: 1.8, rotate: degrees(2) });
  c.page.drawText(sello, { x: 466, y: c.H - 156, size: 15, font: c.bold, color: colorSello, rotate: degrees(2) });

  // Tabla de cuotas
  const MAX = 8;
  let filas = d.lineas.map((l) => ({
    poliza: l.poliza, comp: l.compania, riesgo: [l.riesgo, l.dominio].filter(Boolean).join(" · "), cuota: l.cuota, vto: l.vtoCuota ? fecha(l.vtoCuota) : "-", importe: l.importe,
  }));
  if (filas.length > MAX) {
    const resto = filas.slice(MAX - 1);
    filas = [...filas.slice(0, MAX - 1), { poliza: "", comp: "", riesgo: `y ${resto.length} cuotas más`, cuota: "", vto: "", importe: resto.reduce((s, f) => s + f.importe, 0) }];
  }
  const rowH = filas.length <= 3 ? 21 : filas.length <= 6 ? 16 : 12;
  const fs = filas.length <= 3 ? 9.5 : filas.length <= 6 ? 8.5 : 7.5;
  let top = 176;
  rect(c, M, top, W - 2 * M, 14, SKY_L);
  const X = { pol: M + 8, riesgo: 150, cuota: 345, vto: 410 };
  for (const [x, t] of [[X.pol, "PÓLIZA"], [X.riesgo, "RIESGO / DOMINIO"], [X.cuota, "CUOTA"], [X.vto, "VENCIMIENTO"]] as [number, string][]) txt(c, t, x, top + 9.5, 6.5, c.bold, NAVY);
  derecha(c, "IMPORTE", W - M - 8, top + 9.5, 6.5, c.bold, NAVY);
  top += 14;
  filas.forEach((f, i) => {
    if (i % 2) rect(c, M, top, W - 2 * M, rowH, SOFT);
    const base = top + rowH / 2 + fs / 3;
    txt(c, f.poliza, X.pol, base, ajustar(c.bold, safe(f.poliza), 105, fs, 6), c.bold, INK);
    txt(c, f.riesgo, X.riesgo, base, ajustar(c.reg, safe(f.riesgo), 185, fs, 6), c.reg, INK);
    txt(c, f.cuota, X.cuota, base, fs, c.reg, INK);
    txt(c, f.vto, X.vto, base, fs, c.reg, INK);
    derecha(c, money(f.importe), W - M - 8, base, fs, c.bold, INK);
    top += rowH;
  });
  rect(c, M, top, W - 2 * M, 18, NAVY);
  txt(c, d.lineas.length > 1 ? `TOTAL (${d.lineas.length} cuotas)` : "TOTAL ABONADO", M + 8, top + 12.5, 8, c.bold, WHITE);
  derecha(c, money(total), W - M - 8, top + 13, 11, c.bold, WHITE);
  top += 18;

  // Agradecimiento y texto legal
  top += 12;
  centro(c, "¡Gracias por confiar en Bertona Seguros!", W / 2, top, 9, c.ital, NAVY);
  top += 9;
  const legal = envolver(c.bold, safe(RECIBO_LEGAL), 6.1, W - 2 * M);
  for (const l of legal) {
    top += 7.2;
    centro(c, l, W / 2, top, 6.1, c.bold, INK);
  }

  // Superintendencia, productor y Meridional
  top += 8;
  const ssnW = 58;
  c.page.drawImage(c.ssn, { x: M, y: c.H - top - ssnW * SSN_RATIO, width: ssnW, height: ssnW * SSN_RATIO });
  txt(c, "Atención al asegurado", M + ssnW + 8, top + 9, 6.5, c.reg, GRAY);
  txt(c, SSN_TELEFONO, M + ssnW + 8, top + 22, 10, c.bold, NAVY);
  const merW = 82;
  c.page.drawImage(c.mer, { x: W - M - merW, y: c.H - top - merW * MERIDIONAL_RATIO - 2, width: merW, height: merW * MERIDIONAL_RATIO });
  centro(c, "PRODUCTOR DE SEGUROS", W / 2 + 8, top + 8, 6.3, c.bold, GRAY);
  centro(c, `${PRODUCTOR.nombre} · MAT. ${PRODUCTOR.matricula}`, W / 2 + 8, top + 19, 7.6, c.bold, INK);

  // Pie (fin de la media hoja)
  rect(c, 0, 421 - 18, W, 18, NAVY);
  rect(c, 0, 421 - 20, W, 2, GOLD);
  centro(
    c,
    `GRUPO BERTONA · ${DIRECCION_COMPLETA} · Cobranza ${TELEFONO_COBRANZA_VISIBLE} · Consultas y siniestros ${EMPRESA.telefonoVisible.replace("+54 ", "")} · bertonaseguros.com`,
    W / 2,
    421 - 6.5,
    6.4,
    c.bold,
    WHITE
  );

  // Línea de corte a la mitad de la hoja
  for (let x = 0; x < W; x += 10) c.page.drawLine({ start: { x, y: c.H - 421 }, end: { x: x + 5, y: c.H - 421 }, thickness: 0.5, color: LINE });

  return c.doc.save();
}

// ───────── Constancia de cobertura (Grupo Bertona) ─────────
export type ConstanciaData = {
  emitida: string; // fecha de emisión ISO
  numero?: string;
  asegurado: string;
  dni?: string;
  domicilio?: string;
  localidad?: string;
  poliza: string;
  compania: string;
  ramo?: string;
  desde: string;
  hasta: string;
  vehiculo?: string;
  uso?: string;
  patente?: string;
  anio?: string;
  motor?: string;
  chasis?: string;
  suma?: string;
  cobertura?: string;
  detalle?: string; // una línea por ítem: "Accidente total: SI"
  productor?: string;
  advertencias: string;
};

export const ADVERTENCIAS_CONSTANCIA =
  "La presente constancia la emite el productor asesor de seguros con los datos de la póliza informados por la compañía aseguradora. No reemplaza a la póliza ni al certificado de cobertura que emite la compañía: la cobertura se rige por las condiciones de la póliza vigente. Ante cualquier duda comuníquese con la compañía o con la oficina del productor. Los asegurados pueden solicitar información a la Superintendencia de Seguros de la Nación: 0800-666-8400 - www.argentina.gob.ar/ssn.";

export async function generarConstanciaPdf(d: ConstanciaData): Promise<Uint8Array> {
  const c = await crear(`Constancia de cobertura ${d.poliza}`);
  const W = 595;
  const M = 36;

  rect(c, 0, 0, W, 78, NAVY);
  rect(c, 0, 78, W, 5, GOLD);
  logo(c, M, 14, 52);
  derecha(c, "CONSTANCIA DE COBERTURA", W - M, 40, 15, c.bold, WHITE);
  derecha(c, d.numero ? `N° ${d.numero}` : "Documento informativo", W - M, 58, 9, c.reg, GOLD_L);

  let top = 98;
  rect(c, M, top, W - 2 * M, 30, SOFT);
  txt(c, "Fecha de emisión", M + 10, top + 12, 7, c.bold, GRAY);
  txt(c, fecha(d.emitida), M + 10, top + 25, 10.5, c.bold, INK);
  txt(c, "Vigencia desde", 250, top + 12, 7, c.bold, GRAY);
  txt(c, d.desde ? fecha(d.desde) : "-", 250, top + 25, 10.5, c.bold, INK);
  txt(c, "Vigencia hasta", 410, top + 12, 7, c.bold, GRAY);
  txt(c, d.hasta ? fecha(d.hasta) : "-", 410, top + 25, 10.5, c.bold, INK);
  top += 42;

  const seccion = (t: string) => {
    rect(c, M, top, W - 2 * M, 17, SKY);
    txt(c, t.toUpperCase(), M + 8, top + 12, 9, c.bold, WHITE);
    top += 17;
  };
  const filas = (items: [string, string | undefined][]) => {
    const vis = items.filter(([, v]) => v && String(v).trim());
    vis.forEach(([k, v], i) => {
      if (i % 2 === 0) rect(c, M, top, W - 2 * M, 17, SOFT);
      txt(c, k + ":", M + 8, top + 12, 8.5, c.bold, GRAY);
      txt(c, String(v), M + 150, top + 12, ajustar(c.bold, safe(String(v)), W - 2 * M - 160, 9.5, 6.5), c.bold, INK);
      top += 17;
    });
    top += 8;
  };

  seccion("Datos del asegurado");
  filas([["Nombre y apellido", d.asegurado], ["DNI", d.dni], ["Domicilio", d.domicilio], ["Localidad", d.localidad]]);
  seccion("Datos de la póliza");
  filas([["Compañía aseguradora", d.compania], ["Número de póliza", d.poliza], ["Ramo", d.ramo], ["Suma asegurada", d.suma]]);
  if ([d.vehiculo, d.patente, d.uso, d.anio, d.motor, d.chasis].some((v) => v && v.trim())) {
    seccion("Datos del vehículo");
    filas([["Vehículo", d.vehiculo], ["Uso", d.uso], ["Patente", d.patente], ["Año", d.anio], ["Motor N°", d.motor], ["Chasis N°", d.chasis]]);
  }
  if ((d.cobertura && d.cobertura.trim()) || (d.detalle && d.detalle.trim())) {
    seccion("Tipo de cobertura");
    const items: [string, string][] = [];
    if (d.cobertura?.trim()) items.push(["Cobertura", d.cobertura.trim()]);
    for (const l of (d.detalle ?? "").split("\n")) {
      const [k, ...r] = l.split(":");
      if (k.trim() && r.join(":").trim()) items.push([k.trim(), r.join(":").trim()]);
      else if (k.trim()) items.push(["", k.trim()]);
    }
    filas(items.map(([k, v]) => [k, v] as [string, string]));
  }
  filas([["Productor asesor de seguros", d.productor || `${PRODUCTOR.matricula} - ${PRODUCTOR.nombre}`]]);

  // Advertencias
  txt(c, "ADVERTENCIAS AL ASEGURADO", M, top + 8, 9, c.bold, NAVY);
  top += 14;
  for (const l of envolver(c.reg, safe(d.advertencias), 7.4, W - 2 * M)) {
    top += 9.2;
    txt(c, l, M, top, 7.4, c.reg, INK);
  }

  // Pie
  const pieTop = 842 - 78;
  rect(c, 0, pieTop, W, 78, NAVY);
  rect(c, 0, pieTop - 4, W, 4, GOLD);
  txt(c, "GRUPO BERTONA", M, pieTop + 22, 10, c.bold, WHITE);
  txt(c, DIRECCION_COMPLETA, M, pieTop + 36, 8, c.reg, GOLD_L);
  txt(c, `Consultas y siniestros ${EMPRESA.telefonoVisible.replace("+54 ", "")} · Cobranza ${TELEFONO_COBRANZA_VISIBLE}`, M, pieTop + 49, 8, c.reg, GOLD_L);
  txt(c, "bertonaseguros.com", M, pieTop + 62, 8, c.reg, GOLD_L);
  const sw = 96;
  c.page.drawRectangle({ x: W - M - sw - 12, y: c.H - pieTop - 66, width: sw + 12, height: 52, color: WHITE });
  c.page.drawImage(c.ssn, { x: W - M - sw - 6, y: c.H - pieTop - 60 + (40 - sw * SSN_RATIO) / 2, width: sw, height: sw * SSN_RATIO });
  return c.doc.save();
}
