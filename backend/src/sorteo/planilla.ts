/**
 * Planillas para exportar participantes:
 *  - Excel (.xlsx) mínimo, con todas las celdas como texto: los WhatsApp no se convierten en números raros
 *    y nada de lo que escribió un participante puede ejecutarse como fórmula.
 *  - CSV (separado por ";" y con BOM, como el resto del sistema) para otras herramientas.
 */
import { strToU8, zipSync } from "fflate";

const xml = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 0 → A, 25 → Z, 26 → AA. */
function columna(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const CABECERA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = "http://schemas.openxmlformats.org";

export function crearXlsx(hoja: string, cabecera: string[], filas: string[][], anchos: number[] = []): Uint8Array {
  const celdas = (f: string[], r: number) =>
    f
      .map((v, j) => (v === "" ? "" : `<c r="${columna(j)}${r}" t="inlineStr"${r === 1 ? ' s="1"' : ""}><is><t xml:space="preserve">${xml(v)}</t></is></c>`))
      .join("");
  const datos = [cabecera, ...filas].map((f, i) => `<row r="${i + 1}">${celdas(f.map((v) => String(v ?? "")), i + 1)}</row>`).join("");
  const cols = anchos.length ? `<cols>${anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
  const nombre = xml(hoja.replace(/[\[\]:*?/\\]/g, " ").slice(0, 31) || "Hoja1");

  const archivos: Record<string, string> = {
    "[Content_Types].xml":
      CABECERA_XML +
      `<Types xmlns="${NS}/package/2006/content-types">` +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      "</Types>",
    "_rels/.rels":
      CABECERA_XML +
      `<Relationships xmlns="${NS}/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      "</Relationships>",
    "xl/workbook.xml":
      CABECERA_XML +
      `<workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships">` +
      `<sheets><sheet name="${nombre}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels":
      CABECERA_XML +
      `<Relationships xmlns="${NS}/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      "</Relationships>",
    "xl/styles.xml":
      CABECERA_XML +
      `<styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      "</styleSheet>",
    "xl/worksheets/sheet1.xml":
      CABECERA_XML +
      `<worksheet xmlns="${NS}/spreadsheetml/2006/main">` +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      `${cols}<sheetData>${datos}</sheetData></worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(archivos).map(([k, v]) => [k, strToU8(v)])));
}

/** Celda de CSV. Lo que empieza con = + - @ se antepone con ' para que Excel no lo tome como fórmula. */
export function celdaCsv(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function crearCsv(cabecera: string[], filas: string[][]): string {
  return "﻿" + [cabecera, ...filas].map((f) => f.map(celdaCsv).join(";")).join("\r\n") + "\r\n";
}
