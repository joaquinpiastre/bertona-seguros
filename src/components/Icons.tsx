import type { RamoId } from "@/config/empresa";

type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const RAMO_ICONS: Record<RamoId, (p: P) => React.JSX.Element> = {
  autos: (p) => (
    <svg {...base} {...p}><path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4" /><path d="M3.5 16h17v2.5h-3V17M6.5 17v1.5h-3V16" /><circle cx="7.5" cy="13.5" r=".6" /><circle cx="16.5" cy="13.5" r=".6" /><path d="M5.5 11.5h13" /></svg>
  ),
  motos: (p) => (
    <svg {...base} {...p}><circle cx="5.5" cy="16" r="3" /><circle cx="18.5" cy="16" r="3" /><path d="M5.5 16l3-6h5l3 6M13.5 10l-1.5-3h-2M12 16h-3M15 7h2.5" /></svg>
  ),
  hogar: (p) => (
    <svg {...base} {...p}><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5.5h4V20" /></svg>
  ),
  comercio: (p) => (
    <svg {...base} {...p}><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12.5V20h13v-7.5M10 20v-4h4v4" /></svg>
  ),
  vida: (p) => (
    <svg {...base} {...p}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" /><path d="M8 12h2l1.2-2 1.6 4 1.2-2h2" /></svg>
  ),
  accidentes: (p) => (
    <svg {...base} {...p}><path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.2 7 9 4.1-1.8 7-4.8 7-9V6l-7-2.5Z" /><path d="M12 8.5v6M9 11.5h6" /></svg>
  ),
  art: (p) => (
    <svg {...base} {...p}><path d="M5 14a7 7 0 0 1 14 0" /><path d="M3.5 14h17v2.5h-17zM12 7V4M9.5 8.2 8.5 5.5M14.5 8.2l1-2.7" /><path d="M7 19.5h10" /></svg>
  ),
  agro: (p) => (
    <svg {...base} {...p}><path d="M12 21V9" /><path d="M12 9c0-3 1.8-4.5 4-5 .3 2.6-1 4.5-4 5ZM12 9C12 6 10.2 4.5 8 4c-.3 2.6 1 4.5 4 5ZM12 14c0-2.5 1.6-3.8 3.6-4.2.2 2.2-1 3.8-3.6 4.2ZM12 14c0-2.5-1.6-3.8-3.6-4.2-.2 2.2 1 3.8 3.6 4.2Z" /></svg>
  ),
  caucion: (p) => (
    <svg {...base} {...p}><path d="M7 3.5h7l4 4V20.5H7z" /><path d="M14 3.5v4h4" /><path d="m9.5 14.5 1.8 1.8 3.4-3.6" /></svg>
  ),
  rc: (p) => (
    <svg {...base} {...p}><path d="M12 4v16M5 8h14" /><path d="M5 8 2.8 14a3 3 0 0 0 4.4 0L5 8ZM19 8l-2.2 6a3 3 0 0 0 4.4 0L19 8Z" /><path d="M8.5 20h7" /></svg>
  ),
};

export const WhatsAppIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.500-.7-2.500-1.300-3.400-2.900-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.4c-.2 0-.5.1-.7.300-.2.300-.9.900-.9 2.200s.9 2.500 1 2.700c.1.200 1.800 2.800 4.500 3.900 1.700.7 2.400.8 3.200.7.500-.1 1.500-.6 1.700-1.200.2-.6.2-1.100.2-1.200-.1-.1-.3-.2-.6-.3Z" />
  </svg>
);

export const StarIcon = ({ className, fill = 1 }: P & { fill?: number }) => {
  const id = `s${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="currentColor" />
          <stop offset={`${fill * 100}%`} stopColor="#d6deeb" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="m12 2.8 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8L12 2.8Z" />
    </svg>
  );
};

export const FacebookIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.300c-.3 0-1.200-.1-2.300-.1-2.300 0-3.900 1.400-3.900 4v2.200H7.800v3h2.600V21h3.100Z" /></svg>
);
export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></svg>
);
export const PhoneIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 4h4l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2L15 12.500l4 1.500v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
);
export const MailIcon = ({ className }: P) => (
  <svg {...base} className={className}><rect x="3" y="5" width="18" height="14" rx="2.500" /><path d="m3.500 7 8.500 6 8.500-6" /></svg>
);
export const PinIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 21s7-6 7-11.500A7 7 0 0 0 5 9.500C5 15 12 21 12 21Z" /><circle cx="12" cy="9.500" r="2.500" /></svg>
);
export const ClockIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const ArrowIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const MenuIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
