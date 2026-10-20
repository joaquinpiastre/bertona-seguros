const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
export const money = (n: number | string | null | undefined) => ARS.format(Number(n ?? 0));

/** Fecha de hoy (YYYY-MM-DD) en horario de Argentina. */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

export function fecha(s?: string | null) {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function sumarMeses(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(Math.min(d, ultimo))}`;
}

export function sumarDias(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const METODOS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Tarjeta de crédito",
  mercadopago: "Mercado Pago",
  cheque: "Cheque",
  otro: "Otro",
};

export const PERIODICIDAD: Record<string, { label: string; meses: number }> = {
  mensual: { label: "Mensual", meses: 1 },
  bimestral: { label: "Bimestral", meses: 2 },
  trimestral: { label: "Trimestral", meses: 3 },
  cuatrimestral: { label: "Cuatrimestral", meses: 4 },
  semestral: { label: "Semestral", meses: 6 },
  anual: { label: "Anual", meses: 12 },
};

/** Quién cobra la póliza: la oficina (efectivo / transferencia) o la compañía con la tarjeta del cliente. */
export const COBROS: Record<string, string> = {
  oficina: "Lo cobramos nosotros (efectivo / transferencia)",
  credito: "Tarjeta de crédito (lo cobra la compañía)",
  debito: "Tarjeta de débito (lo cobra la compañía)",
};

/** Cada cuántos meses se actualiza la póliza y hay que renovar el certificado (0 = no se actualiza). */
export const ACTUALIZACION: Record<string, string> = {
  "0": "Sin actualización",
  "3": "Trimestral (cada 3 meses)",
  "4": "Cuatrimestral (cada 4 meses)",
  "6": "Semestral (cada 6 meses)",
  "12": "Anual (cada 12 meses)",
};

export const ESTADOS_POLIZA: Record<string, string> = {
  vigente: "Vigente",
  en_tramite: "En trámite",
  vencida: "Vencida",
  anulada: "Anulada",
};

export const TIPOS_DOC: Record<string, string> = {
  poliza: "Póliza",
  certificado: "Certificado de cobertura",
  recibo: "Recibo",
  comprobante: "Comprobante de pago",
  otro: "Otro",
};

export const PARENTESCOS = ["Pareja", "Madre", "Padre", "Hijo/a", "Hermano/a", "Familiar", "Amigo/a", "Otro"];

/** Número de teléfono para wa.me (Argentina). */
export function waNumero(tel?: string | null) {
  const d = (tel ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return "549" + d.slice(2);
  return "549" + d.replace(/^0/, "");
}

export const TIPOS_SINIESTRO = ["Choque", "Robo / hurto", "Incendio", "Granizo / fenómeno climático", "Daños a terceros", "Cristales", "Otro"];

export const ESTADOS_SINIESTRO: Record<string, string> = {
  denunciado: "Denunciado",
  en_gestion: "En gestión",
  cerrado: "Cerrado",
};
