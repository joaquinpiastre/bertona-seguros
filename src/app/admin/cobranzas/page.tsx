import { redirect } from "next/navigation";

/** La sección se renombró a Vencimientos. */
export default function Cobranzas() {
  redirect("/admin/vencimientos");
}
