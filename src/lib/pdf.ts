import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont } from "pdf-lib";
import { DIRECCION_COMPLETA, EMPRESA, PRODUCTOR, RECIBO_LEGAL, SSN_TELEFONO, TELEFONO_COBRANZA } from "@/config/empresa";
import { fecha, money } from "./format";
import { LOGO_B64 } from "./logo-b64";

export type ReciboData = {
  nro: number;
  cliente: string;
  poliza: string;
  fecha: string;
  riesgo: string;
  cuota: string;
  proxVenc: string;
  dominio: string;
  vtoCuota: string;
  compania: string;
  importe: number;
  metodo: string;
  anulado: boolean;
};

const NAVY = rgb(0.129, 0.22, 0.42);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.07, 0.1, 0.17);

// pdf-lib (fuentes estándar) solo codifica WinAnsi.
const safe = (t: string) =>
  (t ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

function ajustar(font: PDFFont, texto: string, ancho: number, max: number, min = 7) {
  let size = max;
  while (size > min && font.widthOfTextAtSize(texto, size) > ancho) size -= 0.5;
  return size;
}

function envolver(font: PDFFont, texto: string, size: number, ancho: number) {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, size) > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Recibo de pago con el formato de la empresa (franja azul, grilla de datos, sello PAGADO). */
export async function generarReciboPdf(d: ReciboData): Promise<Uint8Array> {
  const W = 842;
  const H = 366;
  const doc = await PDFDocument.create();
  doc.setTitle(`Recibo ${String(d.nro).padStart(6, "0")}`);
  doc.setAuthor("Bertona Seguros");
  const page = doc.addPage([W, H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const logo = await doc.embedPng(Buffer.from(LOGO_B64, "base64"));
  const Y = (top: number) => H - top;
  const M = 30;

  page.drawRectangle({ x: 6, y: 6, width: W - 12, height: H - 12, borderColor: NAVY, borderWidth: 1.2 });

  // Título
  page.drawRectangle({ x: 6, y: Y(60), width: W - 12, height: 54, color: NAVY });
  const titulo = d.anulado ? "RECIBO DE PAGO - ANULADO" : "RECIBO DE PAGO";
  page.drawText(titulo, { x: (W - bold.widthOfTextAtSize(titulo, 28)) / 2, y: Y(42), size: 28, font: bold, color: WHITE });
  const nro = `N° ${String(d.nro).padStart(6, "0")}`;
  page.drawText(nro, { x: W - 22 - bold.widthOfTextAtSize(nro, 10), y: Y(22), size: 10, font: bold, color: rgb(0.86, 0.8, 0.65) });

  // Encabezado: logo / empresa / SSN
  page.drawImage(logo, { x: M, y: Y(130), width: 62, height: 62 });
  page.drawText("ORGANIZACION", { x: M + 72, y: Y(92), size: 9, font: bold, color: NAVY });
  page.drawText("BERTONA", { x: M + 72, y: Y(110), size: 19, font: bold, color: NAVY });
  page.drawText("SEGUROS EN GENERAL", { x: M + 72, y: Y(124), size: 8.5, font: bold, color: NAVY });
  const ssn1 = "Superintendencia de Seguros de la Nacion";
  page.drawText(ssn1, { x: W / 2 - reg.widthOfTextAtSize(ssn1, 9) / 2, y: Y(100), size: 9, font: reg, color: INK });
  const ssn2 = SSN_TELEFONO;
  page.drawText(ssn2, { x: W / 2 - bold.widthOfTextAtSize(ssn2, 12) / 2, y: Y(116), size: 12, font: bold, color: NAVY });
  const cob = `Consultas: ${EMPRESA.telefonoVisible}`;
  page.drawText(cob, { x: W - M - reg.widthOfTextAtSize(cob, 9), y: Y(100), size: 9, font: reg, color: INK });

  // Grilla 3 x 4
  const colW = 255;
  const gap = 8.5;
  const labW = 82;
  const rowH = 27;
  const filas: [string, string][][] = [
    [["CLIENTE:", d.cliente], ["POLIZA:", d.poliza], ["FECHA PAGO:", fecha(d.fecha)]],
    [["RIESGO:", d.riesgo || "-"], ["CUOTA N°:", d.cuota], ["PROX VENC:", d.proxVenc ? fecha(d.proxVenc) : "-"]],
    [["DOMINIO:", d.dominio || "-"], ["VTO CUOTA:", d.vtoCuota ? fecha(d.vtoCuota) : "-"], ["", ""]],
    [["COMPANIA:", d.compania], ["IMPORTE C.:", money(d.importe)], ["FORMA PAGO:", d.metodo]],
  ];
  filas.forEach((fila, r) => {
    const top = 142 + r * (rowH + 6);
    fila.forEach(([lab, val], c) => {
      if (!lab) return;
      const x = M + c * (colW + gap);
      page.drawRectangle({ x, y: Y(top + rowH), width: labW, height: rowH, color: NAVY });
      const ls = ajustar(bold, safe(lab), labW - 8, 9, 6.5);
      page.drawText(safe(lab), { x: x + (labW - bold.widthOfTextAtSize(safe(lab), ls)) / 2, y: Y(top + rowH / 2 + 3.2), size: ls, font: bold, color: WHITE });
      const vx = x + labW + 3;
      const vw = colW - labW - 3;
      page.drawRectangle({ x: vx, y: Y(top + rowH), width: vw, height: rowH, borderColor: INK, borderWidth: 1 });
      const t = safe(val);
      const vs = ajustar(bold, t, vw - 10, 12, 6.5);
      page.drawText(t, { x: vx + (vw - bold.widthOfTextAtSize(t, vs)) / 2, y: Y(top + rowH / 2 + vs / 3), size: vs, font: bold, color: INK });
    });
  });

  // Sello
  const sello = d.anulado ? "ANULADO" : "PAGADO";
  const color = d.anulado ? rgb(0.45, 0.45, 0.45) : rgb(0.88, 0.16, 0.16);
  page.drawText(sello, { x: M + 2 * (colW + gap) + 60, y: Y(142 + 2 * (rowH + 6) + 30), size: 34, font: bold, color, rotate: degrees(3) });

  // Texto legal
  const legal = envolver(reg, safe(RECIBO_LEGAL), 7.4, W - 2 * M);
  let ty = 142 + 4 * (rowH + 6) + 8;
  for (const l of legal) {
    page.drawText(l, { x: M, y: Y(ty), size: 7.4, font: reg, color: INK });
    ty += 9;
  }
  const prod = safe(`PRODUCTOR DE SEGUROS: ${PRODUCTOR.nombre} MAT: ${PRODUCTOR.matricula}`);
  page.drawText(prod, { x: W - M - bold.widthOfTextAtSize(prod, 7.5), y: Y(ty + 8), size: 7.5, font: bold, color: INK });

  // Pie
  page.drawRectangle({ x: 6, y: 6, width: W - 12, height: 24, color: NAVY });
  const pie = safe(
    `${DIRECCION_COMPLETA.replace(", ", " - ").replace(", ", " ").toUpperCase()}  OFICINA ${EMPRESA.telefonoTel.replace("+54", "")}  COBRANZA ${TELEFONO_COBRANZA}  MAT ${PRODUCTOR.matricula}`
  );
  const ps = ajustar(bold, pie, W - 40, 9, 6);
  page.drawText(pie, { x: (W - bold.widthOfTextAtSize(pie, ps)) / 2, y: 14, size: ps, font: bold, color: WHITE });

  return doc.save();
}
