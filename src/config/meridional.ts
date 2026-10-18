/**
 * Información de Meridional Seguros (compañía de Bertona), tomada de https://www.meridionalseguros.seg.ar/ (consultada en octubre de 2026)
 * y redactada con palabras propias. Los montos y condiciones pueden cambiar: siempre manda la póliza.
 * TODO: revisar cada tanto contra el sitio de la compañía.
 */

export const MERIDIONAL = {
  nombre: "Meridional Seguros",
  web: "https://www.meridionalseguros.seg.ar",
  desde: 1948,
  inscripcionSSN: "0244",
  telClientes: "0800-333-3244",
  telClientesTel: "08003333244",
  telLesionados: "0800-333-3244 (opción 2)",
  telVentas: "0800-555-1234",
  telSSN: "0800-666-8400",
  telReclamos: "4909-7173",
  whatsapp: "+54 9 11 6740 8247",
  whatsappLink: "https://wa.me/5491167408247",
  formularioReclamos: "https://www.meridionalseguros.seg.ar/landing/meridional-seguros/",
  denunciaAnonima: "https://www.meridionalseguros.seg.ar/clientes/denuncia-anonima/",
  solicitudBaja: "https://www.meridionalseguros.seg.ar/clientes/solicitud-de-baja/",
  portalTerceros: "https://talleres.claimservices.com.ar/external/thirdFormMeridional/",
  ssnWeb: "https://www.argentina.gob.ar/ssn",
};

export const RESPALDO = {
  titulo: "Con el respaldo de Meridional Seguros",
  texto: [
    "Meridional es una compañía de seguros argentina que nació en 1948. Empezó asegurando empresas y con el tiempo sumó autos, accidentes personales y hogar, y llegó a las principales ciudades del interior.",
    "Hoy es una compañía multiproducto y multicanal. Su forma de trabajar se resume en tres ideas: simpleza, transparencia y excelencia en el servicio.",
  ],
  valores: ["Simplicidad", "Transparencia", "Gratitud", "Excelencia en el servicio", "Sustentabilidad", "Confianza"],
  datos: [
    { valor: "1948", etiqueta: "año en que nació la compañía" },
    { valor: "24 h", etiqueta: "atención de siniestros y asistencia, todos los días" },
    { valor: "0244", etiqueta: "inscripción en la SSN" },
  ],
};

export type Plan = { nombre: string; resumen: string; incluye: string[] };
export type Detalle = {
  slug: string;
  titulo: string;
  bajada: string;
  planes?: Plan[];
  grupos?: { titulo: string; items: string[] }[];
  beneficios?: string[];
  requisitos?: string[];
  nota?: string;
};

