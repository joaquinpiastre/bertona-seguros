import type { ReactNode } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const P: Record<string, ReactNode> = {
  inicio: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5.5h4V20" /></>,
  pagar: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></>,
  papeles: <><path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.2 7 9 4.1-1.8 7-4.8 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  siniestro: <><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
  mas: <><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>,
  poliza: <><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" /></>,
  recibo: <><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8.5h6M9 12h6" /></>,
  tramite: <><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17l-1 3Z" /><path d="m14.5 7.5 3 3" /></>,
  auxilio: <><path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4" /><path d="M3.5 16h17v2.5h-3V17M6.5 17v1.5h-3V16" /><path d="M14 3.5 17 6M17 3.5 14 6" /></>,
  contactos: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.5-3.2 2.9-5 6-5s5.5 1.8 6 5" /><path d="M16 5.5a3 3 0 0 1 0 6M18 14.3c1.6.6 2.7 2 3 4.7" /></>,
  datos: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.6-3.6 3.2-5.6 7-5.6s6.4 2 7 5.6" /></>,
  ayuda: <><path d="M5 13a7 7 0 0 1 14 0" /><rect x="3.5" y="12.5" width="3.5" height="6" rx="1.2" /><rect x="17" y="12.5" width="3.5" height="6" rx="1.2" /><path d="M19 18.5c0 1.6-1.5 2.5-4 2.5" /></>,
  telefono: <path d="M5 4h4l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2L15 12.500l4 1.500v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  vencimientos: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></>,
  aviso: <><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></>,
  clientes: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.5-3.2 2.9-5 6-5s5.5 1.8 6 5" /><path d="M17.5 8v6M14.5 11h6" /></>,
  config: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>,
  equipo: <><circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H21M17 12v3M20 12v2" /></>,
  buscar: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5.5 5.5" /></>,
  cobrar: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.500v.1M18 14.500v.1" /></>,
  salir: <><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.500v13A1.500 1.500 0 0 0 5.500 20H10" /><path d="M15 8l4 4-4 4M19 12H9" /></>,
  letra: <><path d="M3.5 19 9 5l5.5 14M5.5 14h7" /><path d="M16.5 19l2.500-6 2.500 6M17.400 17h3.200" /></>,
  siniestros: <><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
  pagos: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></>,
  polizas: <><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" /></>,
  inforpago: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19.500h16" /></>,
};

export type NombreIcono = keyof typeof P;

export function Icono({ n, className = "h-6 w-6" }: { n: NombreIcono; className?: string }) {
  return (
    <svg {...base} className={className}>
      {P[n]}
    </svg>
  );
}
