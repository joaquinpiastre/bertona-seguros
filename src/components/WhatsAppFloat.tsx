import { waLink } from "@/config/empresa";
import { WhatsAppIcon } from "./Icons";

export function WhatsAppFloat() {
  return (
    <a
      href={waLink("Hola! Quiero hacer una consulta sobre seguros.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1fa855] text-white shadow-lift transition hover:scale-110"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#1fa855] opacity-30 motion-reduce:hidden" aria-hidden />
      <WhatsAppIcon className="relative h-7 w-7" />
    </a>
  );
}