export const DETALLES: Detalle[] = [
  {
    slug: "autos",
    titulo: "Seguro de autos",
    bajada: "Elegí desde la cobertura básica obligatoria hasta todo riesgo con franquicia. Te ayudamos a comparar y a elegir la que mejor se ajusta a tu auto y a tu bolsillo.",
    planes: [
      { nombre: "Cobertura A", resumen: "Responsabilidad civil", incluye: ["Daños materiales y personales que le causes a terceros, hasta $ 208.000.000 por hecho.", "Para autos de hasta 25 años de antigüedad."] },
      { nombre: "Cobertura B", resumen: "RC + robo e incendio total", incluye: ["Todo lo de la Cobertura A.", "Robo o hurto total, incendio total y destrucción total.", "Para autos de hasta 15 años. No incluye cristales."] },
      { nombre: "Cobertura C", resumen: "Suma coberturas parciales", incluye: ["Todo lo de la Cobertura B.", "Robo o hurto parcial e incendio parcial.", "Una cubierta nueva por robo o hurto.", "Cristales laterales y cerraduras, con un límite de $ 80.000."] },
      { nombre: "C Total", resumen: "Cristales sin tope y 0 km", incluye: ["Cristales laterales, cerraduras, parabrisas y luneta sin límite.", "Reposición del vehículo a 0 km por robo, hurto, incendio o destrucción total."] },
      { nombre: "C Total Premium", resumen: "Más protección climática", incluye: ["Todo lo de C Total.", "Cristales del techo sin límite.", "Granizo parcial sin franquicia, hasta la suma asegurada.", "Inundación parcial con franquicia del 1%."] },
      { nombre: "Full Car", resumen: "Todo riesgo con franquicia", incluye: ["Todo lo de C Total Premium.", "Daños parciales por accidente, que ningún plan de terceros cubre."] },
    ],
    beneficios: [
      "Red Mi Taller: 20% de descuento en la franquicia si reparás en un taller de la red, más un año de garantía en chapa y pintura.",
      "Accidentes personales para el conductor y hasta 4 ocupantes en uso particular.",
      "Cobertura automática en países limítrofes y Mercosur, con responsabilidad civil de hasta USD 200.000.",
      "Descuento en la cuota si instalás rastreo vehicular.",
      "Gestoría ante robo o hurto total (no aplica a la Cobertura A).",
      "Auto de reemplazo por hasta 10 días ante robo, incendio o daño total (no aplica a la Cobertura A).",
      "Auxilio mecánico y remolque en todo el país, las 24 horas.",
    ],
    nota: "Montos, límites y condiciones según información de Meridional Seguros (2026). Pueden cambiar: lo que vale es lo que dice tu póliza.",
  },
  {
    slug: "motos",
    titulo: "Seguro de motos",
    bajada: "Protegé tu moto y a terceros con planes simples, con asistencia mecánica y grúa las 24 horas.",
    planes: [
      { nombre: "Cobertura A", resumen: "Responsabilidad civil", incluye: ["Responsabilidad civil por daños a terceros.", "Asistencia mecánica y grúa 24 h, reposición de llaves por robo y asistencia médica al viajero, según el plan."] },
      { nombre: "Cobertura B1", resumen: "RC + robo e incendio", incluye: ["Todo lo de la Cobertura A.", "Robo o hurto total e incendio total.", "Destrucción total al 80%.", "Gestoría por robo o hurto total."] },
      { nombre: "Cobertura B", resumen: "Máxima protección", incluye: ["Todo lo de la Cobertura B1.", "Destrucción total de la moto por accidente."] },
    ],
    requisitos: [
      "Motos de 125 cc a 1.600 cc y hasta 8 años de antigüedad.",
      "DNI del titular y cédula verde o título de propiedad.",
      "Licencia de conducir clase A vigente, acorde a la cilindrada.",
      "Medio de pago: tarjeta de crédito, débito o CBU.",
      "Las motos usadas se inspeccionan (se puede hacer online, con fotos).",
    ],
    beneficios: ["Podés sumar accidentes personales para conductor y acompañante en cualquier cobertura.", "Para motos de alta gama, clásicos y cuatriciclos existe el seguro por uso: pagás solo los días que usás el vehículo."],
    nota: "Información de Meridional Seguros (2026). Consultanos por las condiciones y valores vigentes.",
  },
  {
    slug: "hogar",
    titulo: "Seguro de hogar",
    bajada: "Para casas y departamentos, propios o alquilados: tu hogar y tus cosas protegidos ante imprevistos.",
    grupos: [
      { titulo: "Coberturas base", items: ["Incendio, explosión y rayo, en la estructura y en los bienes.", "Granizo, huracán, vendaval, ciclón y tornado (el terremoto cubre solo la estructura).", "Robo o hurto del contenido del hogar y daños causados por el robo.", "Todo riesgo para electrodomésticos y equipos portátiles (celulares, notebooks, cámaras), con franquicia en los portátiles.", "Objetos específicos de una lista, por incendio, robo o accidente (franquicia del 20%).", "Responsabilidad civil por hechos privados y daños a linderos.", "Daños al contenido por agua: filtraciones, derrames y roturas de cañerías o tanques.", "Accidentes personales por hechos ocurridos dentro del domicilio."] },
      { titulo: "Beneficios incluidos", items: ["Robo de bienes asegurados en tránsito dentro de Argentina y países limítrofes, hasta el 10% de la suma de robo contenido.", "Gastos para reponer documentos (DNI, pasaporte, registro) si se pierden por robo o incendio en el hogar."] },
      { titulo: "Opción Home Premium", items: ["Objetos específicos en todo el mundo y bicicletas o monopatines.", "Accidentes del personal doméstico y gastos por mascotas.", "Responsabilidad civil para propietarios que alquilan.", "Cobertura del equipo de golf.", "Alimentos del freezer ante cortes de luz de más de 12 horas.", "Cobertura de alquiler de vivienda de vacaciones en Argentina, hasta 45 días."] },
      { titulo: "Asistencias", items: ["Urgencias de electricidad, gas, plomería, cerrajería y destapaciones.", "Vigilancia luego de un siniestro.", "Traslado de muebles, limpieza y servicio de restaurante."] },
    ],
    nota: "Información de Meridional Seguros (2026). Los límites y franquicias dependen del plan elegido: pedinos el detalle.",
  },
  {
    slug: "comercio",
    titulo: "Seguro de comercio",
    bajada: "Un seguro armado según la actividad de tu negocio, con atención de siniestros las 24 horas.",
    grupos: [
      { titulo: "Coberturas", items: ["Incendio del edificio, del contenido general y de las mercaderías.", "Robo del contenido general y de las mercaderías.", "Robo de valores en caja fuerte o caja registradora.", "Seguro técnico para equipos de oficina y portátiles.", "Cristales.", "Responsabilidad civil comprensiva básica (incluye carteles y linderos), con adicionales según la actividad.", "Gastos de alquiler si el daño afecta al 70% o más de la propiedad."] },
      { titulo: "Asistencias", items: ["Gas, electricidad, plomería, cerrajería, cristalería y destapaciones.", "Traslado y guarda de muebles.", "Vigilancia."] },
    ],
    beneficios: ["Programas pensados para cada tipo de comercio.", "Coberturas adicionales sin cargo y opcionales.", "Atención de siniestros todos los días, a toda hora."],
    nota: "Información de Meridional Seguros (2026). Cada propuesta se arma a medida: consultanos.",
  },
  {
    slug: "accidentes",
    titulo: "Accidentes personales",
    bajada: "Una protección económica para vos, tu familia o tu equipo ante un accidente.",
    grupos: [
      { titulo: "Qué cubre", items: ["Muerte accidental (con adicionales en transporte público o por asalto).", "Invalidez total o parcial permanente por accidente.", "Reembolso de gastos médicos y farmacéuticos.", "Prótesis y órtesis.", "Renta diaria por internación."] },
      { titulo: "Para quién es", items: ["Personas y familias.", "Empresas y trabajadores autónomos.", "Colegios, asociaciones y clubes."] },
      { titulo: "Modalidades", items: ["Póliza nominada: se asegura una lista de personas que se puede modificar durante la vigencia.", "Facturación a mes vencido: cuando no se sabe de antemano quién realizará la actividad; se informan cada mes las personas y los días trabajados."] },
    ],
    nota: "Las sumas aseguradas y exclusiones figuran en las condiciones de la póliza. Consultanos y te cotizamos.",
  },
];

