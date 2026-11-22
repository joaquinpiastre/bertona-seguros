import type { Metadata, Viewport } from "next";
import { MarcoSorteo } from "@/components/sorteo/Publico";

export const metadata: Metadata = {
  title: "Sorteo Speedway",
  description: "Participá gratis del sorteo de Bertona Seguros en el Speedway de San Rafael: completá tus datos y confirmá por WhatsApp.",
};

export const viewport: Viewport = { themeColor: "#0d1e3a" };

export default function SorteoLayout({ children }: { children: React.ReactNode }) {
  return <MarcoSorteo>{children}</MarcoSorteo>;
}
