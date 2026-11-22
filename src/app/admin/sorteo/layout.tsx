import type { Metadata } from "next";
import { PestanasSorteo } from "@/components/sorteo/admin/Pestanas";

export const metadata: Metadata = { title: "Sorteo", robots: { index: false, follow: false } };

/** Sección Sorteo del panel: usa el layout y el control de acceso del administrador (src/app/admin/layout.tsx). */
export default function SorteoAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PestanasSorteo />
      {children}
    </>
  );
}