export const SINIESTROS = {
  intro: "Un siniestro es un momento difícil. Primero resguardá a las personas; después avisanos: te acompañamos en cada paso.",
  urgente: "Si hubo lesionados, o participaron ciclistas, motociclistas o peatones, llamá de inmediato a Meridional: 0800-333-3244, opción 2 (asistencia inmediata).",
  canales: [
    { titulo: "Bertona Seguros", texto: "Avisanos por WhatsApp o llamanos: te guiamos con la denuncia y el seguimiento.", destacado: true },
    { titulo: "Atención al cliente de Meridional", texto: "0800-333-3244. Atiende los siniestros las 24 horas, todos los días." },
    { titulo: "WhatsApp de Meridional", texto: "+54 9 11 6740 8247, las 24 horas, para denuncias, comprobantes de póliza y certificados de cobertura." },
    { titulo: "Desde tu cuenta", texto: "Si tenés usuario en nuestro portal de clientes, podés denunciar el siniestro con fotos desde la sección Siniestros." },
  ],
  datos: [
    "Dónde, cuándo y a qué hora ocurrió.",
    "Tus datos y los del conductor: nombre, DNI, teléfono, email, fecha de nacimiento y domicilio.",
    "Datos del vehículo: marca, modelo, año, patente y si es de uso particular o comercial.",
    "Si hubo otro vehículo o persona: los mismos datos, y los de los lesionados si los hubo.",
  ],
  porTipo: [
    { titulo: "Choque con cobertura todo riesgo", items: ["Coordiná una inspección con tu productor o llamando a Meridional al 0800-333-3244."] },
    { titulo: "Choque con terceros completo", items: ["Si el reclamo es contra la aseguradora del otro conductor, pedí el certificado de cobertura de tu póliza.", "Del tercero te van a pedir: registro, cédula verde o título, presupuesto y fotos del daño, y el certificado de cobertura de su seguro con fecha posterior al choque (o una declaración jurada ante escribano si no tiene seguro)."] },
    { titulo: "Robo o hurto total del auto", items: ["Denuncia policial original.", "Fotocopia de la cédula verde.", "Datos del siniestro y del asegurado."] },
    { titulo: "Hogar y comercio", items: ["Cristales, electrodomésticos y equipos electrónicos: llamá al 0800-333-3244.", "Robo, incendio o daños a la propiedad: denuncia por la web o por WhatsApp de la compañía."] },
    { titulo: "Accidentes personales", items: ["Muerte accidental: formulario, denuncia policial, documentación de parentesco y declaratoria de herederos (salvo beneficiarios designados).", "Invalidez: formulario, denuncia policial, historia clínica, certificados médicos de evolución y alta definitiva.", "Gastos médicos: formulario, certificado médico, facturas, historia clínica y constancias de ingreso y egreso."] },
  ],
  consejos: [
    "Sacá fotos de todo: daños, lugar, patentes y documentos.",
    "Guardá la denuncia policial, los presupuestos y los certificados.",
    "No firmes nada que no entiendas: consultanos antes.",
    "La compañía puede pedir documentación adicional.",
  ],
};

