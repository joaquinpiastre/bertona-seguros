"use client";
import { useState } from "react";
import { btnGhost, btnGold } from "./ui";

/**
 * Manda el recibo (PDF generado por el sistema) al cliente por WhatsApp.
 * En el celular abre el menú de compartir con el PDF adjunto; en la computadora abre WhatsApp con el mensaje y un enlace al PDF.
 */
export function EnviarRecibo({ pagoId, nro, whatsapp, mensaje, enlace }: { pagoId: number; nro: string; whatsapp: string; mensaje: string; enlace: string }) {
  const [estado, setEstado] = useState<"" | "preparando" | "listo" | "enlace">("");
  const urlWa = (texto: string) => (whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`);
  const conEnlace = `${mensaje}\n\nTu recibo en PDF: ${enlace}`;

  async function enviarPdf() {
    setEstado("preparando");
    try {
      const r = await fetch(`/api/recibo/${pagoId}?sistema=1`);
      if (!r.ok) throw new Error("No se pudo preparar el recibo");
      const file = new File([await r.blob()], `recibo-${nro}.pdf`, { type: "application/pdf" });
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: mensaje, title: `Recibo ${nro}` });
        setEstado("listo");
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return setEstado("");
    }
    // Sin menú de compartir (computadora): WhatsApp con el mensaje y el enlace al PDF.
    window.open(urlWa(conEnlace), "_blank", "noopener,noreferrer");
    setEstado("enlace");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={enviarPdf} disabled={estado === "preparando"} className={btnGold}>
          {estado === "preparando" ? "Preparando el PDF…" : "Enviar recibo (PDF) por WhatsApp"}
        </button>
        <a href={urlWa(conEnlace)} target="_blank" rel="noopener noreferrer" className={btnGhost}>Enviar enlace del recibo</a>
        <a href={`/api/recibo/${pagoId}?sistema=1`} download={`recibo-${nro}.pdf`} className={btnGhost}>Descargar PDF</a>
      </div>
      <p className="text-xs text-ink-soft">
        {estado === "enlace"
          ? "Se abrió WhatsApp con el mensaje y un enlace para abrir el PDF. Tocá enviar."
          : estado === "listo"
            ? "Listo: elegiste con quién compartirlo."
            : "En el celular se adjunta el PDF directamente. En la computadora se manda el mensaje con un enlace al PDF (o descargalo y adjuntalo vos)."}
      </p>
    </div>
  );
}
