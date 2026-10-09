/**
 * Imágenes del sitio (archivos optimizados en /public/images, formato webp).
 * Fuentes y licencias:
 *  - Pexels (licencia Pexels, uso comercial libre, sin atribución obligatoria): https://www.pexels.com/license/
 *  - Wikimedia Commons (licencias Creative Commons: se muestran los créditos en el pie del sitio).
 * No contienen logos de otras aseguradoras.
 */
import type { RamoId } from "./empresa";

export type Img = { src: string; alt: string; w: number; h: number };

export const IMG = {
  // Wikimedia Commons — "Vineyard in Mendoza, Argentina.jpg", David, CC BY 2.0
  hero: { src: "/images/hero-vinedos.webp", alt: "Viñedos de Mendoza frente a la cordillera de los Andes", w: 2000, h: 1239 },
  // Wikimedia Commons — "Cañon del Atuel - panoramio.jpg", Elvis Boaventura, CC BY 3.0
  atuel: { src: "/images/atuel.webp", alt: "Río Atuel y sus paredes de roca en el Cañón del Atuel, San Rafael", w: 1200, h: 900 },
  // Wikimedia Commons — "Embalse Valle Grande- San Rafael - Mendoza 2023.jpg", Poxirambo, CC BY-SA 4.0
  valleGrande: { src: "/images/valle-grande.webp", alt: "Embalse Valle Grande, San Rafael, Mendoza", w: 1200, h: 897 },
  // Pexels (pexels.com/photo/7731318, 7735626, 8441861)
  asesoramiento: { src: "/images/asesoramiento.webp", alt: "Asesor explicando una póliza de seguro a clientes", w: 1200, h: 792 },
  nosotros: { src: "/images/nosotros.webp", alt: "Asesor de seguros atendiendo a una pareja de clientes", w: 1400, h: 934 },
} satisfies Record<string, Img>;

// Pexels: autos 3786091 · motos 5206867 · hogar 9976121 · comercio 4473399 · vida 4609096
//         accidentes 8631628 · art 8961030 · agro 2255801 · caución 6814526 · rc 7731318
export const IMG_RAMO: Record<RamoId, Img> = {
  autos: { src: "/images/autos.webp", alt: "Auto sedán negro estacionado en un camino", w: 1000, h: 1500 },
  motos: { src: "/images/motos.webp", alt: "Motociclista circulando por una avenida", w: 1000, h: 666 },
  hogar: { src: "/images/hogar.webp", alt: "Casa moderna con jardín", w: 1000, h: 666 },
  comercio: { src: "/images/comercio.webp", alt: "Comerciante en la puerta de su local", w: 1000, h: 666 },
  vida: { src: "/images/vida.webp", alt: "Familia leyendo un libro junta en el hogar", w: 1000, h: 666 },
  accidentes: { src: "/images/accidentes.webp", alt: "Pareja sonriendo al aire libre", w: 1000, h: 667 },
  art: { src: "/images/art.webp", alt: "Trabajadores con casco y chaleco en una obra", w: 1000, h: 666 },
  agro: { src: "/images/agro.webp", alt: "Tractor cosechando en un campo", w: 1000, h: 662 },
  caucion: { src: "/images/caucion.webp", alt: "Persona firmando un contrato", w: 1000, h: 666 },
  rc: { src: "/images/rc.webp", alt: "Revisión de documentación y póliza en un escritorio", w: 1000, h: 729 },
};

export const CREDITOS = [
  "Viñedos de Mendoza: David, CC BY 2.0, vía Wikimedia Commons.",
  "Cañón del Atuel: Elvis Boaventura, CC BY 3.0, vía Wikimedia Commons.",
  "Embalse Valle Grande: Poxirambo, CC BY-SA 4.0, vía Wikimedia Commons.",
  "Demás fotografías: Pexels (licencia Pexels).",
];