export const AUXILIO = {
  titulo: "Auxilio mecánico",
  intro: "Si tu auto o tu moto se quedan en la ruta, pedí asistencia: funciona las 24 horas, los 365 días del año.",
  pasos: [
    "Escribí por WhatsApp al +54 9 11 6740 8247 (o llamá al 0800-333-3244).",
    "Tené a mano el número de tu póliza, el nombre del titular, los datos del vehículo y un teléfono de contacto.",
    "Si querés reintegro de algún gasto, la central tiene que autorizarlo antes; después presentás las facturas originales.",
  ],
  planes: [
    { cobertura: "Responsabilidad civil", servicios: "8 por año", km: "hasta 100 km lineales (200 km en total)" },
    { cobertura: "Incendio y robo total", servicios: "8 por año", km: "hasta 100 km lineales (200 km en total)" },
    { cobertura: "Resto de las coberturas", servicios: "8 por año", km: "hasta 100 km lineales (200 km en total)" },
    { cobertura: "Clientes Gold", servicios: "6 por año", km: "hasta 200 km lineales (400 km en total)" },
    { cobertura: "Clientes Gold (opción 2)", servicios: "2 por año", km: "hasta 400 km lineales (800 km en total)" },
  ],
  limites: [
    "Hasta 2 servicios por mes.",
    "No incluye segundos traslados ni remolques de taller a taller.",
    "Si el vehículo lleva mercadería, hay que descargarla antes del remolque.",
    "Los repuestos que necesite la reparación los paga el asegurado.",
    "Los kilómetros gratuitos dependen de la cobertura que contrataste: mirá tu póliza.",
  ],
  viajero: [
    "Asistencia médica de urgencia por accidente y cobertura de medicamentos.",
    "Alojamiento o traslado de las personas si el vehículo queda inmovilizado.",
    "Asistencia legal por accidente en el exterior.",
    "Acompañamiento de menores y mensajes urgentes.",
  ],
};

