import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PageShell } from "@/components/PageShell";
import { DIRECCION_COMPLETA, EMPRESA, MATRICULA_SSN, PRODUCTOR, SSN_TELEFONO } from "@/config/empresa";
import { MERIDIONAL } from "@/config/meridional";

export const metadata: Metadata = {
  title: "Legales y política de privacidad",
  description: "Aviso legal, política de privacidad y uso de cookies de Grupo Bertona, productor asesor de seguros en San Rafael, Mendoza.",
  alternates: { canonical: "/legales" },
};

const ACTUALIZADO = "16 de noviembre de 2026";

const h2 = "scroll-mt-40 text-3xl text-brand-900 sm:text-4xl";
const h3 = "mt-8 text-xl text-brand-900";
const p = "mt-3 leading-relaxed text-ink-soft";
const ul = "mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-ink-soft";
const enlace = "font-semibold text-sky-700 underline underline-offset-4 hover:text-sky-600";

const SECCIONES = [
  ["aviso-legal", "Aviso legal"],
  ["privacidad", "Política de privacidad"],
  ["cookies", "Cookies y almacenamiento"],
  ["reclamos", "Consultas y reclamos"],
] as const;

export default function Legales() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Información legal"
        titulo="Legales y política de privacidad"
        texto="Quiénes somos, cómo usamos este sitio y cómo cuidamos tus datos personales."
        migas={[{ href: "/", t: "Inicio" }, { t: "Legales" }]}
      />

      <nav aria-label="Secciones legales" className="sticky top-[72px] z-30 border-b border-line bg-white/95 backdrop-blur lg:top-[108px]">
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {SECCIONES.map(([id, l]) => (
            <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-bold text-brand-800 hover:border-sky-500 hover:bg-sky-50">{l}</a></li>
          ))}
        </ul>
      </nav>

      {/* Aviso legal */}
      <section id="aviso-legal" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Aviso legal</h2>
          <p className={p}>Última actualización: {ACTUALIZADO}.</p>

          <h3 className={h3}>Quiénes somos</h3>
          <p className={p}>
            Este sitio (<strong>{EMPRESA.web.replace("https://", "")}</strong>) es operado por <strong>{EMPRESA.nombreLargo}</strong>, productor asesor de seguros: {PRODUCTOR.nombre}, matrícula SSN N° {MATRICULA_SSN}.
            Domicilio: {DIRECCION_COMPLETA} (CP {EMPRESA.direccion.cp}). Teléfono: {EMPRESA.telefonoVisible}. Email:{" "}
            <a className={enlace} href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>.
          </p>

          <h3 className={h3}>Qué es y qué no es este sitio</h3>
          <ul className={ul}>
            <li>Los contenidos son <strong>informativos</strong> y no constituyen una oferta vinculante ni asesoramiento personalizado.</li>
            <li>Las coberturas, condiciones, exclusiones y primas dependen de cada compañía aseguradora y de lo que figure en tu póliza. Ante cualquier diferencia, rige la póliza.</li>
            <li>
              La compañía aseguradora con la que trabajamos es {MERIDIONAL.nombre} (inscripción SSN N° {MERIDIONAL.inscripcionSSN}). Somos un productor asesor independiente de la aseguradora: no emitimos
              pólizas por nuestra cuenta.
            </li>
            <li>
              La actividad aseguradora está controlada por la Superintendencia de Seguros de la Nación (SSN):{" "}
              <a className={enlace} href="https://www.argentina.gob.ar/ssn" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/ssn</a>.
              Atención al asegurado: {SSN_TELEFONO}.
            </li>
          </ul>

          <h3 className={h3}>Tu cuenta de cliente</h3>
          <p className={p}>
            El ingreso a la cuenta es personal (DNI y contraseña que te entrega la oficina). Es tu responsabilidad cuidar la contraseña y no compartirla; podés cambiarla cuando quieras desde «Mis datos».
            Los pagos que informás desde la cuenta quedan <strong>en revisión</strong> hasta que la oficina los aprueba, y pueden demorar hasta 48 hs en acreditarse. Un pago no se considera registrado hasta que se emite el recibo.
          </p>

          <h3 className={h3}>Propiedad intelectual y enlaces</h3>
          <p className={p}>
            Los logos, textos y diseño del sitio pertenecen a Grupo Bertona. Las marcas de terceros (por ejemplo, Meridional Seguros o la Superintendencia de Seguros de la Nación) pertenecen a sus titulares y se
            muestran solo a modo informativo. Algunas fotografías tienen licencias de terceros: los créditos figuran al pie del sitio. Podemos enlazar a sitios externos; no controlamos sus contenidos ni sus políticas.
          </p>
        </div>
      </section>

      {/* Privacidad */}
      <section id="privacidad" className="bg-sky-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Política de privacidad</h2>
          <p className={p}>
            Cuidamos tus datos personales y los tratamos conforme a la Ley N° 25.326 de Protección de los Datos Personales y sus normas complementarias. Acá te explicamos, de forma simple, qué datos usamos, para qué y qué
            derechos tenés.
          </p>

          <h3 className={h3}>Responsable del tratamiento</h3>
          <p className={p}>
            {EMPRESA.nombreLargo} ({PRODUCTOR.nombre}, matrícula SSN N° {MATRICULA_SSN}), {DIRECCION_COMPLETA}. Para cualquier consulta sobre tus datos escribinos a{" "}
            <a className={enlace} href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o llamanos al {EMPRESA.telefonoVisible}.
          </p>

          <h3 className={h3}>Qué datos tratamos y cómo los obtenemos</h3>
          <ul className={ul}>
            <li>
              <strong>Cuando nos escribís por este sitio o por WhatsApp:</strong> el formulario de contacto y el de «solicitar alta» arman un mensaje de WhatsApp con lo que completás (por ejemplo, nombre, DNI, teléfono, tipo de seguro
              o patente). Ese mensaje lo enviás vos desde tu WhatsApp; el sitio no lo guarda.
            </li>
            <li>
              <strong>Si sos cliente:</strong> nombre y apellido, DNI o CUIT, teléfono, email, domicilio y localidad; datos de tus pólizas y de los bienes asegurados (por ejemplo, vehículo y patente); cuotas, pagos y recibos;
              documentos y comprobantes que subís; siniestros, trámites y pedidos que nos hacés; y los contactos de emergencia que decidas cargar.
            </li>
            <li>
              <strong>Datos de tu cuenta:</strong> tu DNI como usuario y tu contraseña, que se guarda de forma protegida (no la podemos leer, salvo la que la oficina te entrega la primera vez para que puedas
              ingresar, hasta que la cambies).
            </li>
          </ul>

          <h3 className={h3}>Para qué los usamos</h3>
          <ul className={ul}>
            <li>Cotizar, contratar, administrar y renovar tus seguros, y gestionar los siniestros y trámites que pidas.</li>
            <li>Cobrar tus cuotas, registrar tus pagos y emitir tus recibos.</li>
            <li>Avisarte por WhatsApp, teléfono o email sobre vencimientos, cuotas, renovaciones y novedades de tu póliza.</li>
            <li>Cumplir obligaciones legales y las normas de la Superintendencia de Seguros de la Nación.</li>
          </ul>
          <p className={p}>No vendemos tus datos ni los usamos para publicidad de terceros.</p>

          <h3 className={h3}>Con quién los compartimos</h3>
          <ul className={ul}>
            <li>
              <strong>La compañía aseguradora</strong> (por ejemplo, {MERIDIONAL.nombre}), para emitir y administrar tu póliza y atender tus siniestros.
            </li>
            <li><strong>Organismos públicos y de control</strong> (como la Superintendencia de Seguros de la Nación), cuando la ley lo exige.</li>
            <li>
              <strong>Proveedores tecnológicos</strong> que nos prestan servicios de alojamiento y funcionamiento del sitio y del sistema de gestión. Sus servidores pueden estar ubicados fuera de la Argentina; trabajamos
              con proveedores que aplican medidas de seguridad adecuadas.
            </li>
          </ul>

          <h3 className={h3}>Cuánto tiempo los conservamos</h3>
          <p className={p}>
            Mientras seas cliente y durante el tiempo que exijan las normas de seguros, contables e impositivas, o hasta que ejerzas tu derecho de supresión cuando corresponda.
          </p>

          <h3 className={h3}>Cómo los protegemos</h3>
          <p className={p}>
            El acceso al sistema es solo para el personal autorizado, con usuario y contraseña. Las contraseñas se almacenan protegidas, la conexión al sitio es segura (HTTPS) y los documentos solo los puede ver cada cliente
            (sobre sus propias pólizas) y el personal de la oficina. Ningún sistema es infalible: si detectás un uso indebido de tu cuenta, avisanos de inmediato.
          </p>

          <h3 className={h3}>Tus derechos</h3>
          <p className={p}>
            Podés pedirnos, de forma gratuita, <strong>acceder</strong> a tus datos, <strong>rectificarlos o actualizarlos</strong> y solicitar su <strong>supresión</strong> cuando corresponda. Escribinos a{" "}
            <a className={enlace} href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> indicando tu nombre y DNI; te respondemos dentro de los plazos legales. Algunos datos no se pueden borrar mientras exista una obligación legal o una
            póliza vigente.
          </p>
          <div className="mt-5 rounded-2xl border-l-4 border-sky-500 bg-white px-5 py-4 text-sm leading-relaxed text-ink-soft shadow-card">
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto
            conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender
            las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales
            (<a className={enlace} href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a>).
          </div>

          <h3 className={h3}>Cambios en esta política</h3>
          <p className={p}>Podemos actualizar esta política cuando cambien las normas o nuestros servicios. Siempre vas a ver acá la fecha de la última actualización ({ACTUALIZADO}).</p>
        </div>
      </section>

      {/* Cookies */}
      <section id="cookies" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Cookies y almacenamiento en tu dispositivo</h2>
          <p className={p}>Usamos lo mínimo necesario para que el sitio funcione:</p>
          <ul className={ul}>
            <li><strong>Cookie de sesión:</strong> solo si ingresás a tu cuenta; mantiene tu sesión abierta de forma segura; se elimina al salir o a los 7 días.</li>
            <li><strong>Preferencia de tamaño de letra:</strong> se guarda en tu propio dispositivo para recordar si elegiste «Letra grande». No se envía a nuestros servidores.</li>
            <li>
              <strong>Mapa de Google:</strong> la página de Contacto incluye un mapa de Google Maps. Al cargarlo, Google puede usar sus propias cookies según su política de privacidad.
            </li>
          </ul>
          <p className={p}>No usamos cookies de publicidad ni de seguimiento propias. Podés borrar o bloquear las cookies desde la configuración de tu navegador; si bloqueás la de sesión no vas a poder ingresar a tu cuenta.</p>
        </div>
      </section>

      {/* Consultas y reclamos */}
      <section id="reclamos" className="bg-sky-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className={h2}>Consultas y reclamos</h2>
          <p className={p}>Si tenés una duda o un reclamo, empezá siempre por nosotros:</p>
          <ul className={ul}>
            <li>Oficina: {DIRECCION_COMPLETA} · {EMPRESA.telefonoVisible} · <a className={enlace} href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>.</li>
            <li>Servicio de atención al cliente de {MERIDIONAL.nombre}: {MERIDIONAL.telClientes}.</li>
            <li>
              Superintendencia de Seguros de la Nación (organismo de control): {SSN_TELEFONO} ·{" "}
              <a className={enlace} href="https://www.argentina.gob.ar/ssn" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/ssn</a>.
            </li>
            <li>
              Datos personales: Agencia de Acceso a la Información Pública ·{" "}
              <a className={enlace} href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a>.
            </li>
          </ul>
          <p className={`${p} text-sm`}>
            Para consejos prácticos sobre siniestros, pagos y bajas, mirá la sección <Link href="/ayuda" className={enlace}>Ayuda al cliente</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
