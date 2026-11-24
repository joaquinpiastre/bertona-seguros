/**
 * Aviso que ven TODOS los clientes en el inicio de su cuenta (/portal).
 * Para cambiarlo, editá el texto; para sacarlo, dejá AVISO_CLIENTES = null.
 */
export const AVISO_CLIENTES: { titulo: string; parrafos: string[]; firma: string; consulta: string } | null = {
  titulo: "Aviso importante: RTO bonificada",
  parrafos: [
    "Te informamos que, debido al aumento en el costo de la oblea, el beneficio de la RTO bonificada ya no se encuentra disponible.",
    "Si tenés cualquier consulta sobre tu cobertura, escribinos o llamanos: estamos para ayudarte.",
  ],
  firma: "¡Saludos! Bertona Seguros",
  // Mensaje precargado del botón de WhatsApp.
  consulta: "Hola! Tengo una consulta sobre la RTO bonificada y mi cobertura.",
};