export const PAGOS = {
  intro: "Pagá tu póliza como te quede más cómodo. Si tu póliza tiene cuponera o código de pago, pedínoslo por WhatsApp.",
  medios: [
    { titulo: "Débito automático con tarjeta de crédito", texto: "Visa, MasterCard, American Express, Diners, Naranja y Cabal." },
    { titulo: "Débito directo de tu cuenta bancaria", texto: "Se debita todos los meses de tu cuenta corriente o caja de ahorro (CBU)." },
    { titulo: "Pagomiscuentas.com", texto: "Con el código de pago electrónico que figura en los cupones de tu póliza." },
    { titulo: "Pago Fácil y Rapipago", texto: "Sin costo adicional, con el cupón de pago, en comercios adheridos de todo el país." },
    { titulo: "Mercado Pago", texto: "En la app, elegí Pagar servicios y escaneá el código de barras de tu cuponera." },
    { titulo: "Ventanilla bancaria", texto: "Con la cuponera, en cajas del Banco Nación o HSBC." },
  ],
  nota: "Los medios habilitados y sus condiciones dependen de cada compañía y pueden cambiar. Ante cualquier duda, consultanos.",
};

export const BAJA_RECLAMOS = {
  baja: [
    "Si tenés usuario en nuestro portal, entrá a Mis pólizas y tocá Anular póliza: avisamos a la oficina y te contactamos.",
    "También podés pedirla en la oficina (San Lorenzo 600) o por WhatsApp.",
    "Si contrataste el seguro por medios electrónicos directamente con la compañía, podés pedir la baja en el formulario de Meridional.",
  ],
  reclamos: [
    "Primero contanos a nosotros: queremos resolverlo.",
    "Si no te alcanza la respuesta, podés usar el formulario de reclamos de Meridional o llamar al Servicio de Atención al Asegurado: 4909-7173.",
    "Si el reclamo no se resuelve, podés presentarlo ante la Superintendencia de Seguros de la Nación: argentina.gob.ar/ssn · 0800-666-8400.",
  ],
};

export const FAQ_MERIDIONAL = [
  { q: "¿Qué hago si tuve un choque?", a: "Resguardá a las personas, sacá fotos y avisanos enseguida por WhatsApp o llamando a Meridional al 0800-333-3244. Si hubo lesionados, usá la opción 2. En la sección Ayuda tenés la lista de datos y documentos que te van a pedir." },
  { q: "¿Cómo pido el auxilio mecánico?", a: "Escribí por WhatsApp al +54 9 11 6740 8247 (las 24 horas) con el número de tu póliza y los datos del vehículo. Los kilómetros y la cantidad de servicios dependen de tu cobertura." },
  { q: "¿Cómo pago mi cuota?", a: "Podés usar débito automático, Pagomiscuentas, Pago Fácil, Rapipago, Mercado Pago o ventanilla bancaria, según tu póliza. Si necesitás tu cuponera o código de pago, pedínosla." },
  { q: "¿Cómo doy de baja mi seguro?", a: "Desde Mis pólizas en tu cuenta (botón Anular póliza), en la oficina o por WhatsApp. Te contactamos para confirmarlo." },
  { q: "¿Dónde presento un reclamo?", a: "Primero con nosotros. Si no te alcanza, con el Servicio de Atención al Asegurado de Meridional (4909-7173) y, en última instancia, ante la Superintendencia de Seguros de la Nación (0800-666-8400)." },
];
