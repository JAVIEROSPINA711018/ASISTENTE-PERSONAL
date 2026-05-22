// Función para obtener dinámicamente datos de Workspace (Gmail + Calendar) según el correo
export function getDynamicWorkspaceData(email) {
  const normEmail = (email || "").toLowerCase().trim();
  if (normEmail === "suelosyestructuras@gmail.com") {
    return {
      calendar: [
        { time: "09:30 AM", title: "Revisión Presupuesto Fibra de Carbono con Alfonso", loc: "Oficina Virtual Google Meet" },
        { time: "11:00 AM", title: "Llamada con Abogada Claudia - Petición I-140", loc: "Línea Directa" },
        { time: "02:00 PM", title: "Entrega de Planos San Antonio a Arq. Carlos Holmes", loc: "Sala de Juntas" },
        { time: "04:30 PM", title: "Discusión Técnica San Vicente (Daniel Guerrero & Eder Moran)", loc: "Sede Norte" }
      ],
      gmail: [
        { tab: "primario", sender: "alfonso.diseno@carbono.com", subj: "PRESUPUESTO PROPUESTA 1 - CINTAS DE FIBRA DE CARBONO", body: "Ing. Ospina, ya estoy revisando el presupuesto para la propuesta de diseño original con cintas de fibra de carbono para el proyecto. Saludos, Alfonso Otero.", badgeBg: "rgba(255,149,0,0.08)", badgeColor: "#ff9500", badgeText: "Presupuesto Fibra Carbono", time: "09:15 AM" },
        { tab: "primario", sender: "claudia.abogada@gmail.com", subj: "Re: Resumen Reunión - Decisión USCIS Petición I-140", body: "Estimado Ing. Ospina, adjunto el resumen de la reunión y la decisión de USCIS sobre la Petición I-140 de Claudia Patricia Agudelo Bedoya. Atentamente, Claudia.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Petición I-140 USCIS", time: "11:30 AM" },
        { tab: "primario", sender: "carlos.holmes@arquitectura.co", subj: "PROYECTO SAN ANTONIO - MAURICIO COLLAZOS", body: "Ing. Ospina, remito el plano y la memoria del Proyecto San Antonio para la revisión de Mauricio Collazos. Cualquier inquietud me llama. Cel: 311-6276551.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Plano San Antonio", time: "12:45 PM" },
        { tab: "primario", sender: "thiago.escobar@estructura.co", subj: "D3. SAN VICENTE-ARQ V.1 - EDER FABIAN MORAN", body: "Buenas Noches Ing. Javier Ospina / Daniel Guerrero. Remito la versión V.1 de diseño estructural del Proyecto San Vicente elaborado por Eder Fabian Moran.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Diseño Estructural San Vicente", time: "03:20 PM" },
        { tab: "actualizaciones", sender: "sika-anchorfix@sika.com", subj: "Sika AnchorFix - Registration approved", body: "Dear JAVIER OSPINA, Your registration for Sika AnchorFix has been approved. Please use the linked portal to complete the onboarding.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Registro Sika Aprobado", time: "02:10 AM" },
        { tab: "actualizaciones", sender: "noreply@bancolombia.com.co", subj: "Extracto de cuenta disponible - Mayo 2026", body: "Ing. Ospina, su extracto de cuenta de ahorros correspondiente al mes de Mayo 2026 ya está disponible en la sucursal virtual.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Extracto Bancolombia Mayo", time: "06:00 AM" },
        { tab: "actualizaciones", sender: "facturacion@autodesk.com", subj: "Factura suscripción Autodesk Revit 2026", body: "Su suscripción anual de Autodesk Revit ha sido renovada exitosamente por $3,450,000 COP. Transacción aprobada. Número de factura: AUT-2026-00445.", badgeBg: "rgba(255,149,0,0.08)", badgeColor: "#ff9500", badgeText: "Factura Autodesk Revit", time: "08:00 AM" },
        { tab: "social", sender: "notifications@linkedin.com", subj: "Javier, tienes 4 nuevas solicitudes de conexión", body: "Cuatro profesionales quieren conectar contigo en LinkedIn: Daniel Guerrero (Ing. Civil), María Valdés (Arquitecta), Felipe Torres (Curador Urbano), Ana Ríos (BIM Manager).", badgeBg: "rgba(10,102,194,0.08)", badgeColor: "#0a66c2", badgeText: "LinkedIn Conexiones", time: "07:45 AM" },
        { tab: "social", sender: "noreply@whatsapp.com", subj: "Nuevo mensaje en el grupo Obra San Vicente", body: "Daniel Guerrero: Ing. Ospina, ¿confirmamos la visita a la obra para el viernes? Necesito su aprobación para el vaciado del núcleo.", badgeBg: "rgba(37,211,102,0.08)", badgeColor: "#25d366", badgeText: "WhatsApp Obra San Vicente", time: "10:20 AM" },
        { tab: "promociones", sender: "ofertas@sika.com.co", subj: "Descuento especial Sika Colombia - Junio 2026", body: "Ing. Ospina, durante junio 2026 tenemos descuentos del 18% en toda la línea SikaTop y SikaFlex para proyectos NSR-10. Válido hasta el 30 de junio.", badgeBg: "rgba(255,59,48,0.06)", badgeColor: "#ff3b30", badgeText: "Promo Sika Junio 18%", time: "01:00 PM" },
        { tab: "promociones", sender: "newsletter@construdata.com", subj: "Nuevas normas NSR-10 Resolución 0549 de 2026", body: "Le informamos sobre la Resolución 0549 de 2026 que modifica los capítulos A.2 y E.1 del Reglamento NSR-10. Descargue el resumen técnico gratuito.", badgeBg: "rgba(94,92,230,0.08)", badgeColor: "#5e5ce6", badgeText: "Actualización NSR-10", time: "02:30 PM" }
      ]
    };
  } else if (normEmail.includes("curaduria")) {
    return {
      calendar: [
        { time: "08:00 AM", title: "Radicación de planos NSR-10", loc: "Curaduría Urbana 4" },
        { time: "10:30 AM", title: "Cita con Curador por ajuste de Ejes estructurales", loc: "Oficina del Curador" },
        { time: "03:30 PM", title: "Revisión de Licencia de Construcción Portal", loc: "Sala Técnica" }
      ],
      gmail: [
        { tab: "primario", sender: "licencias@curaduria4.gov.co", subj: "Citación Corrección Planos Estructurales - Radicado 2026-0045", body: "Ing. Ospina, se le cita para subsanar observaciones de resistencia sismorresistente en el Eje D. Plazo máximo de 3 días hábiles.", badgeBg: "rgba(255,59,48,0.08)", badgeColor: "#ff3b30", badgeText: "Corrección Crítica Licencia", time: "08:15 AM" },
        { tab: "primario", sender: "arquitectura.curaduria@bogota.gov.co", subj: "Aprobación de Parámetros Urbanísticos Portal", body: "El diseño arquitectónico cumple con las alturas y retiros normativos. Proceda al cargue de memorias de cálculo sismorresistente.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Arquitectura Aprobada NSR-10", time: "02:20 PM" },
        { tab: "actualizaciones", sender: "notificaciones@curaduria4.gov.co", subj: "Pago de Expensas Fijas - Radicado Portal", body: "Se ha generado el recibo para el pago de expensas fijas correspondientes a la revisión estructural por un valor de $1,250,000 COP.", badgeBg: "rgba(255,149,0,0.08)", badgeColor: "#ff9500", badgeText: "Pago Expensas $1.25M", time: "10:45 AM" },
        { tab: "actualizaciones", sender: "sistema@ventanilladigital.gov.co", subj: "Radicado 2026-0045: Estado actualizado a REVISION TECNICA", body: "El expediente 2026-0045 ha cambiado de estado a REVISION TECNICA. Consulte el portal de la Curaduría para más detalles.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Estado Radicado Actualizado", time: "09:00 AM" },
        { tab: "social", sender: "notifications@linkedin.com", subj: "3 profesionales vieron tu perfil esta semana", body: "Tu perfil fue visto por 3 personas esta semana, entre ellas un Curador Urbano de Bogotá y un Director de Licencias de Construcción.", badgeBg: "rgba(10,102,194,0.08)", badgeColor: "#0a66c2", badgeText: "LinkedIn Vistas Perfil", time: "06:30 AM" },
        { tab: "promociones", sender: "info@cursosnsr10.com", subj: "Certificación NSR-10 Online - Inicio Junio 2026", body: "Actualice su certificación NSR-10 con nuestro curso en línea de 40 horas. Cupos limitados. Descuento del 20% para ingenieros registrados en COPNIA.", badgeBg: "rgba(94,92,230,0.08)", badgeColor: "#5e5ce6", badgeText: "Curso NSR-10 Online", time: "12:00 PM" }
      ]
    };
  } else if (normEmail.includes("construito")) {
    return {
      calendar: [
        { time: "09:00 AM", title: "Sincronización semanal de Obra y Control de Calidad", loc: "Sede Principal Construito" },
        { time: "01:30 PM", title: "Pruebas de Cilindros de Concreto (Resistencia 28 días)", loc: "Laboratorio de Suelos" },
        { time: "04:00 PM", title: "Comité Técnico: Optimización de Pórticos y Vigas", loc: "Sala de Juntas" }
      ],
      gmail: [
        { tab: "primario", sender: "ingenieria@construito.co", subj: "Memorias de Cálculo Optimización Cimentación - Fase II", body: "Ing. Javier, adjunto la propuesta de cimentación con zapatas combinadas optimizadas para reducir costos en un 15% de volumen.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Optimización Cimentación", time: "09:00 AM" },
        { tab: "primario", sender: "eder.moran@construito.co", subj: "Plano Estructural Versión Final V.2 - Pórticos Eje 4", body: "Ing. Ospina, remito el plano ajustado con el refuerzo adicional de vigas solicitado por el revisor independiente de NSR-10.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Plano V.2 Pórticos Eje 4", time: "11:15 AM" },
        { tab: "primario", sender: "compras@construito.co", subj: "Cotización Acero Refuerzo Grado 60 - Proyecto Portal", body: "Recibimos cotización de Diaco por 25 toneladas de acero figurado para el Proyecto Portal por $112,000,000 COP. Pendiente firma de gerencia.", badgeBg: "rgba(255,149,0,0.08)", badgeColor: "#ff9500", badgeText: "Cotización Acero $112M", time: "02:40 PM" },
        { tab: "actualizaciones", sender: "laboratorio@construito.co", subj: "Resultados Cilindros Concreto f'c=21 MPa - Muestra Lote 8", body: "Los resultados de compresión a los 28 días del Lote 8 arrojaron f'c=23.4 MPa, cumpliendo la especificación mínima de 21 MPa. Adjunto certificado.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Ensayo Concreto Aprobado", time: "07:30 AM" },
        { tab: "actualizaciones", sender: "nomina@construito.co", subj: "Liquidación quincenal Mayo 16-31 disponible", body: "La liquidación de nómina de la segunda quincena de Mayo 2026 está disponible en el portal de empleados. Fecha de pago: 31 de Mayo.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Nómina Quincenal Disponible", time: "10:00 AM" },
        { tab: "social", sender: "noreply@construito-teams.co", subj: "Eder Moran te mencionó en el canal #estructuras", body: "Eder Moran: @Ing.Ospina ya subí los planos V.2 al servidor compartido. Por favor revisar el refuerzo del nudo de la columna C4 antes del vaciado del miércoles.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Teams #Estructuras", time: "03:15 PM" },
        { tab: "promociones", sender: "ventas@diaco.com.co", subj: "Listas de precios Acero DIACO - Junio 2026", body: "Estimado cliente, adjuntamos las listas actualizadas de precios para acero corrugado Grado 60 y Grado 40. Precios válidos hasta el 30 de junio 2026.", badgeBg: "rgba(255,149,0,0.06)", badgeColor: "#ff9500", badgeText: "Precios Acero DIACO Junio", time: "08:45 AM" }
      ]
    };
  } else {
    return {
      calendar: [
        { time: "09:00 AM", title: "Reunión de Coordinación NSR-10", loc: "Oficina Virtual Google Meet" },
        { time: "11:30 AM", title: "Revisión de Presupuesto Copropietarios", loc: "Sala de Juntas" },
        { time: "03:00 PM", title: "Inspección Técnica de Obra", loc: "Sede Norte Construito" }
      ],
      gmail: [
        { tab: "primario", sender: "iberia.notificaciones@iberia.com", subj: "Confirmación de Reserva IB6801 (BOG - MAD)", body: "Estimado Ing. Ospina, confirmamos su vuelo a Madrid el 24 de Mayo. Salida: 18:20h. Asiento: 12C.", badgeBg: "rgba(52,199,89,0.08)", badgeColor: "#34c759", badgeText: "Vuelo BOG-MAD Confirmado", time: "08:15 AM" },
        { tab: "primario", sender: "curaduria4@bogota.gov.co", subj: "Observaciones estructurales NSR-10 — Portal", body: "Ing. Ospina, se solicita ajustar el cálculo sismorresistente NSR-10 en pórticos del Eje C. Plazo de 5 días hábiles.", badgeBg: "rgba(0,113,227,0.08)", badgeColor: "#0071e3", badgeText: "Observaciones NSR-10", time: "11:45 AM" },
        { tab: "actualizaciones", sender: "facturacion@autodesk.com", subj: "Su factura de suscripción anual Autodesk Revit", body: "Su suscripción se ha renovado con éxito por un monto de $3,450,000 COP. Transacción aprobada.", badgeBg: "rgba(255,149,0,0.08)", badgeColor: "#ff3b30", badgeText: "Factura Autodesk $3.45M", time: "09:30 AM" },
        { tab: "social", sender: "notifications@linkedin.com", subj: "5 nuevas solicitudes de conexión esta semana", body: "5 profesionales del sector de la construcción quieren conectar contigo en LinkedIn.", badgeBg: "rgba(10,102,194,0.08)", badgeColor: "#0a66c2", badgeText: "LinkedIn Conexiones", time: "07:00 AM" },
        { tab: "promociones", sender: "ofertas@cemargos.com.co", subj: "Promoción cemento Argos - Descuento Mayo 2026", body: "Ing. Ospina, durante mayo ofrecemos descuentos especiales en cemento Portland tipo I y tipo ARI para proyectos de gran volumen.", badgeBg: "rgba(255,59,48,0.06)", badgeColor: "#ff3b30", badgeText: "Promo Cemento Argos", time: "10:00 AM" }
      ]
    };
  }
}
