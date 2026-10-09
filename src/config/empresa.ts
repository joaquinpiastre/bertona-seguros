/**
 * Configuración central de Bertona Seguros.
 * Todo lo marcado con TODO son datos a confirmar con el cliente: NO son datos reales.
 */

// ───────── Datos verificados ─────────
export const EMPRESA = {
  nombre: "Bertona Seguros",
  nombreLargo: "Organización Bertona",
  rubro: "Productor asesor de seguros",
  // Otras fuentes indican "San Lorenzo 580": confirmar y editar acá.
  direccion: {
    calle: "San Lorenzo 600",
    ciudad: "San Rafael",
    provincia: "Mendoza",
    cp: "5600",
    pais: "AR",
  },
  telefonoVisible: "+54 260 456-8276",
  telefonoTel: "+542604568276",
  // Formato internacional para WhatsApp (con el 9 de celulares).
  whatsapp: "5492604568276",
  email: "cotizacionesbertona@yahoo.com.ar",
  web: "https://bertonaseguros.com.ar",
  facebook: "https://www.facebook.com/SegurosBertona",
  instagram: "https://www.instagram.com/seguros_bertona/",
  reputacion: { estrellas: 4.5, resenas: 35, seguidoresFacebook: "10 mil" },
} as const;

export const DIRECCION_COMPLETA = `${EMPRESA.direccion.calle}, ${EMPRESA.direccion.ciudad}, ${EMPRESA.direccion.provincia}`;

export const waLink = (mensaje?: string) =>
  `https://wa.me/${EMPRESA.whatsapp}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;

// ───────── DATOS A CONFIRMAR (placeholders) ─────────

// TODO: confirmar horarios reales de atención.
export const HORARIOS = [
  { dias: "Lunes a viernes", horas: "[completar]" },
  { dias: "Sábados", horas: "[completar]" },
];

// TODO: N° de matrícula SSN real del productor asesor.
export const MATRICULA_SSN = "[completar]";

// TODO: reemplazar por el enlace real de Google Maps / embed de la ficha de la empresa.
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  "San Lorenzo 600, San Rafael, Mendoza, Argentina"
)}&output=embed`;
// TODO: link real a la ficha de Google (reseñas).
export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Bertona Seguros San Lorenzo 600 San Rafael Mendoza"
)}`;

// TODO: confirmar cifras reales. Con `null` no se muestran en el sitio.
export const CIFRAS: { valor: string; etiqueta: string }[] | null = null;
// Ejemplo: [{ valor: "+20", etiqueta: "años de trayectoria" }, ...]

// TODO: nombres reales de las aseguradoras. Hoy se muestran como logos placeholder neutros.
export const ASEGURADORAS: string[] = [
  "Aseguradora 1",
  "Aseguradora 2",
  "Aseguradora 3",
  "Aseguradora 4",
  "Aseguradora 5",
  "Aseguradora 6",
];

// TODO: reemplazar por reseñas reales de Google (con autorización).
export const TESTIMONIOS = [
  {
    nombre: "[Nombre del cliente]",
    detalle: "Seguro de auto",
    texto:
      "Texto de ejemplo editable: me asesoraron con claridad y me acompañaron en todo el trámite del siniestro.",
  },
  {
    nombre: "[Nombre del cliente]",
    detalle: "Seguro de hogar",
    texto:
      "Texto de ejemplo editable: respuesta rápida por WhatsApp y una cobertura armada a mi medida.",
  },
  {
    nombre: "[Nombre del cliente]",
    detalle: "Seguro de comercio",
    texto:
      "Texto de ejemplo editable: trato cercano y profesional, siempre disponibles cuando los necesité.",
  },
];

// TODO: confirmar ramos exactos con el cliente.
export type RamoId =
  | "autos" | "motos" | "hogar" | "comercio" | "vida"
  | "accidentes" | "art" | "agro" | "caucion" | "rc";

export const RAMOS: { id: RamoId; nombre: string; descripcion: string }[] = [
  { id: "autos", nombre: "Autos", descripcion: "Cobertura para tu vehículo, desde responsabilidad civil hasta todo riesgo." },
  { id: "motos", nombre: "Motos", descripcion: "Protegé tu moto y a terceros con planes simples y accesibles." },
  { id: "hogar", nombre: "Hogar", descripcion: "Cuidá tu casa y tus pertenencias ante robo, incendio y más." },
  { id: "comercio", nombre: "Comercio", descripcion: "Respaldo para tu local, mercadería y actividad comercial." },
  { id: "vida", nombre: "Vida", descripcion: "Tranquilidad y protección económica para quienes más querés." },
  { id: "accidentes", nombre: "Accidentes personales", descripcion: "Cobertura ante imprevistos, en el trabajo y en tu día a día." },
  { id: "art", nombre: "ART / Riesgos del trabajo", descripcion: "Cumplí con la ley y cuidá a tu equipo con una ART acorde." },
  { id: "agro", nombre: "Agro", descripcion: "Seguros para cosechas, maquinaria y producción de campo." },
  { id: "caucion", nombre: "Caución", descripcion: "Garantías para contratos, alquileres y obras, sin inmovilizar capital." },
  { id: "rc", nombre: "Responsabilidad civil", descripcion: "Protección ante reclamos de terceros por daños involuntarios." },
];

// TODO: ajustar textos de historia/valores y datos del equipo.
export const NOSOTROS = {
  titulo: "Cerca tuyo, en San Rafael",
  parrafos: [
    "Somos una agencia de seguros de San Rafael, Mendoza. Trabajamos para que cada persona, familia y comercio tenga el respaldo que necesita, con un trato humano y sin letra chica.",
    "Creemos que un seguro no es un trámite: es tranquilidad. Por eso te escuchamos, comparamos opciones y te acompañamos desde la cotización hasta el último paso de un siniestro.",
  ],
  valores: ["Cercanía", "Transparencia", "Compromiso", "Responsabilidad"],
};

export const FAQ = [
  {
    q: "¿Cómo cotizo un seguro?",
    a: "Es muy simple: escribinos por WhatsApp o completá el formulario de esta página, contanos qué querés asegurar y te enviamos las mejores opciones, sin compromiso.",
  },
  {
    q: "¿Qué documentación necesito para contratar?",
    a: "Depende del seguro. Para un auto suele pedirse DNI, cédula verde o título y datos del vehículo; para el hogar, datos de la propiedad. Te indicamos exactamente qué necesitás.",
  },
  {
    q: "¿Qué hago ante un siniestro?",
    a: "Mantené la calma, resguardá a las personas, juntá datos y fotos si es posible y avisanos de inmediato por WhatsApp. Nosotros te guiamos paso a paso en la denuncia y el seguimiento.",
  },
  {
    q: "¿Puedo cambiar mi seguro actual a Bertona Seguros?",
    a: "Sí. Revisamos tu póliza vigente, te mostramos alternativas y nos encargamos de la gestión del cambio para que no quedes sin cobertura.",
  },
  {
    q: "¿Cómo se pagan las pólizas?",
    a: "Las formas de pago dependen de cada aseguradora (débito, tarjeta, efectivo, etc.). Te asesoramos para elegir la más conveniente. [TODO: confirmar con el cliente]",
  },
  {
    q: "¿Atienden fuera de San Rafael?",
    a: "Podemos asesorarte a distancia por WhatsApp y mail. [TODO: confirmar alcance geográfico con el cliente]",
  },
];

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? EMPRESA.web;
