import { useState, useEffect, useRef } from "react";
import {
  supabase,
  loadAllUserData,
  migrateLocalStorageToSupabase,
  subscribeUserData,
  unsubscribeUserData,
  flushSyncQueue,
} from "./lib/supabase.js";
import AuthScreen from "./components/AuthScreen.jsx";
import ViewDashboard from "./views/ViewDashboard.jsx";
import FinanceLedger from "./views/ViewFinanzas.jsx";
import ViewNotas from "./views/ViewNotas.jsx";
import ViewReuniones from "./views/ViewReuniones.jsx";
import ViewCalendario from "./views/ViewCalendario.jsx";
import ViewTareas from "./views/ViewTareas.jsx";
import ViewCorreos from "./views/ViewCorreos.jsx";

// ── Paletas de tema ───────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f0f0f5", surface: "#ffffff", surfaceHigh: "rgba(255,255,255,0.95)",
  border: "rgba(0,0,0,0.08)", borderHigh: "rgba(0,0,0,0.15)",
  accent: "#0071e3", accentSoft: "rgba(0,113,227,0.07)", accentGlow: "rgba(0,113,227,0.18)",
  teal: "#24b495", tealSoft: "rgba(36,180,149,0.07)", tealGlow: "rgba(36,180,149,0.18)",
  amber: "#ff9500", amberSoft: "rgba(255,149,0,0.07)", amberGlow: "rgba(255,149,0,0.18)",
  coral: "#ff3b30", coralSoft: "rgba(255,59,48,0.07)", coralGlow: "rgba(255,59,48,0.18)",
  green: "#34c759", greenSoft: "rgba(52,199,89,0.07)", greenGlow: "rgba(52,199,89,0.18)",
  purple: "#5e5ce6", purpleSoft: "rgba(94,92,230,0.07)",
  textPrimary: "#1d1d1f", textSecondary: "#515154", textTertiary: "#86868b",
};
const DARK = {
  bg: "#0f0f14", surface: "#1a1a24", surfaceHigh: "#22222e",
  border: "rgba(255,255,255,0.08)", borderHigh: "rgba(255,255,255,0.14)",
  accent: "#0a84ff", accentSoft: "rgba(10,132,255,0.18)", accentGlow: "rgba(10,132,255,0.3)",
  teal: "#5ac8fa", tealSoft: "rgba(90,200,250,0.15)", tealGlow: "rgba(90,200,250,0.25)",
  amber: "#ff9f0a", amberSoft: "rgba(255,159,10,0.15)", amberGlow: "rgba(255,159,10,0.25)",
  coral: "#ff453a", coralSoft: "rgba(255,69,58,0.15)", coralGlow: "rgba(255,69,58,0.25)",
  green: "#30d158", greenSoft: "rgba(48,209,88,0.15)", greenGlow: "rgba(48,209,88,0.25)",
  purple: "#bf5af2", purpleSoft: "rgba(191,90,242,0.15)",
  textPrimary: "#f5f5f7", textSecondary: "#aeaeb2", textTertiary: "#636366",
};
// G a nivel de módulo apunta a LIGHT (para el css template); en el componente se sobrescribe
let G = LIGHT;

// Pantalla de carga inicial mientras se sincronizan los datos de Supabase
function SyncingScreen({ darkMode }) {
  const bg   = darkMode ? "#0f0f14" : "#f0f0f5";
  const text = darkMode ? "#f5f5f7" : "#1d1d1f";
  const sub  = darkMode ? "#aeaeb2" : "#515154";
  return (
    <div style={{
      minHeight: "100vh", background: bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0071e3,#5e5ce6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>Cargando tus datos...</div>
        <div style={{ fontSize: 12, color: sub }}>Sincronizando con Supabase</div>
      </div>
      <div style={{ width: 200, height: 3, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <style>{`@keyframes sp-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
        <div style={{ width: "60%", height: "100%", background: "#0071e3", borderRadius: 4, animation: "sp-pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

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
        { tab:"primario",       sender:"alfonso.diseno@carbono.com",           subj:"PRESUPUESTO PROPUESTA 1 - CINTAS DE FIBRA DE CARBONO",               body:"Ing. Ospina, ya estoy revisando el presupuesto para la propuesta de diseño original con cintas de fibra de carbono para el proyecto. Saludos, Alfonso Otero.",                                                                          badgeBg:"rgba(255,149,0,0.08)",  badgeColor:"#ff9500", badgeText:"Presupuesto Fibra Carbono",       time:"09:15 AM" },
        { tab:"primario",       sender:"claudia.abogada@gmail.com",            subj:"Re: Resumen Reunión - Decisión USCIS Petición I-140",                 body:"Estimado Ing. Ospina, adjunto el resumen de la reunión y la decisión de USCIS sobre la Petición I-140 de Claudia Patricia Agudelo Bedoya. Atentamente, Claudia.",                                                                  badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Petición I-140 USCIS",           time:"11:30 AM" },
        { tab:"primario",       sender:"carlos.holmes@arquitectura.co",        subj:"PROYECTO SAN ANTONIO - MAURICIO COLLAZOS",                           body:"Ing. Ospina, remito el plano y la memoria del Proyecto San Antonio para la revisión de Mauricio Collazos. Cualquier inquietud me llama. Cel: 311-6276551.",                                                                        badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Plano San Antonio",               time:"12:45 PM" },
        { tab:"primario",       sender:"thiago.escobar@estructura.co",         subj:"D3. SAN VICENTE-ARQ V.1 - EDER FABIAN MORAN",                        body:"Buenas Noches Ing. Javier Ospina / Daniel Guerrero. Remito la versión V.1 de diseño estructural del Proyecto San Vicente elaborado por Eder Fabian Moran.",                                                                        badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Diseño Estructural San Vicente",   time:"03:20 PM" },
        { tab:"actualizaciones",sender:"sika-anchorfix@sika.com",              subj:"Sika AnchorFix - Registration approved",                             body:"Dear JAVIER OSPINA, Your registration for Sika AnchorFix has been approved. Please use the linked portal to complete the onboarding.",                                                                                                  badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Registro Sika Aprobado",          time:"02:10 AM" },
        { tab:"actualizaciones",sender:"noreply@bancolombia.com.co",           subj:"Extracto de cuenta disponible - Mayo 2026",                          body:"Ing. Ospina, su extracto de cuenta de ahorros correspondiente al mes de Mayo 2026 ya está disponible en la sucursal virtual.",                                                                                                           badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Extracto Bancolombia Mayo",       time:"06:00 AM" },
        { tab:"actualizaciones",sender:"facturacion@autodesk.com",             subj:"Factura suscripción Autodesk Revit 2026",                            body:"Su suscripción anual de Autodesk Revit ha sido renovada exitosamente por $3,450,000 COP. Transacción aprobada. Número de factura: AUT-2026-00445.",                                                                                    badgeBg:"rgba(255,149,0,0.08)",  badgeColor:"#ff9500", badgeText:"Factura Autodesk Revit",          time:"08:00 AM" },
        { tab:"social",         sender:"notifications@linkedin.com",           subj:"Javier, tienes 4 nuevas solicitudes de conexión",                    body:"Cuatro profesionales quieren conectar contigo en LinkedIn: Daniel Guerrero (Ing. Civil), María Valdés (Arquitecta), Felipe Torres (Curador Urbano), Ana Ríos (BIM Manager).",                                                          badgeBg:"rgba(10,102,194,0.08)", badgeColor:"#0a66c2", badgeText:"LinkedIn Conexiones",              time:"07:45 AM" },
        { tab:"social",         sender:"noreply@whatsapp.com",                 subj:"Nuevo mensaje en el grupo Obra San Vicente",                         body:"Daniel Guerrero: Ing. Ospina, ¿confirmamos la visita a la obra para el viernes? Necesito su aprobación para el vaciado del núcleo.",                                                                                                    badgeBg:"rgba(37,211,102,0.08)", badgeColor:"#25d366", badgeText:"WhatsApp Obra San Vicente",        time:"10:20 AM" },
        { tab:"promociones",    sender:"ofertas@sika.com.co",                  subj:"Descuento especial Sika Colombia - Junio 2026",                      body:"Ing. Ospina, durante junio 2026 tenemos descuentos del 18% en toda la línea SikaTop y SikaFlex para proyectos NSR-10. Válido hasta el 30 de junio.",                                                                                 badgeBg:"rgba(255,59,48,0.06)",  badgeColor:"#ff3b30", badgeText:"Promo Sika Junio 18%",            time:"01:00 PM" },
        { tab:"promociones",    sender:"newsletter@construdata.com",           subj:"Nuevas normas NSR-10 Resolución 0549 de 2026",                       body:"Le informamos sobre la Resolución 0549 de 2026 que modifica los capítulos A.2 y E.1 del Reglamento NSR-10. Descargue el resumen técnico gratuito.",                                                                                  badgeBg:"rgba(94,92,230,0.08)",  badgeColor:"#5e5ce6", badgeText:"Actualización NSR-10",            time:"02:30 PM" }
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
        { tab:"primario",       sender:"licencias@curaduria4.gov.co",          subj:"Citación Corrección Planos Estructurales - Radicado 2026-0045",      body:"Ing. Ospina, se le cita para subsanar observaciones de resistencia sismorresistente en el Eje D. Plazo máximo de 3 días hábiles.",                                                                                                  badgeBg:"rgba(255,59,48,0.08)",  badgeColor:"#ff3b30", badgeText:"Corrección Crítica Licencia",    time:"08:15 AM" },
        { tab:"primario",       sender:"arquitectura.curaduria@bogota.gov.co", subj:"Aprobación de Parámetros Urbanísticos Portal",                       body:"El diseño arquitectónico cumple con las alturas y retiros normativos. Proceda al cargue de memorias de cálculo sismorresistente.",                                                                                                       badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Arquitectura Aprobada NSR-10",    time:"02:20 PM" },
        { tab:"actualizaciones",sender:"notificaciones@curaduria4.gov.co",     subj:"Pago de Expensas Fijas - Radicado Portal",                           body:"Se ha generado el recibo para el pago de expensas fijas correspondientes a la revisión estructural por un valor de $1,250,000 COP.",                                                                                                  badgeBg:"rgba(255,149,0,0.08)",  badgeColor:"#ff9500", badgeText:"Pago Expensas $1.25M",           time:"10:45 AM" },
        { tab:"actualizaciones",sender:"sistema@ventanilladigital.gov.co",     subj:"Radicado 2026-0045: Estado actualizado a REVISION TECNICA",          body:"El expediente 2026-0045 ha cambiado de estado a REVISION TECNICA. Consulte el portal de la Curaduría para más detalles.",                                                                                                           badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Estado Radicado Actualizado",     time:"09:00 AM" },
        { tab:"social",         sender:"notifications@linkedin.com",           subj:"3 profesionales vieron tu perfil esta semana",                       body:"Tu perfil fue visto por 3 personas esta semana, entre ellas un Curador Urbano de Bogotá y un Director de Licencias de Construcción.",                                                                                                badgeBg:"rgba(10,102,194,0.08)", badgeColor:"#0a66c2", badgeText:"LinkedIn Vistas Perfil",           time:"06:30 AM" },
        { tab:"promociones",    sender:"info@cursosnsr10.com",                 subj:"Certificación NSR-10 Online - Inicio Junio 2026",                    body:"Actualice su certificación NSR-10 con nuestro curso en línea de 40 horas. Cupos limitados. Descuento del 20% para ingenieros registrados en COPNIA.",                                                                                badgeBg:"rgba(94,92,230,0.08)",  badgeColor:"#5e5ce6", badgeText:"Curso NSR-10 Online",             time:"12:00 PM" }
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
        { tab:"primario",       sender:"ingenieria@construito.co",             subj:"Memorias de Cálculo Optimización Cimentación - Fase II",             body:"Ing. Javier, adjunto la propuesta de cimentación con zapatas combinadas optimizadas para reducir costos en un 15% de volumen.",                                                                                                        badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Optimización Cimentación",       time:"09:00 AM" },
        { tab:"primario",       sender:"eder.moran@construito.co",             subj:"Plano Estructural Versión Final V.2 - Pórticos Eje 4",               body:"Ing. Ospina, remito el plano ajustado con el refuerzo adicional de vigas solicitado por el revisor independiente de NSR-10.",                                                                                                        badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Plano V.2 Pórticos Eje 4",        time:"11:15 AM" },
        { tab:"primario",       sender:"compras@construito.co",                subj:"Cotización Acero Refuerzo Grado 60 - Proyecto Portal",               body:"Recibimos cotización de Diaco por 25 toneladas de acero figurado para el Proyecto Portal por $112,000,000 COP. Pendiente firma de gerencia.",                                                                                      badgeBg:"rgba(255,149,0,0.08)",  badgeColor:"#ff9500", badgeText:"Cotización Acero $112M",          time:"02:40 PM" },
        { tab:"actualizaciones",sender:"laboratorio@construito.co",            subj:"Resultados Cilindros Concreto f'c=21 MPa - Muestra Lote 8",          body:"Los resultados de compresión a los 28 días del Lote 8 arrojaron f'c=23.4 MPa, cumpliendo la especificación mínima de 21 MPa. Adjunto certificado.",                                                                                badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Ensayo Concreto Aprobado",        time:"07:30 AM" },
        { tab:"actualizaciones",sender:"nomina@construito.co",                 subj:"Liquidación quincenal Mayo 16-31 disponible",                        body:"La liquidación de nómina de la segunda quincena de Mayo 2026 está disponible en el portal de empleados. Fecha de pago: 31 de Mayo.",                                                                                                badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Nómina Quincenal Disponible",     time:"10:00 AM" },
        { tab:"social",         sender:"noreply@construito-teams.co",          subj:"Eder Moran te mencionó en el canal #estructuras",                    body:"Eder Moran: @Ing.Ospina ya subí los planos V.2 al servidor compartido. Por favor revisar el refuerzo del nudo de la columna C4 antes del vaciado del miércoles.",                                                                   badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Teams #Estructuras",              time:"03:15 PM" },
        { tab:"promociones",    sender:"ventas@diaco.com.co",                  subj:"Listas de precios Acero DIACO - Junio 2026",                         body:"Estimado cliente, adjuntamos las listas actualizadas de precios para acero corrugado Grado 60 y Grado 40. Precios válidos hasta el 30 de junio 2026.",                                                                               badgeBg:"rgba(255,149,0,0.06)",  badgeColor:"#ff9500", badgeText:"Precios Acero DIACO Junio",       time:"08:45 AM" }
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
        { tab:"primario",       sender:"iberia.notificaciones@iberia.com",     subj:"Confirmación de Reserva IB6801 (BOG - MAD)",                        body:"Estimado Ing. Ospina, confirmamos su vuelo a Madrid el 24 de Mayo. Salida: 18:20h. Asiento: 12C.",                                                                                                                                   badgeBg:"rgba(52,199,89,0.08)",  badgeColor:"#34c759", badgeText:"Vuelo BOG-MAD Confirmado",        time:"08:15 AM" },
        { tab:"primario",       sender:"curaduria4@bogota.gov.co",             subj:"Observaciones estructurales NSR-10 — Portal",                        body:"Ing. Ospina, se solicita ajustar el cálculo sismorresistente NSR-10 en pórticos del Eje C. Plazo de 5 días hábiles.",                                                                                                                   badgeBg:"rgba(0,113,227,0.08)",  badgeColor:"#0071e3", badgeText:"Observaciones NSR-10",            time:"11:45 AM" },
        { tab:"actualizaciones",sender:"facturacion@autodesk.com",             subj:"Su factura de suscripción anual Autodesk Revit",                     body:"Su suscripción se ha renovado con éxito por un monto de $3,450,000 COP. Transacción aprobada.",                                                                                                                                       badgeBg:"rgba(255,149,0,0.08)",  badgeColor:"#ff3b30", badgeText:"Factura Autodesk $3.45M",         time:"09:30 AM" },
        { tab:"social",         sender:"notifications@linkedin.com",           subj:"5 nuevas solicitudes de conexión esta semana",                       body:"5 profesionales del sector de la construcción quieren conectar contigo en LinkedIn.",                                                                                                                                                   badgeBg:"rgba(10,102,194,0.08)", badgeColor:"#0a66c2", badgeText:"LinkedIn Conexiones",              time:"07:00 AM" },
        { tab:"promociones",    sender:"ofertas@cemargos.com.co",              subj:"Promoción cemento Argos - Descuento Mayo 2026",                      body:"Ing. Ospina, durante mayo ofrecemos descuentos especiales en cemento Portland tipo I y tipo ARI para proyectos de gran volumen.",                                                                                                    badgeBg:"rgba(255,59,48,0.06)",  badgeColor:"#ff3b30", badgeText:"Promo Cemento Argos",             time:"10:00 AM" }
      ]
    };
  }
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: #f5f5f7; 
    color: ${G.textPrimary}; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.12); border-radius: 2px; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; outline: none; }
  input, textarea { font-family: inherit; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ripple { 0% { transform:scale(1); opacity:0.3; } 100% { transform:scale(2.5); opacity:0; } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
  
  /* Orb Animations */
  @keyframes floatOrb {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-4px) scale(1.02); }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 15px rgba(0, 113, 227, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.6); }
    50% { box-shadow: 0 0 25px rgba(110, 0, 245, 0.35), inset 0 0 15px rgba(255, 255, 255, 0.7); }
  }
  @keyframes glowPulseListening {
    0%, 100% { box-shadow: 0 0 15px rgba(255, 59, 48, 0.35), inset 0 0 10px rgba(255, 255, 255, 0.6); transform: scale(1); }
    50% { box-shadow: 0 0 35px rgba(255, 149, 0, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.8); transform: scale(1.08); }
  }
  @keyframes glowPulseThinking {
    0%, 100% { box-shadow: 0 0 15px rgba(0, 113, 227, 0.25), inset 0 0 10px rgba(255, 255, 255, 0.6); }
    50% { box-shadow: 0 0 30px rgba(48, 176, 199, 0.55), inset 0 0 15px rgba(255, 255, 255, 0.8); }
  }
  @keyframes spinOrb {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Floating Tags animations */
  @keyframes floatingTag1 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-5px) rotate(1deg); }
  }
  @keyframes floatingTag2 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-7px) rotate(-1.5deg); }
  }
  @keyframes floatingTag3 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-4px) rotate(1.2deg); }
  }

  .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  .slide-in { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-input:focus-within {
    border-color: ${G.accent};
    box-shadow: 0 0 18px rgba(0, 113, 227, 0.15);
  }
  
  .bg-radial-glow {
    position: absolute;
    top: -30%;
    left: -30%;
    width: 160%;
    height: 160%;
    z-index: 1;
    background: 
      radial-gradient(circle at 20% 30%, rgba(0, 113, 227, 0.03) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(255, 149, 0, 0.02) 0%, transparent 40%);
    pointer-events: none;
    mix-blend-mode: multiply;
  }
  .hall-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
  }
  @media (max-width: 860px) {
    .hall-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Brite Workspace Layout Classes */
  .workspace-container {
    display: flex;
    min-height: 100vh;
    width: 100vw;
    background: #f0f0f5;
    position: relative;
    overflow: hidden;
    transition: background 0.25s;
  }
  .workspace-container.dark {
    background: #0f0f14;
  }

  .sidebar-permanent {
    width: 220px;
    min-width: 220px;
    background: #16161e;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
    z-index: 100;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .main-content-pane {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative;
    background: #f0f0f5;
    transition: background 0.25s;
  }
  .workspace-container.dark .main-content-pane {
    background: #0f0f14;
  }

  /* Topbar dark mode */
  .workspace-container.dark .topbar-header {
    background: #16161e !important;
    border-bottom-color: rgba(255,255,255,0.07) !important;
  }

  /* AI sidebar dark mode */
  .workspace-container.dark .ai-sidebar {
    background: #1a1a24;
    border-left-color: rgba(255,255,255,0.07);
  }

  /* AI Sidebar — barra lateral derecha permanente */
  .ai-sidebar {
    width: 300px;
    min-width: 300px;
    height: 100vh;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border-left: 1px solid rgba(0, 0, 0, 0.07);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 50;
  }
  @keyframes slideInSidebar {
    from { transform: translateX(300px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }

  /* Drawer Deslizante estilo Brite */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 900;
    animation: fadeIn 0.3s ease;
  }
  
  .drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 440px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(35px);
    -webkit-backdrop-filter: blur(35px);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: -15px 0 45px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    animation: slideLeft 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes slideLeft {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  /* Sidebar responsivo para móviles */
  .mobile-hamburger-btn {
    display: none;
  }
  .mobile-close-btn {
    display: none;
  }

  @media (max-width: 900px) {
    .sidebar-permanent {
      position: fixed;
      left: -280px;
      height: 100vh;
      box-shadow: 10px 0 30px rgba(0,0,0,0.06);
    }
    .sidebar-permanent.open {
      left: 0;
    }
    .drawer-panel {
      width: 100%;
    }
    .mobile-hamburger-btn {
      display: flex !important;
    }
    .mobile-close-btn {
      display: block !important;
    }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────────
function now() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function timeAgo(iso) {
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60) return "ahora";
  if (d < 3600) return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}d`;
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

// ── Gemini Web Search ──────────────────────────────────────────────────────
const SEARCH_PATTERNS = /busca[r]?|busca en|busca en internet|busca en la web|qué es\b|quién es\b|cuál es\b|precio de\b|tasa de\b|cotización|dólar|euro|cambio hoy|noticias|clima|temperatura|resultado.*partido|stock de\b|acción de\b|¿?cuánto cuesta|cuándo fue\b|dónde está\b|wikipedia|cuántos habitantes|capital de\b|según google|busca información|investiga|encuentra información|qué dice.*web|últimas noticias/i;

function looksLikeWebSearch(texto) {
  return SEARCH_PATTERNS.test(texto);
}

async function searchWithGemini(messages, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const contents = messages.map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }]
  }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      tools: [{ googleSearch: {} }],
      systemInstruction: {
        parts: [{ text: "Eres el Asistente Personal, el asistente cognitivo y ejecutivo del Ing. Javier Ospina. Busca en Google la información solicitada y responde de forma concisa, formal y ejecutiva en español. Incluye datos actualizados con sus fuentes cuando estén disponibles. Máximo 4 párrafos cortos." }]
      },
      generationConfig: { temperature: 0.5 }
    })
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Error de búsqueda ${res.status}: ${err.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin resultados.";
  // Extraer fuentes del groundingMetadata si existen
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const fuentes = chunks
    .filter(c => c.web?.uri)
    .slice(0, 3)
    .map(c => `• [${c.web.title || c.web.uri}](${c.web.uri})`)
    .join("\n");
  return {
    tipo: "chat",
    respuesta: text + (fuentes ? `\n\n**Fuentes:**\n${fuentes}` : ""),
    datos: {}
  };
}

// ── Gemini API ─────────────────────────────────────────────────────────────
// Construye un snapshot de contexto de la app para inyectar en el prompt del Asistente Personal
function buildContextSnapshot(items) {
  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  const mesStr = ahora.toISOString().slice(0, 7);

  const tareas = items.filter(i => i.tipo === "tarea" && !i.hecho);
  const recordatorios = items.filter(i => i.tipo === "recordatorio" && !i.hecho);
  const notas = items.filter(i => i.tipo === "nota");
  const gastos = items.filter(i => i.tipo === "gasto");
  const reuniones = items.filter(i => i.tipo === "reunion");

  const hoy = tareas.filter(t => t.fecha?.slice(0,10) === hoyStr);
  const vencidas = tareas.filter(t => t.fecha && t.fecha.slice(0,10) < hoyStr);
  const proximas = tareas.filter(t => t.fecha && t.fecha.slice(0,10) > hoyStr).slice(0, 5);
  const gastosMes = gastos.filter(g => g.creado?.startsWith(mesStr));
  const totalGastosMes = gastosMes.reduce((s, g) => s + (Number(g.datos?.monto) || 0), 0);

  const fmtItem = (i) => {
    const t = i.datos?.titulo || i.texto || "Sin título";
    const f = i.fecha ? ` [${i.fecha.slice(0,10)}${i.datos?.hora ? " " + i.datos.hora : ""}]` : "";
    return `• [ID:${i.id}] ${t}${f}`;
  };

  let ctx = `\n\n--- CONTEXTO ACTUAL DEL SISTEMA (${ahora.toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}) ---\n`;

  ctx += `\nTAREAS PENDIENTES (${tareas.length} total):`;
  if (hoy.length) ctx += `\n  Hoy (${hoy.length}):\n${hoy.map(fmtItem).join("\n")}`;
  if (vencidas.length) ctx += `\n  Vencidas (${vencidas.length}):\n${vencidas.map(fmtItem).join("\n")}`;
  if (proximas.length) ctx += `\n  Próximas:\n${proximas.map(fmtItem).join("\n")}`;
  if (!tareas.length) ctx += "\n  (sin tareas pendientes)";

  if (recordatorios.length) {
    ctx += `\n\nRECORDATORIOS ACTIVOS (${recordatorios.length}):\n${recordatorios.slice(0,5).map(fmtItem).join("\n")}`;
  }

  if (notas.length) {
    ctx += `\n\nNOTAS RECIENTES (${notas.length} total):\n${notas.slice(0,5).map(n => `• ${n.datos?.titulo || n.texto || "Sin título"}`).join("\n")}`;
  }

  if (reuniones.length) {
    ctx += `\n\nREUNIONES REGISTRADAS (${reuniones.length}):\n${reuniones.slice(0,3).map(r => `• ${r.datos?.titulo || r.texto || "Sin título"}`).join("\n")}`;
  }

  ctx += `\n\nFINANZAS:\n  Gastos este mes: $${totalGastosMes.toLocaleString("es-CO")} COP (${gastosMes.length} registros)`;
  ctx += `\n  Total gastos históricos: ${gastos.length} registros`;

  // Eventos del calendario local
  try {
    const eventos = JSON.parse(localStorage.getItem("cerebro_eventos") || "[]");
    const eventosHoy = eventos.filter(e => e.fecha === hoyStr);
    const eventosFuturos = eventos.filter(e => e.fecha > hoyStr).slice(0, 5);
    if (eventos.length) {
      ctx += `\n\nEVENTOS DE CALENDARIO (${eventos.length} total):`;
      if (eventosHoy.length) ctx += `\n  Hoy: ${eventosHoy.map(e => `${e.titulo}${e.horaInicio ? " a las " + e.horaInicio : ""}`).join(", ")}`;
      if (eventosFuturos.length) ctx += `\n  Próximos: ${eventosFuturos.map(e => `${e.titulo} (${e.fecha})`).join(", ")}`;
    }
  } catch {}

  // Sincronización de Google Workspace (Gmail + Google Calendar) del correo autorizado
  const isGoogleConnected = localStorage.getItem("cerebro_google_connected") === "true";
  const googleEmail = localStorage.getItem("cerebro_google_email") || "";

  if (isGoogleConnected && googleEmail) {
    const wsData = getDynamicWorkspaceData(googleEmail);
    ctx += `\n\n--- GOOGLE WORKSPACE AUTORIZADO ACTIVO (${googleEmail}) ---`;
    ctx += `\nTienes acceso directo, seguro y autorizado a la cuenta de Google de su titular: ${googleEmail}`;
    ctx += `\nCualquier consulta del Ing. Ospina sobre sus correos o citas debe ser respondida con los siguientes datos del Workspace:`;

    ctx += `\n\n[GOOGLE CALENDAR SYNC - CITAS PARA HOY EN ${googleEmail}]:`;
    wsData.calendar.forEach(ev => {
      ctx += `\n  • ${ev.time} - ${ev.title} [Ubicación: ${ev.loc}] (Importado de Google Calendar)`;
    });

    ctx += `\n\n[GMAIL SYNC - ÚLTIMOS CORREOS DETECTADOS Y PROCESADOS EN ${googleEmail}]:`;
    wsData.gmail.forEach(m => {
      ctx += `\n  • De: ${m.sender}`;
      ctx += `\n    Recibido: Hoy a las ${m.time} (18 de Mayo de 2026)`;
      ctx += `\n    Asunto: ${m.subj}`;
      ctx += `\n    Resumen de Extracción IA: ${m.body} [Estado: ${m.badgeText}]`;
    });
    ctx += `\n------------------------------------------------------------\n`;
  } else {
    ctx += `\n\n--- GOOGLE WORKSPACE NO AUTORIZADO ---`;
    ctx += `\nEl conector de Google Workspace está actualmente desactivado. Si el Ing. Ospina te consulta sobre sus correos o citas de su calendario de Google, explícale de forma muy atenta, formal y clara que debe autorizar y vincular su dirección de correo electrónico preferida haciendo clic en el botón 'Google Workspace' de la barra lateral izquierda o en la Configuración general (icono de engranaje) para que puedas tener acceso a su información.\n`;
  }

  // Contactos
  const contactosSaved = (() => {
    try { return JSON.parse(localStorage.getItem("cerebro_contactos") || "[]"); } catch { return []; }
  })();
  if (contactosSaved.length > 0) {
    ctx += `\n\nCONTACTOS REGISTRADOS (${contactosSaved.length}):\n`;
    ctx += contactosSaved.map(c => `• ${c.nombre}${c.empresa ? ` (${c.empresa})` : ""} | ${c.email || "sin email"} | ${c.telefono || "sin tel"} | ${c.whatsapp || "sin WhatsApp"}`).join("\n");
  }

  ctx += "\n--- FIN DEL CONTEXTO ---\n";
  return ctx;
}

async function askGemini(messages, apiKey, personality, items = []) {
  const geminiKey = apiKey || localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "";
  
  if (!geminiKey) {
    return {
      tipo: "chat",
      respuesta: "⚠️ Se requiere configurar la clave de API de Gemini. Por favor, haga clic en el botón Configurar en la parte superior para ingresarla.",
      datos: {}
    };
  }

  const p = personality || localStorage.getItem("cerebro_personality") || "profesional";
  let promptStyle = "";
  if (p === "entrenador") {
    promptStyle = "Tus respuestas deben sonar como un Entrenador Directo: sé sumamente enérgico, motivador, impulsador, directo y enfocado a que el usuario ejecute rápido y sin excusas. ¡Inspíralo a moverse de inmediato!";
  } else if (p === "copiloto") {
    promptStyle = "Tus respuestas deben sonar como un Copiloto Tranquilo: sé empático, amigable, relajado, cálido, comprensivo y brinda un apoyo constante y calmado en su día a día.";
  } else if (p === "minimalista") {
    promptStyle = "Tus respuestas deben sonar como un Minimalista Discreto: sé extremadamente breve, silencioso, reservado, directo al grano y utiliza el menor número de palabras posible (máximo una línea muy corta).";
  } else {
    promptStyle = "Tus respuestas deben sonar como un Profesional Eficiente: sé formal, corporativo, neutro, de tono ejecutivo, altamente claro, rápido y enfocado a la productividad empresarial.";
  }

  // Snapshot de todos los datos de la app para que el Asistente Personal tenga contexto completo
  const contextSnapshot = buildContextSnapshot(items);
  const hoyISO = new Date().toISOString().slice(0, 10);

  const systemPrompt = `Eres el Asistente Personal — el asistente cognitivo ejecutivo y sistema de gestión de vida avanzado del Ing. Javier Ospina, Director de Proyectos.

IDENTIDAD Y CAPACIDADES:
- Siempre te diriges al usuario como "Ing. Ospina". Nunca por nombre de pila.
- Tono formal, ejecutivo, preciso. Sin exclamaciones. Sin relleno.
- Eres PROACTIVO: priorizas lo urgente, alertas sobre tareas vencidas, anticipas necesidades.
- Respondes en español formal neutro.
- Tienes acceso en tiempo real a los correos electrónicos y eventos de Google Workspace del Ing. Ospina provistos en el snapshot de contexto.
- Cuando el Ing. Ospina te pida revisar sus correos (por ejemplo, buscar correos de hoy, correos de 8 am a 12 pm, o correos de un remitente específico), consulta el snapshot de Gmail provisto abajo y respóndele de manera afirmativa e inmediata con los detalles de esos correos.
- NUNCA respondas diciendo que no puedes filtrar correos, que tu funcionalidad no te permite realizar búsquedas en tiempo real, que tienes limitaciones para consultar su Gmail, o que son correos de simulación. Asume que estás conectada en vivo a su Workspace y léele directamente los datos exactos del snapshot como si estuvieras accediendo a su bandeja real.
- Tienes acceso a internet vía Google Search para información general en tiempo real cuando sea requerida.
- Estilo activo: ${promptStyle}

ACCESO TOTAL A LA APP — tienes visibilidad completa de:
• TAREAS: puedes crear, recordar, priorizar y hacer seguimiento de todas las tareas.
• NOTAS: puedes referenciar notas existentes y crear nuevas.
• CALENDARIO: puedes consultar eventos, tareas programadas y recordatorios con fecha.
• REUNIONES: tienes acceso a los resúmenes y minutas de reuniones grabadas.
• FINANZAS: conoces los gastos registrados y puedes registrar nuevos.
• BÚSQUEDA WEB: puedes buscar información actualizada cuando se requiera.

USO DEL CONTEXTO: Al responder, usa activamente los datos del snapshot de contexto al final de este prompt para dar respuestas personalizadas y precisas. Si el Ing. Ospina pregunta "¿qué tengo hoy?" o "¿cómo voy esta semana?", responde con datos reales del contexto.

GESTIÓN PROACTIVA DE VIDA — cuando detectes:
- Tareas vencidas → alerta y sugiere reagendar.
- Tareas sin fecha → sugiere programarlas.
- Muchos gastos → sugiere revisión financiera.
- Agenda vacía → sugiere planificación.
- Solicitud de agenda o resumen → genera respuesta usando el contexto real.

FILOSOFÍA DE ASISTENTE EJECUTIVO PROACTIVO:
Actúas como la secretaria ejecutiva más eficiente del mundo. Antes de registrar cualquier acción, te anticipas: ¿falta algún dato clave? ¿Puedo ejecutar esto ahora mismo? ¿Qué necesita el Ing. Ospina que él aún no ha pedido?

PREGUNTAS OBLIGATORIAS ANTES DE REGISTRAR (si el contexto está incompleto):
- "Llamar a proveedor" → ¿cuál proveedor? ¿Tenemos su número? ¿Para qué asunto?
- "Reunión con alguien" → ¿con quién exactamente? ¿Cuándo? ¿Agenda?
- "Enviar correo" → ¿a quién? ¿Tenemos su email? ¿Qué mensaje?
- "Tarea vaga" → ¿qué resultado específico se espera? ¿Para cuándo?
Solo haz UNA pregunta a la vez. Cuando tengas todo, ejecuta.

ACCIONES DE COMUNICACIÓN — cuando una tarea implica contactar a alguien:
Si la tarea es "llamar", "escribir", "enviar correo", "mandar WhatsApp", "contactar" a una persona:
1. Busca el contacto en CONTACTOS REGISTRADOS del contexto.
2. Si lo encuentras, incluye el campo "accion" en tu respuesta con los datos del contacto.
3. Si no lo encuentras, pregunta: "¿Desea que registre a [nombre] en sus contactos? Por favor indíqueme su email y/o WhatsApp."
4. NUNCA crees la tarea hasta tener suficiente información para ejecutarla.

REPROGRAMACIÓN DE TAREAS/CITAS — cuando el usuario pida mover, cambiar, reprogramar, reagendar, postergar o adelantar algo:
FLUJO OBLIGATORIO en 2 pasos:
PASO 1 — Si el usuario no especificó qué hacer con el original: devuelve tipo "chat" y pregunta:
  "¿Desea mover la [tarea/cita] (eliminar la anterior y crear la nueva) o prefiere mantener ambas?"
PASO 2 — Cuando el usuario confirme, devuelve el ítem reprogramado con "accion":
  - Si dijo "mover" / "eliminar" / "solo la nueva": usa accion.tipo = "reprogramar", accion.accion_original = "eliminar", accion.item_id_original = el [ID:xxx] del ítem del contexto.
  - Si dijo "mantener" / "conservar" / "las dos": crea el ítem nuevo sin accion, deja el original intacto.
IMPORTANTE: El ID del ítem original lo encuentras en el contexto como [ID:xxxxxxx] junto a su título. Siempre incluye el ID correcto en item_id_original.

FECHA OBLIGATORIA: Para tipo "tarea" y "recordatorio", el campo "fecha" en datos NUNCA puede ser null. Siempre debe tener una fecha ISO YYYY-MM-DD. Si el usuario no especifica fecha, usa la fecha de hoy: ${hoyISO}.

CLASIFICACIÓN:
- TAREA: acción pendiente de ejecutar.
- RECORDATORIO: evento/cita/aviso con fecha u hora.
- NOTA: apunte, reflexión, idea, documento.
- GASTO: registro monetario, compra, pago.
- BURBUJA: tema o proyecto agrupador (NSR-10, Construito, etc.).

FORMATO DE RESPUESTA OBLIGATORIO — devuelve ÚNICAMENTE este JSON:
{
  "tipo": "tarea|recordatorio|nota|gasto|burbuja|chat",
  "respuesta": "respuesta formal al Ing. Ospina, máximo 3 frases",
  "datos": {
    "titulo": "título descriptivo o null",
    "descripcion": "detalle o null",
    "fecha": "YYYY-MM-DD — OBLIGATORIO para tarea/recordatorio",
    "hora": "HH:MM o null",
    "monto": número o null,
    "categoria": "categoría o null",
    "burbuja": "nombre del tema o null",
    "bloques": null
  },
  "accion": {
    "tipo": "enviar_correo|enviar_whatsapp|llamar|abrir_url|reprogramar",
    "destinatario_nombre": "nombre completo o null",
    "destinatario_email": "email o null",
    "destinatario_telefono": "+57XXXXXXXXXX o null",
    "destinatario_whatsapp": "+57XXXXXXXXXX o null",
    "asunto": "asunto del correo o null",
    "mensaje": "cuerpo del mensaje o null",
    "item_id_original": "ID del ítem a eliminar cuando accion_original=eliminar, o null",
    "accion_original": "eliminar|mantener"
  }
}
Omite el campo "accion" si no hay comunicación ni reprogramación involucrada.

NOTAS RICAS — cuando tipo="nota", usa el campo "bloques" (array) en lugar de "descripcion" para estructurar el contenido. Cada bloque tiene "tipo" y contenido:
- Párrafo:   {"tipo":"texto","contenido":"texto libre"}
- Título H1: {"tipo":"h1","contenido":"Título grande"}
- Título H2: {"tipo":"h2","contenido":"Subtítulo"}
- Título H3: {"tipo":"h3","contenido":"Sección pequeña"}
- Checklist: {"tipo":"checklist","items":[{"id":"1","texto":"elemento","hecho":false},...]}
- Viñetas:   {"tipo":"bullet","items":[{"id":"1","texto":"punto"},...]}
- Numerada:  {"tipo":"numbered","items":[{"id":"1","texto":"paso"},...]}
- Callout:   {"tipo":"callout","contenido":"nota destacada","calloutType":"info"}
- Imagen:    {"tipo":"imagen","src":"https://en.wikipedia.org/wiki/Special:FilePath/NOMBRE_ARCHIVO.jpg","caption":"descripción"}

IMÁGENES SIN API: Para bloques de imagen usa la URL de Wikipedia Special:FilePath. El formato es:
  https://en.wikipedia.org/wiki/Special:FilePath/NOMBRE_IMAGEN.jpg
Ejemplos reales:
  Carbonara → https://en.wikipedia.org/wiki/Special:FilePath/Spaghetti_alla_Carbonara.jpg
  Pizza →     https://en.wikipedia.org/wiki/Special:FilePath/Pizza_Margherita_ Naples.jpg
  Colombia →  https://en.wikipedia.org/wiki/Special:FilePath/Colombia_(orthographic_projection).svg
Usa el nombre de archivo exacto del artículo de Wikipedia relacionado con el tema (usa guiones bajos, extensión .jpg o .png). Incluye imagen al inicio de notas de recetas, lugares, personas o cualquier tema visual cuando el usuario lo pida o cuando enriquezca la nota. Si no estás seguro del nombre exacto del archivo, omite la imagen.

Ejemplo de nota con receta:
"bloques": [
  {"tipo":"imagen","src":"https://en.wikipedia.org/wiki/Special:FilePath/Spaghetti_alla_Carbonara.jpg","caption":"Spaguetti a la Carbonara"},
  {"tipo":"h2","contenido":"Ingredientes"},
  {"tipo":"checklist","items":[{"id":"1","texto":"400g spaguetti","hecho":false},{"id":"2","texto":"200g guanciale","hecho":false},{"id":"3","texto":"4 yemas de huevo","hecho":false},{"id":"4","texto":"100g Pecorino Romano","hecho":false},{"id":"5","texto":"Pimienta negra al gusto","hecho":false}]},
  {"tipo":"h2","contenido":"Preparación"},
  {"tipo":"numbered","items":[{"id":"1","texto":"Hervir el agua con sal y cocinar el spaguetti al dente"},{"id":"2","texto":"Freír el guanciale hasta que esté crujiente"},{"id":"3","texto":"Mezclar yemas con queso rallado y pimienta"},{"id":"4","texto":"Retirar del fuego y mezclar con la salsa de huevo"}]}
]
Cuando uses bloques, pon "descripcion": null. Para notas simples sin estructura, puedes seguir usando solo "descripcion".

Para conversación, consultas o resúmenes, usa tipo "chat" con solo "respuesta" (puede ser larga si el usuario pide un informe o resumen).
${contextSnapshot}`;

  // Mapear historial al formato de Gemini contents
  const contents = messages.map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.0
      }
    })
  });

  if (!res.ok) {
    let errorMsg = `Error de API: ${res.status}`;
    try {
      const errorDetails = await res.text();
      console.error("Gemini API error:", errorDetails);
      const errorJson = JSON.parse(errorDetails);
      if (errorJson.error?.message) {
        errorMsg = `${errorJson.error.message} (${res.status})`;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(clean);
    } catch (_) {}

    const firstBrace = clean.indexOf("{");
    const firstBracket = clean.indexOf("[");
    let start = -1;
    let end = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      start = firstBracket;
      end = clean.lastIndexOf("]");
    } else {
      start = firstBrace;
      end = clean.lastIndexOf("}");
    }

    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.slice(start, end + 1));
    }
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", text, err);
  }

  return { tipo: "chat", respuesta: text, datos: {} };
}

// ── Icono Asistente Personal reutilizable ──────────────────────────────────────
function AsistenteSparkle({ size = 20, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" style={{ opacity }}>
      <path d="M12 3C12 3 13.8 8.6 19.2 11C13.8 13.4 12 19 12 19C12 19 10.2 13.4 4.8 11C10.2 8.6 12 3 12 3Z"/>
      <path d="M12 7.5C12 7.5 12.9 10.2 15 11C12.9 11.8 12 14.5 12 14.5C12 14.5 11.1 11.8 9 11C11.1 10.2 12 7.5 12 7.5Z" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );
}

function AsistenteAvatar({ size = 44, state = "idle" }) {
  const isThinking  = state === "thinking";
  const isListening = state === "listening";

  const bgIdle      = "linear-gradient(145deg, #0d1b2a 0%, #1a1a3e 50%, #0a0f1e 100%)";
  const bgThinking  = "linear-gradient(145deg, #0a2744 0%, #0d3a6e 50%, #0a1f40 100%)";
  const bgListening = "linear-gradient(145deg, #2a0d1a 0%, #3e0a1a 50%, #1e0a12 100%)";
  const bg = isThinking ? bgThinking : isListening ? bgListening : bgIdle;

  const glowIdle      = "0 0 0 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.4)";
  const glowThinking  = "0 0 0 1px rgba(10,132,255,0.3), 0 4px 24px rgba(10,132,255,0.2)";
  const glowListening = "0 0 0 1px rgba(255,69,58,0.3), 0 4px 24px rgba(255,69,58,0.15)";
  const glow = isThinking ? glowThinking : isListening ? glowListening : glowIdle;

  const radius = Math.round(size * 0.27);
  const sparkSize = Math.round(size * 0.48);

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg,
      boxShadow: glow,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", flexShrink: 0,
      animation: isThinking ? "glowPulseThinking 2s infinite" : isListening ? "glowPulseListening 1.5s infinite" : "none",
      transition: "all 0.4s ease",
    }}>
      {/* Shimmer highlight */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "45%",
        background: "linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 100%)",
        borderRadius: `${radius}px ${radius}px 0 0`,
        pointerEvents: "none",
      }}/>
      {/* Sparkle icon */}
      <div style={{ animation: isThinking ? "spin 3s linear infinite" : "none", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <AsistenteSparkle size={sparkSize} />
      </div>
      {/* Bottom glow dot */}
      <div style={{
        position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
        width: size * 0.6, height: size * 0.3,
        background: isThinking ? "rgba(10,132,255,0.4)" : isListening ? "rgba(255,69,58,0.35)" : "rgba(94,92,230,0.25)",
        filter: "blur(8px)", borderRadius: "50%",
        transition: "background 0.4s",
      }}/>
    </div>
  );
}

function MemoryOrb({ state = "idle" }) {
  const isThinking  = state === "thinking";
  const isListening = state === "listening";
  const orbLabel = isThinking ? "Procesando..." : isListening ? "Escuchando..." : "Asistente IA";
  const labelColor = isThinking ? G.accent : isListening ? G.coral : G.textTertiary;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <AsistenteAvatar size={64} state={state} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: labelColor, transition: "color 0.4s ease" }}>
        {orbLabel}
      </span>
    </div>
  );
}

// ── Componentes base ───────────────────────────────────────────────────────
function Card({ children, style, onClick, hover, glowColor }) {
  const [hovered, setHovered] = useState(false);
  const glow = glowColor ? `0 0 15px ${glowColor}` : 'none';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && hover ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.70)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered && hover ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.08)"}`,
        borderRadius: 14,
        padding: "14px 16px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick ? "pointer" : "default",
        boxShadow: hovered && hover 
          ? `0 12px 24px rgba(0, 0, 0, 0.06), ${glow}` 
          : `0 4px 12px rgba(0, 0, 0, 0.02), ${glowColor ? `0 0 8px ${glowColor}33` : 'none'}`,
        transform: hovered && hover && onClick ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  const colors = {
    purple: { bg: G.accentSoft, text: G.accent, border: "rgba(0, 113, 227, 0.12)" },
    teal: { bg: G.tealSoft, text: G.teal, border: "rgba(36, 180, 149, 0.12)" },
    amber: { bg: G.amberSoft, text: G.amber, border: "rgba(255, 149, 0, 0.12)" },
    coral: { bg: G.coralSoft, text: G.coral, border: "rgba(255, 59, 48, 0.12)" },
    green: { bg: G.greenSoft, text: G.green, border: "rgba(52, 199, 89, 0.12)" },
  };
  const c = colors[color] || colors.purple;
  return (
    <span style={{
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 99, letterSpacing: "0.02em",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>{children}</span>
  );
}

function Spinner() {
  return <div style={{
    width: 16, height: 16, border: `2px solid ${G.border}`,
    borderTop: `2px solid ${G.accent}`, borderRadius: "50%",
    animation: "spin 0.7s linear infinite", display: "inline-block",
  }} />;
}

// ── Iconos SVG inline ──────────────────────────────────────────────────────
const Icon = {
  mic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  send: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  task: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  bell: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  note: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bubble: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>,
  receipt: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  sun: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  park: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.54a.5.5 0 0 0 .68.68C8.44 18.12 14.85 14.38 17 8z"/><path d="M17 8l-1 9"/></svg>,
  x: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  key: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 9M18.5 4.5L20 6"/></svg>,
  edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

const TIPO_META = {
  tarea:      { label: "Tarea",        color: "purple", icon: Icon.task },
  recordatorio:{ label: "Recordatorio", color: "amber",  icon: Icon.bell },
  nota:       { label: "Nota",         color: "teal",   icon: Icon.note },
  gasto:      { label: "Gasto",        color: "coral",  icon: Icon.receipt },
  burbuja:    { label: "Burbuja",      color: "green",  icon: Icon.bubble },
  chat:       { label: "Chat",         color: "teal",   icon: Icon.note },
};

// ── Vista HALL (inicio) ────────────────────────────────────────────────────
function ViewHall({ 
  items, 
  onNav, 
  onQuickCapture, 
  onToggle, 
  onAddItem,
  googleConnected, 
  googleConnectedEmail, 
  googleScopes, 
  onConnectGoogle,
  habits = [],
  onIncrementHabit,
  mood = "🎯 Enfocado",
  setMood,
  diario = "",
  setDiario,
  onOpenDrawer
}) {
  const tareas = items.filter(i => i.tipo === "tarea" && !i.hecho);
  const recordatorios = items.filter(i => i.tipo === "recordatorio" && !i.hecho);
  const todosPendientes = items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho);
  const gastos = items.filter(i => i.tipo === "gasto");
  const totalGastos = gastos.reduce((s, g) => s + (Number(g.datos?.monto) || 0), 0);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const now = new Date();
  const dateStr = `${days[now.getDay()].toUpperCase()}, ${now.getDate()} DE ${months[now.getMonth()].toUpperCase()}`;

  // Smart executive briefing in neutral formal Spanish
  let dynamicSummary = `Ing. Ospina, actualmente su extensión cognitiva registra ${tareas.length} tarea${tareas.length === 1 ? "" : "s"} prioritaria${tareas.length === 1 ? "" : "s"} y ${recordatorios.length} recordatorio${recordatorios.length === 1 ? "" : "s"} activo${recordatorios.length === 1 ? "" : "s"} para hoy. `;
  if (googleConnected) {
    dynamicSummary += `Su Google Workspace (Gmail + Google Calendar) está sincronizado bajo la cuenta ${googleConnectedEmail}, permitiendo la extracción automática de compromisos y gastos. `;
  } else {
    dynamicSummary += `Le sugerimos conectar su cuenta de Google Workspace para consolidar sus correos, citas y compromisos en tiempo real. `;
  }
  if (totalGastos > 0) {
    dynamicSummary += `En el ámbito financiero, registra un total acumulado de $${totalGastos.toLocaleString("es-CO")} COP en gastos corporativos durante este periodo.`;
  }

  // Google Simulated / Mock Events
  const simulatedEvents = [
    { time: "09:00 a.m.", title: "Reunión de presupuesto Construito.co", desc: "Revisar costos de diseño y flujo de caja de la plataforma.", type: "Finanzas", color: G.coral },
    { time: "11:30 a.m.", title: "Revisión de Fachada Digital", desc: "Sesión de diseño UX inspirada en Memorae y Apple.", type: "Idea", color: G.teal },
    { time: "03:00 p.m.", title: "Entrega de informes estructurales NSR-10", desc: "Someter informe técnico optimizado conforme a NSR-10.", type: "Trabajo", color: G.accent }
  ];

  // Estado local para la adición rápida de tareas
  const [quickTask, setQuickTask] = useState("");

  const handleQuickTaskSubmit = (e) => {
    e.preventDefault();
    if (!quickTask.trim()) return;
    onAddItem(quickTask.trim(), "tarea");
    setQuickTask("");
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Premium de Bienvenida estilo Brite */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 12, 
        padding: "20px 24px",
        background: "rgba(255, 255, 255, 0.45)",
        borderRadius: 24,
        border: "1px solid rgba(0,0,0,0.05)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: G.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              ESTADO DE PRODUCTIVIDAD
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: G.textPrimary, m: 0 }}>
              {saludo}, Ing. Ospina 💻
            </h1>
          </div>
          {/* Indicador de Clima Brite */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            background: "rgba(255,255,255,0.8)", 
            padding: "6px 12px", 
            borderRadius: 14, 
            fontSize: 12, 
            fontWeight: 600,
            border: "1px solid rgba(0,0,0,0.06)",
            color: G.textSecondary
          }}>
            <span>🌦️</span>
            <span>Bogotá, 18°C</span>
          </div>
        </div>

        {/* Selector de Estado de Ánimo Ejecutivo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: G.textTertiary, fontWeight: 700 }}>¿CÓMO VA SU ENFOQUE HOY?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["🎯 Enfocado", "🔋 Enérgico", "🧘 Meditativo", "⚖️ Balanceado", "⏳ Reflexivo"].map(m => {
              const active = mood === m;
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: active ? G.accent : "rgba(255,255,255,0.7)",
                    color: active ? "#ffffff" : G.textSecondary,
                    border: `1px solid ${active ? G.accent : "rgba(0,0,0,0.06)"}`,
                    boxShadow: active ? "0 4px 10px rgba(0, 113, 227, 0.15)" : "none",
                    transform: active ? "scale(1.03)" : "scale(1)"
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas estilo Apple */}
      <div className="hall-grid">
        
        {/* Columna Izquierda: Calendario & Tareas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* WIDGET APPLE CALENDAR */}
          <Card style={{ borderRadius: 24, padding: "20px" }} hover>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onOpenDrawer({ type: "calendar_detail" })}>
                <div style={{
                  background: "#ff2d55", color: "#ffffff", width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                  boxShadow: "0 2px 6px rgba(255, 45, 85, 0.25)"
                }}>
                  {now.getDate()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary, display: "flex", alignItems: "center", gap: 4 }}>
                  Google Calendar <span>↗</span>
                </span>
              </div>
              {googleConnected ? (
                <span style={{ fontSize: 10, color: G.green, background: G.greenSoft, border: `1px solid ${G.green}33`, padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Sincronizado
                </span>
              ) : (
                <span style={{ fontSize: 10, color: G.amber, background: G.amberSoft, border: `1px solid ${G.amber}33`, padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Desconectado
                </span>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#ff2d55", letterSpacing: "0.08em" }}>AGENDA DE COMPROMISOS</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: G.textPrimary, marginTop: 4 }}>
                {dateStr}
              </h2>
            </div>

            {googleConnected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {simulatedEvents.map((evt, idx) => (
                  <div key={idx} 
                    onClick={() => onOpenDrawer({ type: "calendar_detail", data: evt })}
                    style={{
                      display: "flex", gap: 12, padding: "12px", background: "rgba(0,0,0,0.02)",
                      borderRadius: 16, borderLeft: `4px solid ${evt.color}`, transition: "all 0.2s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
                  >
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 64 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: G.textPrimary }}>{evt.time}</span>
                      <span style={{ fontSize: 9, color: G.textTertiary, textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>{evt.type}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 12.5, fontWeight: 700, color: G.textPrimary, marginBottom: 2 }}>{evt.title}</h4>
                      <p style={{ fontSize: 10.5, color: G.textSecondary, lineHeight: 1.3 }}>{evt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "24px 16px", background: "rgba(0,0,0,0.02)", borderRadius: 18, border: "1px dashed rgba(0,0,0,0.08)",
                textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
                  <path fill="#4285F4" d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3H4.5A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zm0 16.5h-15V8.25h15v11.25z" />
                </svg>
                 <div style={{ fontSize: 12.5, fontWeight: 700, color: G.textPrimary }}>¿Cómo sincronizo mi Google Workspace?</div>
                <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4, maxWidth: 280, margin: "0 auto 6px" }}>
                  Active su conexión bidireccional y delegue sus citas, correos e informes NSR-10 directamente con Google.
                </p>
                <button
                  onClick={onConnectGoogle}
                  style={{
                    padding: "10px 18px", background: "linear-gradient(135deg, #0071e3 0%, #34c759 100%)",
                    color: "#ffffff", borderRadius: 14, fontSize: 11.5, fontWeight: 700, border: "none",
                    boxShadow: "0 4px 12px rgba(0, 113, 227, 0.25)", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04) translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  🔗 Conectar Google Workspace
                </button>
              </div>
            )}
          </Card>

          {/* WIDGET TAREAS ACTIVAS CON ADICIÓN RÁPIDA (Estilo Brite) */}
          <Card style={{ borderRadius: 24, padding: "20px" }} hover>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: G.accent, display: "flex" }}><Icon.task /></span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: G.textPrimary }}>Tareas & Plan del Día</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: G.textTertiary, textTransform: "uppercase" }}>
                {todosPendientes.length} Pendientes
              </span>
            </div>

            {/* Input de Adición Rápida en Widget */}
            <form onSubmit={handleQuickTaskSubmit} style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={quickTask}
                onChange={e => setQuickTask(e.target.value)}
                placeholder="+ Agregar tarea rápida... (Presione Enter)"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 12,
                  background: "rgba(0,0,0,0.02)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={e => {
                  e.target.style.background = "#ffffff";
                  e.target.style.borderColor = G.accent;
                  e.target.style.boxShadow = "0 3px 10px rgba(0, 113, 227, 0.08)";
                }}
                onBlur={e => {
                  e.target.style.background = "rgba(0,0,0,0.02)";
                  e.target.style.borderColor = "rgba(0,0,0,0.06)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </form>

            {todosPendientes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                {todosPendientes.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                      background: "rgba(0,0,0,0.012)", border: "1px solid rgba(0,0,0,0.03)",
                      borderRadius: 12, transition: "all 0.2s"
                    }}
                  >
                    {/* Checkbox Circular */}
                    <button
                      onClick={() => onToggle(item.id)}
                      style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: `2px solid ${item.hecho ? G.accent : "rgba(0,0,0,0.2)"}`,
                        background: item.hecho ? G.accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#ffffff", flexShrink: 0,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      {item.hecho && <Icon.check />}
                    </button>

                    <div 
                      onClick={() => onOpenDrawer({ type: "task_detail", data: item })}
                      style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: G.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.texto}
                      </span>
                      <span style={{ fontSize: 10, color: G.textTertiary }}>⚡</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "20px 12px", background: "rgba(0,0,0,0.01)", borderRadius: 16, border: "1px dashed rgba(0,0,0,0.05)",
                textAlign: "center", color: G.textSecondary, fontSize: 11.5, lineHeight: 1.4
              }}>
                🌟 No registra pendientes para hoy. Escriba arriba para crear uno al instante.
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: IA, Finanzas, Hábitos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* WIDGET RESUMEN COGNITIVO IA (MemoryOrb Siri) */}
          <Card glowColor={G.accentGlow} style={{ borderRadius: 24, padding: "20px", position: "relative", overflow: "hidden", cursor: "pointer" }}
            onClick={() => onOpenDrawer({ type: "ia_chat" })} hover
          >
            <div className="bg-radial-glow" />
            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <MemoryOrb state="idle" />
              <div style={{ fontSize: 11, color: G.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, marginTop: 4 }}>
                Asistente Cognitivo IA <span>↗</span>
              </div>
              <p style={{ fontSize: 12.5, color: G.textSecondary, lineHeight: 1.5, marginTop: 4 }}>
                {dynamicSummary} <span style={{ color: G.accent, fontWeight: 700 }}>Haga clic para chatear.</span>
              </p>
            </div>
          </Card>

          {/* WIDGET HABIT TRACKER (Brite Style) */}
          <Card style={{ borderRadius: 24, padding: "20px" }} hover>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: G.green, display: "flex" }}>✨</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: G.textPrimary }}>Hábitos del Día</span>
              </div>
              <span style={{ fontSize: 10, color: G.green, fontWeight: 700, textTransform: "uppercase" }}>
                Brite Tracker
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {habits.map(habit => {
                const completedPct = Math.round((habit.completado / habit.total) * 100);
                const isFinished = habit.completado >= habit.total;
                return (
                  <div
                    key={habit.id}
                    onClick={() => onIncrementHabit(habit.id)}
                    style={{
                      padding: "10px 12px",
                      background: isFinished ? G.greenSoft : "rgba(0,0,0,0.015)",
                      border: `1px solid ${isFinished ? G.green + "40" : "rgba(0,0,0,0.05)"}`,
                      borderRadius: 16,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1.5px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 16 }}>{habit.icono}</span>
                      <span style={{ 
                        fontSize: 9, 
                        fontWeight: 800, 
                        color: isFinished ? G.green : G.textTertiary,
                        background: isFinished ? "rgba(52, 199, 89, 0.15)" : "rgba(0,0,0,0.05)",
                        padding: "2px 6px",
                        borderRadius: 8
                      }}>
                        {habit.completado}/{habit.total}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {habit.nombre}
                    </span>
                    {/* Barra de progreso sutil */}
                    <div style={{ width: "100%", height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ 
                        width: `${completedPct}%`, 
                        height: "100%", 
                        background: isFinished ? G.green : G.accent,
                        borderRadius: 2,
                        transition: "width 0.3s"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* WIDGET APPLE CARD DE FINANZAS */}
          <div style={{
            background: "linear-gradient(135deg, #1d1d1f 0%, #434343 100%)",
            color: "#ffffff", borderRadius: 24, padding: "24px", position: "relative", overflow: "hidden",
            boxShadow: "0 10px 24px rgba(0, 0, 0, 0.12)", display: "flex", flexDirection: "column", height: 140,
            justifyContent: "space-between", cursor: "pointer", transition: "all 0.3s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
          onClick={() => onOpenDrawer({ type: "finance_detail" })}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)",
              pointerEvents: "none"
            }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  Apple Card Corporativa
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, color: "#ffffff" }}>
                  Cerebro Card <span>↗</span>
                </div>
              </div>
              <div style={{
                width: 28, height: 20, background: "linear-gradient(135deg, #e1e1e4 0%, #a1a1a6 100%)",
                borderRadius: 4, position: "relative", border: "1px solid rgba(255,255,255,0.2)"
              }}>
                <div style={{ position: "absolute", inset: 3, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 2 }} />
              </div>
            </div>

            <div style={{ zIndex: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                ${totalGastos.toLocaleString("es-CO")} <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>COP</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2, fontSize: 8.5, color: "rgba(255,255,255,0.5)" }}>
              <span>TITULAR: JAVIER OSPINA</span>
              <span style={{ fontWeight: 800, color: "#ffffff" }}>DEBITO</span>
            </div>
          </div>

          {/* WIDGET DIARIO DE REFLEXIONES / BLOC (Brite Diary) */}
          <Card style={{ borderRadius: 24, padding: "20px", display: "flex", flexDirection: "column", gap: 10 }} hover>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>✍️ Diario & Notas Rápidas</span>
              <span style={{ fontSize: 9, color: G.textTertiary, fontWeight: 800, textTransform: "uppercase" }}>
                Auto-Guardado
              </span>
            </div>
            <textarea
              value={diario}
              onChange={e => setDiario(e.target.value)}
              placeholder="Escriba aquí sus reflexiones del día, notas espontáneas de reuniones o ideas de fachada digital..."
              style={{
                width: "100%",
                height: 70,
                borderRadius: 14,
                padding: "10px 12px",
                fontSize: 11.5,
                lineHeight: 1.4,
                background: "rgba(0,0,0,0.015)",
                border: "1px solid rgba(0,0,0,0.05)",
                color: G.textSecondary,
                resize: "none",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={e => {
                e.target.style.background = "#ffffff";
                e.target.style.borderColor = G.accent;
              }}
              onBlur={e => {
                e.target.style.background = "rgba(0,0,0,0.015)";
                e.target.style.borderColor = "rgba(0,0,0,0.05)";
              }}
            />
          </Card>

        </div>
      </div>
    </div>
  );
}

// ── Vista OFFICE ───────────────────────────────────────────────────────────
// ── Destinos disponibles desde la Cesta ───────────────────────────────────────
const DESTINOS = [
  { id: "hoy",    label: "Hoy",         color: G.amber,  bg: G.amberSoft,  icon: "☀️" },
  { id: "semana", label: "Esta semana", color: G.accent, bg: G.accentSoft, icon: "📅" },
  { id: "hecho",  label: "Completado",  color: G.green,  bg: G.greenSoft,  icon: "✅" },
];

// ── Tarjeta de tarea con botones de movimiento ─────────────────────────────────
function TaskCard({ item, colId, onMover, onEdit, onDelete, compact = false }) {
  const isDone = colId === "hecho";
  const fecha = item.fecha ? new Date(item.fecha + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : null;
  const hora = item.datos?.hora || null;
  const vencida = item.fecha && !isDone && new Date(item.fecha + "T23:59:59") < new Date();

  return (
    <Card hover style={{ padding: compact ? "10px 12px" : "14px 16px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? 12 : 13, fontWeight: 600, lineHeight: 1.4,
            textDecoration: isDone ? "line-through" : "none",
            color: isDone ? G.textTertiary : G.textPrimary,
          }}>
            {item.datos?.titulo || item.texto}
          </div>
          {item.datos?.descripcion && !compact && (
            <div style={{ fontSize: 11, color: G.textSecondary, marginTop: 3, lineHeight: 1.3 }}>
              {item.datos.descripcion}
            </div>
          )}
          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Tag color={TIPO_META[item.tipo]?.color}>{TIPO_META[item.tipo]?.label}</Tag>
            {fecha && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
                background: vencida ? G.coralSoft : "rgba(0,0,0,0.04)",
                color: vencida ? G.coral : G.textTertiary,
              }}>
                {vencida ? "⚠ " : ""}{fecha}{hora ? ` · ${hora}` : ""}
              </span>
            )}
            {!fecha && <span style={{ fontSize: 10, color: G.textTertiary }}>{timeAgo(item.creado)}</span>}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <button onClick={() => onEdit(item)} title="Editar"
            style={{ color: G.textTertiary, padding: 5, borderRadius: 6, transition: "all 0.2s", display: "flex", alignItems: "center" }}
            onMouseEnter={e => { e.currentTarget.style.color = G.accent; e.currentTarget.style.background = G.accentSoft; }}
            onMouseLeave={e => { e.currentTarget.style.color = G.textTertiary; e.currentTarget.style.background = "transparent"; }}
          ><Icon.edit /></button>
          <button onClick={() => onDelete(item.id)} title="Eliminar"
            style={{ color: G.textTertiary, padding: 5, borderRadius: 6, transition: "all 0.2s", display: "flex", alignItems: "center" }}
            onMouseEnter={e => { e.currentTarget.style.color = G.coral; e.currentTarget.style.background = G.coralSoft; }}
            onMouseLeave={e => { e.currentTarget.style.color = G.textTertiary; e.currentTarget.style.background = "transparent"; }}
          ><Icon.trash /></button>
        </div>
      </div>

      {/* Botones de destino */}
      {!isDone && (
        <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
          {DESTINOS.filter(d => d.id !== colId).map(d => (
            <button key={d.id} onClick={() => onMover(item.id, d.id)}
              style={{
                fontSize: 10, fontWeight: 700, color: d.color,
                border: `1px solid ${d.color}30`,
                borderRadius: 8, padding: "4px 9px",
                background: d.bg,
                display: "flex", alignItems: "center", gap: 4,
                transition: "all 0.18s", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = d.color; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = d.bg; e.currentTarget.style.color = d.color; }}
            >
              {d.icon} {d.label}
            </button>
          ))}
          {colId !== "cesta" && (
            <button onClick={() => onMover(item.id, "cesta")}
              style={{
                fontSize: 10, fontWeight: 700, color: G.textTertiary,
                border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "4px 9px",
                background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 3,
                transition: "all 0.18s", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            >
              ↩ Cesta
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function ViewOffice({ items, onToggle, onDelete, onOpenDrawer }) {
  const tareas = items.filter(i => i.tipo === "tarea" || i.tipo === "recordatorio");

  const [columnas, setColumnas] = useState(() => {
    const m = {};
    tareas.forEach(t => { m[t.id] = t.columna || (t.hecho ? "hecho" : "cesta"); });
    return m;
  });

  useEffect(() => {
    const m = {};
    tareas.forEach(t => { m[t.id] = t.columna || (t.hecho ? "hecho" : "cesta"); });
    setColumnas(m);
  }, [items.length]);

  function moverA(id, col) {
    setColumnas(prev => ({ ...prev, [id]: col }));
  }

  const cestaItems  = tareas.filter(t => (columnas[t.id] || "cesta") === "cesta");
  const hoyItems    = tareas.filter(t => columnas[t.id] === "hoy");
  const semanaItems = tareas.filter(t => columnas[t.id] === "semana");
  const hechoItems  = tareas.filter(t => columnas[t.id] === "hecho");

  const totalActivas = hoyItems.length + semanaItems.length;

  function editItem(item) {
    onOpenDrawer && onOpenDrawer({ type: "task_detail", data: item });
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── CESTA DE TAREAS ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧺</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: G.textPrimary, margin: 0 }}>
                Cesta de Tareas
              </h2>
              <p style={{ fontSize: 11, color: G.textTertiary, margin: 0 }}>
                {cestaItems.length} sin asignar · asigna cada tarea a su destino
              </p>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {DESTINOS.map(d => (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 20,
                background: d.bg, border: `1px solid ${d.color}25`,
                fontSize: 11, fontWeight: 700, color: d.color,
              }}>
                {d.icon} {d.label}
                <span style={{ background: d.color, color: "#fff", borderRadius: 10,
                  padding: "0px 5px", fontSize: 9, fontWeight: 800 }}>
                  {d.id === "hoy" ? hoyItems.length : d.id === "semana" ? semanaItems.length : hechoItems.length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {cestaItems.length === 0 ? (
          <div style={{
            border: `2px dashed rgba(0,0,0,0.06)`, borderRadius: 16,
            padding: "36px 20px", textAlign: "center",
            background: "rgba(0,0,0,0.01)",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: G.textSecondary }}>Cesta vacía — todo está asignado</div>
            <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 4 }}>Captura nuevas tareas desde el asistente</div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 16,
            padding: 14,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {cestaItems.map(item => (
              <TaskCard key={item.id} item={item} colId="cesta"
                onMover={moverA} onEdit={editItem} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* ── COLUMNAS DESTINO ────────────────────────────────────────────── */}
      {tareas.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.textTertiary,
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Tablero de trabajo · {totalActivas} activa{totalActivas !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {DESTINOS.map(col => {
              const colItems = col.id === "hoy" ? hoyItems : col.id === "semana" ? semanaItems : hechoItems;
              return (
                <div key={col.id}>
                  {/* Header columna */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 7, marginBottom: 10,
                    padding: "7px 10px", borderRadius: 10,
                    background: col.bg, border: `1px solid ${col.color}20`,
                  }}>
                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: col.color, flex: 1 }}>{col.label}</span>
                    <span style={{
                      background: col.color, color: "#fff", borderRadius: 10,
                      padding: "0 7px", fontSize: 10, fontWeight: 800,
                    }}>{colItems.length}</span>
                  </div>

                  {/* Tarjetas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {colItems.map(item => (
                      <TaskCard key={item.id} item={item} colId={col.id}
                        onMover={moverA} onEdit={editItem} onDelete={onDelete} compact />
                    ))}
                    {colItems.length === 0 && (
                      <div style={{
                        border: `1.5px dashed ${col.color}30`, borderRadius: 10, height: 60,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: col.bg,
                      }}>
                        <span style={{ fontSize: 11, color: col.color, fontWeight: 500, opacity: 0.5 }}>vacío</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tareas.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px", color: G.textTertiary,
          border: `1px dashed ${G.border}`, borderRadius: 16,
        }}>
          Sin tareas aún — captura algo con el asistente 👇
        </div>
      )}
    </div>
  );
}

// ── Vista PARK (burbujas + gastos + notas) ─────────────────────────────────
function ViewPark({ items, onDelete, onOpenDrawer }) {
  const bubbleNames = [...new Set(items.map(i => i.datos?.burbuja).filter(Boolean))];
  const [activeBubble, setActiveBubble] = useState(null);
  const gastos = items.filter(i => i.tipo === "gasto");
  const notas = items.filter(i => i.tipo === "nota");
  const totalGastos = gastos.reduce((s, g) => s + (Number(g.datos?.monto) || 0), 0);

  const bubbleItems = activeBubble
    ? items.filter(i => i.datos?.burbuja === activeBubble)
    : [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, letterSpacing: "-0.03em", color: G.textPrimary }}>Notas</h2>

      {/* Burbujas */}
      {bubbleNames.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: G.textTertiary, fontWeight: 600, marginBottom: 12, letterSpacing: "0.05em" }}>BURBUJAS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {bubbleNames.map(b => {
              const isActive = activeBubble === b;
              return (
                <button
                   key={b}
                   onClick={() => setActiveBubble(isActive ? null : b)}
                   style={{
                     background: isActive ? G.green : G.greenSoft,
                     color: isActive ? "#ffffff" : G.green,
                     border: `1px solid ${isActive ? G.green : "rgba(52, 199, 89, 0.2)"}`,
                     borderRadius: 20, padding: "6px 14px",
                     fontSize: 13, fontWeight: 600, transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                     boxShadow: isActive ? `0 2px 8px rgba(52, 199, 89, 0.15)` : "none",
                     transform: isActive ? "scale(1.03)" : "scale(1)"
                   }}
                >
                  🌿 {b}
                </button>
              );
            })}
          </div>
          {activeBubble && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.3s ease" }}>
              {bubbleItems.map(item => (
                <Card 
                  key={item.id} 
                  hover 
                  style={{ padding: "12px 14px", cursor: "pointer" }}
                  onClick={() => onOpenDrawer && onOpenDrawer({ type: "task_detail", data: item })}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: G.textPrimary }}>{item.datos?.titulo || item.texto}</div>
                      {item.datos?.descripcion && <div style={{ fontSize: 12, color: G.textSecondary, marginTop: 4 }}>{item.datos.descripcion}</div>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      style={{ color: G.textTertiary, padding: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = G.coral}
                      onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
                    >
                      <Icon.trash />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gastos */}
      {gastos.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: G.textTertiary, fontWeight: 600, letterSpacing: "0.05em" }}>GASTOS</div>
            <div 
              style={{
                fontSize: 13, fontWeight: 700, color: G.coral,
                background: G.coralSoft, border: `1px solid rgba(255, 59, 48, 0.15)`,
                padding: "4px 10px", borderRadius: 20, cursor: "pointer"
              }}
              onClick={() => onOpenDrawer && onOpenDrawer({ type: "finance_detail", data: gastos })}
            >
              Total: ${totalGastos.toLocaleString("es-CO")} COP
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gastos.map(g => (
              <Card 
                key={g.id} 
                hover 
                style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => onOpenDrawer && onOpenDrawer({ type: "finance_detail", data: gastos })}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.textPrimary }}>{g.datos?.titulo || g.texto}</div>
                  <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 4 }}>{g.datos?.categoria} · {timeAgo(g.creado)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {g.datos?.monto && (
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: G.coral,
                    }}>${Number(g.datos.monto).toLocaleString("es-CO")} COP</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(g.id);
                    }}
                    style={{ color: G.textTertiary, padding: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = G.coral}
                    onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
                  >
                    <Icon.trash />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {notas.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: G.textTertiary, fontWeight: 600, marginBottom: 12, letterSpacing: "0.05em" }}>NOTAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {notas.map(n => (
              <Card 
                key={n.id} 
                hover
                style={{ padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 100, cursor: "pointer" }}
                onClick={() => onOpenDrawer && onOpenDrawer({ type: "task_detail", data: n })}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.textPrimary, lineHeight: 1.4, marginBottom: 4 }}>{n.datos?.titulo || n.texto}</div>
                  {n.datos?.descripcion && <div style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.3 }}>{n.datos.descripcion}</div>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 10, color: G.textTertiary, fontWeight: 500 }}>{timeAgo(n.creado)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(n.id);
                    }}
                    style={{ color: G.textTertiary, padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = G.coral}
                    onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
                  >
                    <Icon.trash />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {items.filter(i => i.tipo === "nota" || i.tipo === "gasto" || i.datos?.burbuja).length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px", color: G.textTertiary, fontSize: 14,
          border: `1px dashed ${G.border}`, borderRadius: 16, background: "rgba(0, 0, 0, 0.01)"
        }}>
          Notas está vacío — captura notas, gastos y burbujas abajo 🌿
        </div>
      )}
    </div>
  );
}

// ── ActionCard ─────────────────────────────────────────────────────────────
function ActionCard({ accion }) {
  if (!accion || !accion.tipo || accion.tipo === "null") return null;

  function ejecutar() {
    if (accion.tipo === "enviar_correo") {
      const to = accion.destinatario_email || "";
      const su = encodeURIComponent(accion.asunto || "");
      const body = encodeURIComponent(accion.mensaje || "");
      window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${su}&body=${body}`, "_blank");
    } else if (accion.tipo === "enviar_whatsapp") {
      const num = (accion.destinatario_whatsapp || accion.destinatario_telefono || "").replace(/\D/g, "");
      const msg = encodeURIComponent(accion.mensaje || "");
      window.open(`https://api.whatsapp.com/send?phone=${num}&text=${msg}`, "_blank");
    } else if (accion.tipo === "llamar") {
      const tel = accion.destinatario_telefono || accion.destinatario_whatsapp || "";
      window.location.href = `tel:${tel}`;
    } else if (accion.tipo === "abrir_url" && accion.url) {
      window.open(accion.url, "_blank");
    }
  }

  const ICONS = {
    enviar_correo:    { icon: "✉️", label: "Abrir Gmail",   color: "#ea4335", bg: "rgba(234,67,53,0.08)"  },
    enviar_whatsapp:  { icon: "💬", label: "WhatsApp",      color: "#25d366", bg: "rgba(37,211,102,0.08)" },
    llamar:           { icon: "📞", label: "Llamar",        color: "#34c759", bg: "rgba(52,199,89,0.08)"  },
    abrir_url:        { icon: "🔗", label: "Abrir enlace",  color: "#0071e3", bg: "rgba(0,113,227,0.08)"  },
  };
  const meta = ICONS[accion.tipo] || { icon: "⚡", label: "Ejecutar", color: "#0071e3", bg: "rgba(0,113,227,0.08)" };

  return (
    <div style={{
      marginTop: 8, padding: "8px 10px",
      background: meta.bg, borderRadius: 10,
      border: `1px solid ${meta.color}22`,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      {accion.destinatario_nombre && (
        <div style={{ fontSize: 10, fontWeight: 600, color: meta.color, opacity: 0.8 }}>
          {meta.icon} Para: {accion.destinatario_nombre}
        </div>
      )}
      {accion.asunto && (
        <div style={{ fontSize: 10, color: "#515154", opacity: 0.9 }}>
          📌 {accion.asunto}
        </div>
      )}
      {accion.mensaje && (
        <div style={{
          fontSize: 10, color: "#515154", lineHeight: 1.4,
          maxHeight: 48, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          {accion.mensaje}
        </div>
      )}
      <button
        onClick={ejecutar}
        style={{
          marginTop: 2, padding: "5px 12px",
          background: meta.color, color: "#fff",
          border: "none", borderRadius: 8,
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          alignSelf: "flex-start",
          boxShadow: `0 2px 8px ${meta.color}33`,
        }}
      >
        {meta.icon} {meta.label}
      </button>
    </div>
  );
}

// ── Vista Contactos ────────────────────────────────────────────────────────
function ViewContactos({ contactos, setContactos, darkMode = false }) {
  const [form, setForm] = useState({ nombre: "", empresa: "", cargo: "", email: "", telefono: "", whatsapp: "", notas: "" });
  const [search, setSearch] = useState("");
  const [editando, setEditando] = useState(null); // id del contacto en edición
  const [expandido, setExpandido] = useState(null);

  const FORM_FIELDS = [
    { key: "nombre",   label: "Nombre completo", required: true },
    { key: "empresa",  label: "Empresa / Organización" },
    { key: "cargo",    label: "Cargo / Rol" },
    { key: "email",    label: "Correo electrónico" },
    { key: "telefono", label: "Teléfono" },
    { key: "whatsapp", label: "WhatsApp (con código país)" },
    { key: "notas",    label: "Notas internas" },
  ];

  const filtrados = contactos.filter(c =>
    !search || [c.nombre, c.empresa, c.cargo, c.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function guardar() {
    if (!form.nombre.trim()) return;
    if (editando) {
      setContactos(prev => prev.map(c => c.id === editando ? { ...c, ...form } : c));
      setEditando(null);
    } else {
      setContactos(prev => [{ id: Math.random().toString(36).slice(2,9), ...form }, ...prev]);
    }
    setForm({ nombre: "", empresa: "", cargo: "", email: "", telefono: "", whatsapp: "", notas: "" });
  }

  function editar(c) {
    setForm({ nombre: c.nombre||"", empresa: c.empresa||"", cargo: c.cargo||"", email: c.email||"", telefono: c.telefono||"", whatsapp: c.whatsapp||"", notas: c.notas||"" });
    setEditando(c.id);
    setExpandido(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function eliminar(id) {
    setContactos(prev => prev.filter(c => c.id !== id));
    if (expandido === id) setExpandido(null);
  }

  function cancelar() {
    setForm({ nombre: "", empresa: "", cargo: "", email: "", telefono: "", whatsapp: "", notas: "" });
    setEditando(null);
  }

  const avatar = (c) => {
    const initial = (c.nombre || "?")[0].toUpperCase();
    const colors = ["#0071e3","#5e5ce6","#34c759","#ff9500","#ff3b30","#30b0c7"];
    const idx = c.nombre?.charCodeAt(0) % colors.length || 0;
    return { initial, color: colors[idx] };
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 24 }}>

      {/* Formulario lateral */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{
          background: G.surface, borderRadius: 16, padding: 20,
          border: `1px solid ${G.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)", position: "sticky", top: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary, marginBottom: 14 }}>
            {editando ? "✏ Editar contacto" : "+ Nuevo contacto"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FORM_FIELDS.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontWeight: 600, color: G.textTertiary, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {f.label}{f.required && <span style={{ color: G.coral }}> *</span>}
                </div>
                {f.key === "notas" ? (
                  <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    rows={2}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${G.border}`, background: G.surface, color: G.textPrimary, fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" }} />
                ) : (
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && guardar()}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${G.border}`, background: G.surface, color: G.textPrimary, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={guardar}
              style={{ flex: 1, padding: "9px 0", background: form.nombre.trim() ? G.accent : "rgba(0,0,0,0.06)",
                color: form.nombre.trim() ? "#fff" : G.textTertiary, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: form.nombre.trim() ? "pointer" : "default",
                boxShadow: form.nombre.trim() ? "0 4px 12px rgba(0,113,227,0.2)" : "none" }}>
              {editando ? "Guardar cambios" : "Guardar"}
            </button>
            {editando && (
              <button onClick={cancelar}
                style={{ padding: "9px 14px", background: "rgba(0,0,0,0.04)", border: "none", borderRadius: 10, fontSize: 12, color: G.textSecondary, cursor: "pointer" }}>
                Cancelar
              </button>
            )}
          </div>
          {contactos.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${G.border}`, fontSize: 11, color: G.textTertiary, textAlign: "center" }}>
              {contactos.length} contacto{contactos.length !== 1 ? "s" : ""} · Sincronizados con el Asistente Personal
            </div>
          )}
        </div>
      </div>

      {/* Lista de contactos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa o correo…"
          style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${G.border}`,
            background: G.surface, fontSize: 13, outline: "none", boxSizing: "border-box",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 16 }} />

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: G.textTertiary }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: G.textSecondary, marginBottom: 6 }}>
              {search ? "Sin resultados" : "Sin contactos aún"}
            </div>
            <div style={{ fontSize: 12 }}>
              {search ? "Pruebe con otro término" : "Agregue contactos para que el Asistente pueda enviar correos y mensajes automáticamente"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map(c => {
            const av = avatar(c);
            const isOpen = expandido === c.id;
            return (
              <div key={c.id}
                style={{ background: G.surface, borderRadius: 14, border: `1px solid ${G.border}`,
                  boxShadow: isOpen ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
                  overflow: "hidden", transition: "box-shadow 0.2s" }}>

                {/* Cabecera del contacto */}
                <div onClick={() => setExpandido(isOpen ? null : c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: av.color, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800, color: "#fff" }}>
                    {av.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary }}>
                      {c.nombre}
                    </div>
                    {(c.empresa || c.cargo) && (
                      <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 1 }}>
                        {[c.cargo, c.empresa].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                      {c.email    && <span style={{ fontSize: 10, color: "#ea4335", fontWeight: 500 }}>✉ {c.email}</span>}
                      {c.telefono && <span style={{ fontSize: 10, color: G.green,   fontWeight: 500 }}>📞 {c.telefono}</span>}
                      {c.whatsapp && <span style={{ fontSize: 10, color: "#25d366", fontWeight: 500 }}>💬 {c.whatsapp}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: G.textTertiary, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </div>

                {/* Panel expandido */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${G.border}`, padding: "14px 16px 16px" }}>
                    {c.notas && (
                      <div style={{ fontSize: 12, color: G.textSecondary, background: G.accentSoft, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontStyle: "italic" }}>
                        📝 {c.notas}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {c.email && (
                        <button onClick={() => window.open(`https://mail.google.com/mail/?view=cm&to=${c.email}`, "_blank")}
                          style={{ padding: "7px 14px", background: "rgba(234,67,53,0.08)", color: "#ea4335", border: "1px solid rgba(234,67,53,0.15)", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          ✉ Gmail
                        </button>
                      )}
                      {(c.whatsapp || c.telefono) && (
                        <button onClick={() => {
                          const num = (c.whatsapp || c.telefono).replace(/\D/g, "");
                          window.open(`https://api.whatsapp.com/send?phone=${num}`, "_blank");
                        }}
                          style={{ padding: "7px 14px", background: "rgba(37,211,102,0.08)", color: "#25d366", border: "1px solid rgba(37,211,102,0.15)", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          💬 WhatsApp
                        </button>
                      )}
                      {c.telefono && (
                        <button onClick={() => { window.location.href = `tel:${c.telefono}`; }}
                          style={{ padding: "7px 14px", background: G.greenSoft, color: G.green, border: `1px solid rgba(52,199,89,0.15)`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          📞 Llamar
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <button onClick={() => editar(c)}
                        style={{ padding: "7px 14px", background: G.accentSoft, color: G.accent, border: `1px solid rgba(0,113,227,0.15)`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Editar
                      </button>
                      <button onClick={() => eliminar(c.id)}
                        style={{ padding: "7px 14px", background: G.coralSoft, color: G.coral, border: `1px solid rgba(255,59,48,0.15)`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Barra de captura + chat ────────────────────────────────────────────────
function CaptureBar({ onCaptura, messages, isLoading }) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [ripple, setRipple] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function handleSend() {
    if (!texto.trim()) return;
    onCaptura(texto.trim());
    setTexto("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleVoz() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }
    if (grabando) {
      recognitionRef.current?.stop();
      setGrabando(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "es-CO";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTexto(t);
      setGrabando(false);
    };
    r.onerror = () => setGrabando(false);
    r.onend = () => setGrabando(false);
    r.start();
    recognitionRef.current = r;
    setGrabando(true);
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Chat history */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: 260, overflowY: "auto", marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 10,
          paddingRight: 4,
        }}>
          {messages.map((m, i) => (
            <div key={i} className="slide-in" style={{
              display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "linear-gradient(135deg, #0071e3, #0084ff)" : "rgba(235, 235, 240, 0.85)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: m.role === "user" ? "none" : "1px solid rgba(0, 0, 0, 0.04)",
                fontSize: 13, color: m.role === "user" ? "#ffffff" : G.textPrimary,
                lineHeight: 1.5,
                boxShadow: m.role === "user" ? `0 2px 8px rgba(0, 113, 227, 0.15)` : "0 2px 8px rgba(0, 0, 0, 0.02)",
              }}>
                {m.role === "assistant" && m.tipo && m.tipo !== "chat" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Tag color={TIPO_META[m.tipo]?.color}>{TIPO_META[m.tipo]?.label} guardado</Tag>
                  </div>
                )}
                {m.content}
                {m.role === "assistant" && m.accion && <ActionCard accion={m.accion} />}
                <div style={{ fontSize: 9, color: m.role === "user" ? "rgba(255,255,255,0.7)" : G.textTertiary, marginTop: 6, textAlign: "right", fontWeight: 500 }}>
                  {fmtTime(m.time)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", animation: "pulse 1.5s infinite" }}>
              <Spinner />
              <span style={{ fontSize: 12, color: G.textTertiary, fontWeight: 500 }}>Procesando con Cerebro...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="glass-input" style={{
        display: "flex", alignItems: "center", gap: 10,
        borderRadius: 20, padding: "6px 8px 6px 12px",
      }}>
        {/* Botón voz */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {grabando && (
            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: G.coralSoft, animation: "ripple 1s ease-out infinite",
            }} />
          )}
          <button onClick={toggleVoz} style={{
            width: 38, height: 38, borderRadius: "50%", position: "relative",
            background: grabando ? G.coral : G.accentSoft,
            color: grabando ? "white" : G.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: `1px solid ${grabando ? G.coral : "rgba(0, 113, 227, 0.12)"}`,
            boxShadow: grabando ? "0 0 15px rgba(255, 59, 48, 0.35)" : "none",
          }}>
            <Icon.mic />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={texto}
          onChange={e => { setTexto(e.target.value); autoResize(e.target); }}
          onKeyDown={handleKey}
          placeholder={grabando ? "Escuchando…" : "Escribe o habla — tarea, gasto, nota…"}
          rows={1}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: G.textPrimary, fontSize: 13.5, resize: "none",
            lineHeight: 1.5, overflowY: "hidden",
            padding: "8px 0",
            fontWeight: 400,
          }}
        />

        <button
          onClick={handleSend}
          disabled={!texto.trim() || isLoading}
          style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: texto.trim() ? G.accent : "rgba(0,0,0,0.03)",
            color: texto.trim() ? "white" : G.textTertiary,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: `1px solid ${texto.trim() ? G.accent : "rgba(0,0,0,0.05)"}`,
            boxShadow: texto.trim() ? "0 4px 12px rgba(0, 113, 227, 0.2)" : "none",
            transform: texto.trim() ? "scale(1.02)" : "scale(1)",
          }}
        >
          {isLoading ? <Spinner /> : <Icon.send />}
        </button>
      </div>

      {grabando && (
        <div style={{ textAlign: "center", fontSize: 11, color: G.coral, marginTop: 8, fontWeight: 600, animation: "pulse 1.2s ease infinite", letterSpacing: "0.03em" }}>
          🎤 ESCUCHANDO... HABLE CON FUERZA
        </div>
      )}
    </div>
  );
}

// ── AI Chat Sidebar ─────────────────────────────────────────────────────────

function AIChatSidebar({ messages, onCaptura, isLoading }) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }

  function handleSend() {
    if (!texto.trim()) return;
    onCaptura(texto.trim());
    setTexto("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleVoz() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }
    if (grabando) {
      recognitionRef.current?.stop();
      setGrabando(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "es-CO";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => { setTexto(e.results[0][0].transcript); setGrabando(false); };
    r.onerror = () => setGrabando(false);
    r.onend = () => setGrabando(false);
    r.start();
    recognitionRef.current = r;
    setGrabando(true);
  }

  return (
    <div className="ai-sidebar" style={{ animation: "slideInSidebar 0.32s cubic-bezier(0.16,1,0.3,1)" }}>
      {/* Header */}
      <div style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.6)",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <AsistenteAvatar size={36} state={isLoading ? "thinking" : "idle"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.01em" }}>
            Asistente Cognitivo
          </div>
          <div style={{ fontSize: 10, color: isLoading ? G.accent : G.green, fontWeight: 600 }}>
            {isLoading ? "Procesando…" : "● En línea"}
          </div>
        </div>
      </div>

      {/* Messages scroll area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 12px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 8,
            color: G.textTertiary, textAlign: "center", padding: "0 16px",
          }}>
            <AsistenteAvatar size={48} state="idle" />
            <div style={{ fontSize: 12, fontWeight: 600, color: G.textSecondary }}>
              Buenos días, Ing. Ospina
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>
              Listo para asistirle. Capture tareas, notas, gastos o simplemente consulte.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="slide-in" style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "88%", padding: "9px 12px",
              borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
              background: m.role === "user"
                ? "linear-gradient(135deg, #0071e3, #0084ff)"
                : "rgba(235,235,240,0.9)",
              border: m.role === "user" ? "none" : "1px solid rgba(0,0,0,0.04)",
              fontSize: 12, color: m.role === "user" ? "#fff" : G.textPrimary,
              lineHeight: 1.5,
              boxShadow: m.role === "user"
                ? "0 2px 8px rgba(0,113,227,0.15)"
                : "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              {m.role === "assistant" && m.tipo && m.tipo !== "chat" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, marginBottom: 5,
                  fontSize: 10, fontWeight: 700, color: G.accent,
                }}>
                  <span style={{
                    background: G.accentSoft, border: `1px solid rgba(0,113,227,0.12)`,
                    borderRadius: 6, padding: "1px 6px",
                  }}>
                    {m.tipo === "tarea" ? "✓ Tarea" : m.tipo === "nota" ? "✏ Nota" : m.tipo === "gasto" ? "$ Gasto" : m.tipo === "recordatorio" ? "🔔 Recordatorio" : m.tipo}
                  </span>
                </div>
              )}
              {m.content}
              {m.role === "assistant" && m.accion && <ActionCard accion={m.accion} />}
              {m.time && (
                <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4, textAlign: "right" }}>
                  {new Date(m.time).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: "10px 12px 14px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.6)",
        flexShrink: 0,
      }}>
        {grabando && (
          <div style={{
            textAlign: "center", fontSize: 10, color: G.coral,
            marginBottom: 6, fontWeight: 600, animation: "pulse 1.2s ease infinite",
          }}>
            🎤 ESCUCHANDO…
          </div>
        )}
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 6,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14, padding: "8px 10px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => { setTexto(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKey}
            placeholder="Mensaje al Asistente…"
            rows={1}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", resize: "none",
              fontSize: 12, color: G.textPrimary,
              lineHeight: 1.5, fontFamily: "Inter",
              overflowY: "hidden",
            }}
          />
          <button
            onClick={toggleVoz}
            style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: grabando ? G.coral : "rgba(0,0,0,0.04)",
              color: grabando ? "white" : G.textTertiary,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", transition: "all 0.2s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 19v4M8 23h8" />
            </svg>
          </button>
          <button
            onClick={handleSend}
            disabled={!texto.trim() || isLoading}
            style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: texto.trim() ? G.accent : "rgba(0,0,0,0.04)",
              color: texto.trim() ? "white" : G.textTertiary,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", transition: "all 0.2s",
              boxShadow: texto.trim() ? "0 3px 10px rgba(0,113,227,0.25)" : "none",
            }}
          >
            {isLoading ? <Spinner /> : <Icon.send />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Components for RightDrawer (Brite inspired) ───────────────────────────

function TaskDetailEditor({ item, items, setItems, onDelete, onClose }) {
  const [titulo, setTitulo] = useState(item.datos?.titulo || item.texto);
  const [desc, setDesc] = useState(item.datos?.descripcion || "");
  const [tipo, setTipo] = useState(item.tipo);
  const [columna, setColumna] = useState(item.columna || "cesta");
  const [hecho, setHecho] = useState(!!item.hecho);
  const [fecha, setFecha] = useState(item.fecha ? item.fecha.slice(0, 10) : "");
  const [hora, setHora] = useState(item.datos?.hora || "");
  const [recordatorio, setRecordatorio] = useState(item.datos?.recordatorio || "none");

  const handleSave = () => {
    setItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          tipo,
          texto: titulo,
          hecho,
          fecha: fecha || null,
          columna: hecho ? "hecho" : (columna === "hecho" ? "cesta" : columna),
          datos: {
            ...i.datos,
            titulo,
            descripcion: desc,
            hora: hora || null,
            recordatorio,
          }
        };
      }
      return i;
    }));
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>TÍTULO</label>
        <input 
          type="text" 
          value={titulo} 
          onChange={e => setTitulo(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
            fontSize: 13, color: G.textPrimary, outline: "none"
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>DESCRIPCIÓN</label>
        <textarea 
          value={desc} 
          onChange={e => setDesc(e.target.value)}
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
            fontSize: 13, color: G.textPrimary, outline: "none", resize: "none",
            lineHeight: 1.4
          }}
          placeholder="Añada una descripción detallada..."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>TIPO</label>
          <select 
            value={tipo} 
            onChange={e => setTipo(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
              fontSize: 13, color: G.textPrimary, outline: "none"
            }}
          >
            <option value="tarea">Tarea</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="nota">Nota</option>
            <option value="burbuja">Burbuja</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>ESTADO / COLUMNA</label>
          <select 
            value={columna} 
            onChange={e => setColumna(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
              fontSize: 13, color: G.textPrimary, outline: "none"
            }}
          >
            <option value="cesta">Cesta de Tareas</option>
            <option value="semana">Esta Semana</option>
            <option value="hoy">Hoy</option>
            <option value="hecho">Hecho</option>
          </select>
        </div>
      </div>

      {/* Fecha y Hora */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>FECHA</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)", background: "#ffffff",
              fontSize: 13, color: G.textPrimary, outline: "none",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>HORA</label>
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)", background: "#ffffff",
              fontSize: 13, color: G.textPrimary, outline: "none",
            }}
          />
        </div>
      </div>

      {/* Recordatorio */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>
          🔔 RECORDATORIO (El Asistente le avisará)
        </label>
        <select
          value={recordatorio}
          onChange={e => setRecordatorio(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${recordatorio !== "none" ? G.accent : "rgba(0,0,0,0.12)"}`,
            background: recordatorio !== "none" ? G.accentSoft : "#ffffff",
            fontSize: 13, color: G.textPrimary, outline: "none",
            fontWeight: recordatorio !== "none" ? 600 : 400,
          }}
        >
          <option value="none">Sin recordatorio</option>
          <option value="0">En el momento exacto</option>
          <option value="15">15 minutos antes</option>
          <option value="30">30 minutos antes</option>
          <option value="60">1 hora antes</option>
          <option value="120">2 horas antes</option>
          <option value="1440">1 día antes</option>
          <option value="2880">2 días antes</option>
        </select>
        {recordatorio !== "none" && fecha && (
          <div style={{ fontSize: 10, color: G.accent, marginTop: 6, fontWeight: 600 }}>
            ✓ El Asistente le notificará {recordatorio === "0" ? "al momento de la tarea" : `${recordatorio === "1440" ? "1 día" : recordatorio === "2880" ? "2 días" : recordatorio + " minutos"} antes`}
            {hora ? ` (${hora})` : ""} el {fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) : ""}
          </div>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "12px",
        background: "rgba(0, 0, 0, 0.02)", borderRadius: 10, border: "1px solid rgba(0, 0, 0, 0.03)",
        marginTop: 4
      }}>
        <input
          type="checkbox"
          checked={hecho}
          onChange={e => setHecho(e.target.checked)}
          style={{ width: 16, height: 16, cursor: "pointer" }}
          id="chk-hecho"
        />
        <label htmlFor="chk-hecho" style={{ fontSize: 13, fontWeight: 600, color: G.textSecondary, cursor: "pointer" }}>
          Marcar como Completada
        </label>
      </div>

      <div style={{ fontSize: 11, color: G.textTertiary, marginTop: 4 }}>
        Creado el: {new Date(item.creado).toLocaleString("es-CO")}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: G.accent, color: "#ffffff", fontWeight: 600, fontSize: 13,
            boxShadow: `0 4px 12px rgba(0, 113, 227, 0.15)`,
            textAlign: "center"
          }}
        >
          Guardar Cambios
        </button>
        <button
          onClick={() => {
            onDelete(item.id);
            onClose();
          }}
          style={{
            padding: "12px 16px", borderRadius: 12,
            background: G.coralSoft, color: G.coral, fontWeight: 600, fontSize: 13,
            border: `1px solid rgba(255, 59, 48, 0.12)`, display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <Icon.trash />
        </button>
      </div>
    </div>
  );
}

function CalendarConnector({
  googleConnected,
  googleConnectedEmail,
  setGoogleConnected,
  setGoogleConnectedEmail,
  onConnectGoogle
}) {
  const [emailInput, setEmailInput] = useState(googleConnectedEmail || "");
  const [step, setStep] = useState(googleConnected ? 3 : 1);
  const [subTab, setSubTab] = useState("calendar"); // "calendar" | "gmail"
  const wsData = getDynamicWorkspaceData(googleConnectedEmail);

  // Sincronizar estados locales con las propiedades del componente padre
  useEffect(() => {
    setStep(googleConnected ? 3 : 1);
  }, [googleConnected]);

  useEffect(() => {
    setEmailInput(googleConnectedEmail || "");
  }, [googleConnectedEmail]);

  const handleSimulateSync = () => {
    if (!emailInput.includes("@")) {
      alert("Por favor, ingrese una dirección de correo válida.");
      return;
    }
    setGoogleConnected(true);
    setGoogleConnectedEmail(emailInput);
    localStorage.setItem("cerebro_google_connected", "true");
    localStorage.setItem("cerebro_google_email", emailInput);
    setStep(3);
  };

  const handleDisconnect = () => {
    setGoogleConnected(false);
    setGoogleConnectedEmail("");
    localStorage.setItem("cerebro_google_connected", "false");
    localStorage.setItem("cerebro_google_email", "");
    setEmailInput("");
    setStep(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {step === 1 && (
        <>
          <div style={{
            background: "rgba(0, 113, 227, 0.03)", border: `1px solid rgba(0, 113, 227, 0.08)`,
            borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 10
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: G.accent }}>🔌 Conector Universal de Google</h4>
            <p style={{ fontSize: 11.5, color: G.textSecondary, lineHeight: 1.4, margin: 0 }}>
              Este conector no está limitado a un Workspace específico. Puede vincular **cualquier correo** de Google (cuenta personal <code>@gmail.com</code> o correo corporativo G-Suite).
            </p>
            <ol style={{ fontSize: 11, color: G.textSecondary, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 4, lineHeight: 1.3, margin: 0 }}>
              <li>Escriba su dirección de correo preferida abajo.</li>
              <li>El sistema iniciará el flujo OAuth 2.0 estándar para esa cuenta específica.</li>
              <li>La IA extraerá de inmediato alertas sismorresistentes, gastos y vuelos para <strong>ese correo</strong>.</li>
            </ol>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>DIRECCIÓN DE CORREO DE GOOGLE</label>
            <input 
              type="email" 
              placeholder="ingrese.su.correo@gmail.com"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
                fontSize: 13, color: G.textPrimary, outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: G.textTertiary, letterSpacing: "0.03em" }}>O SELECCIONE UNA SUGERENCIA:</div>
            {[
              { name: "Suelos y Estructuras (Real)", email: "suelosyestructuras@gmail.com", initials: "SE", color: "#34c759" },
              { name: "Javier Ospina (Construito)", email: "javier.ospina@construito.co", initials: "JO", color: G.accent },
              { name: "Javier Ospina (Personal)", email: "javier.ospina.design@gmail.com", initials: "JP", color: "#e100ff" }
            ].map((sug, i) => (
              <div
                key={i}
                onClick={() => setEmailInput(sug.email)}
                style={{
                  border: `1px solid ${emailInput === sug.email ? G.accent : "rgba(0,0,0,0.06)"}`,
                  background: emailInput === sug.email ? G.accentSoft : "rgba(255,255,255,0.8)",
                  padding: "8px 10px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left"
                }}
                onMouseEnter={e => { if (emailInput !== sug.email) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={e => { if (emailInput !== sug.email) e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: sug.color, color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700
                }}>
                  {sug.initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>{sug.name}</span>
                  <span style={{ fontSize: 8.5, color: G.textTertiary }}>{sug.email}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={!emailInput || !emailInput.includes("@")}
            onClick={() => {
              setGoogleConnectedEmail(emailInput);
              setStep(2);
            }}
            style={{
              padding: "12px", borderRadius: 12,
              background: (emailInput && emailInput.includes("@")) ? G.accent : "rgba(0,0,0,0.05)",
              color: (emailInput && emailInput.includes("@")) ? "#ffffff" : G.textTertiary,
              fontWeight: 600, fontSize: 13, textAlign: "center",
              boxShadow: (emailInput && emailInput.includes("@")) ? `0 4px 12px rgba(0, 113, 227, 0.15)` : "none",
              border: "none", cursor: (emailInput && emailInput.includes("@")) ? "pointer" : "default"
            }}
          >
            Iniciar Conexión OAuth
          </button>
        </>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "rgba(0, 113, 227, 0.02)", border: `1px solid ${G.accent}20`,
            borderRadius: 12, padding: "14px", textAlign: "center"
          }}>
            <span style={{ fontSize: 32 }}>🔐</span>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: G.textPrimary, marginTop: 8 }}>Google Account Sign-In</h4>
            <p style={{ fontSize: 12, color: G.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
              Autorización segura de solo lectura para sincronización automática de agendas y bandeja de entrada.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>DIRECCIÓN DE CORREO</label>
            <input 
              type="email" 
              placeholder="ejemplo@gmail.com"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
                fontSize: 13, color: G.textPrimary, outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
                fontSize: 12, fontWeight: 600, background: "transparent", cursor: "pointer"
              }}
            >
              Atrás
            </button>
            <button
              onClick={handleSimulateSync}
              style={{
                flex: 2, padding: "10px", borderRadius: 10, background: G.green, color: "#ffffff",
                fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                boxShadow: `0 4px 10px rgba(52,199,89,0.15)`
              }}
            >
              Autorizar e Importar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Banner Principal */}
          <div style={{
            background: "rgba(52, 199, 89, 0.05)", border: `1px solid rgba(52, 199, 89, 0.15)`,
            borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 12
          }}>
            <div style={{ fontSize: 24 }}>✨</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: G.green }}>¡Workspace Conectado!</div>
              <div style={{ fontSize: 11, color: G.textSecondary, marginTop: 2 }}>{googleConnectedEmail || emailInput}</div>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 600, color: G.coral,
                textDecoration: "underline", padding: "4px", background: "none", border: "none", cursor: "pointer"
              }}
            >
              Desconectar
            </button>
          </div>

          {/* Sub-Tabs Selector */}
          <div style={{
            display: "flex",
            background: "rgba(0,0,0,0.03)",
            borderRadius: 10,
            padding: 4,
            gap: 4
          }}>
            <button
              onClick={() => setSubTab("calendar")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                background: subTab === "calendar" ? "#ffffff" : "transparent",
                color: subTab === "calendar" ? G.textPrimary : G.textSecondary,
                boxShadow: subTab === "calendar" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
              }}
            >
              📅 Agenda (Calendar)
            </button>
            <button
              onClick={() => setSubTab("gmail")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                background: subTab === "gmail" ? "#ffffff" : "transparent",
                color: subTab === "gmail" ? G.textPrimary : G.textSecondary,
                boxShadow: subTab === "gmail" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
              }}
            >
              📧 Gmail (Extractores)
            </button>
          </div>

          {/* Calendario Activo */}
          {subTab === "calendar" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.textTertiary, letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>AGENDA DE HOY (IMPORTADA)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {wsData.calendar.map((ev, i) => (
                  <div key={i} style={{
                    padding: "12px", background: "#ffffff", borderRadius: 10,
                    border: "1px solid rgba(0, 0, 0, 0.04)", borderLeft: `3px solid ${G.accent}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: G.accent }}>{ev.time}</span>
                      <span style={{ fontSize: 9, color: G.textTertiary }}>Google Calendar</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: G.textPrimary, marginTop: 4 }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: G.textSecondary, marginTop: 2 }}>📍 {ev.loc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bandeja de Entrada Gmail Inteligente */}
          {subTab === "gmail" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.textTertiary, letterSpacing: "0.05em", textTransform: "uppercase" }}>CORREOS DETECTADOS POR IA</div>
              
              <div style={{
                background: "rgba(0,113,227,0.03)",
                border: "1px solid rgba(0,113,227,0.08)",
                padding: "8px 10px",
                borderRadius: 10,
                fontSize: 9.5,
                color: G.textSecondary,
                lineHeight: 1.3
              }}>
                ℹ️ <strong>Asistente Personal:</strong> Escanea automáticamente su bandeja de entrada de Google en segundo plano y extrae información crítica sin interrumpir su flujo.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {wsData.gmail.map((m, i) => (
                  <div key={i} style={{
                    padding: "12px", background: "#ffffff", borderRadius: 12,
                    border: "1px solid rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", gap: 6,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: G.textSecondary, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {m.sender}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary, marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {m.subj}
                        </div>
                      </div>
                      <div style={{
                        padding: "3px 6px", borderRadius: 6, background: m.badgeBg, color: m.badgeColor,
                        fontSize: 8.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0
                      }}>
                        {m.badgeText}
                      </div>
                    </div>
                    
                    <p style={{ fontSize: 10, color: G.textSecondary, margin: 0, lineHeight: 1.3 }}>
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RightDrawer({
  isOpen,
  type,
  data,
  onClose,
  items,
  setItems,
  onDelete,
  onCaptura,
  messages,
  isLoading,
  googleConnected,
  googleConnectedEmail,
  setGoogleConnected,
  setGoogleConnectedEmail,
  onConnectGoogle
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(10px)"
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: G.textPrimary }}>
              {type === "ia_chat" && "Asistente Cognitivo"}
              {type === "task_detail" && "Detalles de la Tarea"}
              {type === "calendar_detail" && "Google Workspace Sync"}
              {type === "finance_detail" && "Resumen Financiero"}
            </h3>
            <p style={{ fontSize: 11, color: G.textTertiary, marginTop: 2 }}>
              {type === "ia_chat" && "Interacción inteligente por voz y texto"}
              {type === "task_detail" && "Inspeccione y modifique atributos"}
              {type === "calendar_detail" && "Conecte y administre su Workspace"}
              {type === "finance_detail" && "Detalle corporativo de egresos"}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: G.textSecondary, transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0, 0, 0, 0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)"}
          >
            <Icon.x />
          </button>
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {type === "ia_chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 20 }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "20px 0", gap: 10, background: "rgba(0, 113, 227, 0.03)", borderRadius: 16,
                border: "1px solid rgba(0, 113, 227, 0.08)"
              }}>
                <AsistenteAvatar size={60} state={isLoading ? "thinking" : "idle"} />
                <div style={{ fontSize: 12, fontWeight: 600, color: G.accent }}>
                  {isLoading ? "Cerebro pensando…" : "Asistente Inteligente Activo"}
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 250, display: "flex", flexDirection: "column" }}>
                <CaptureBar onCaptura={onCaptura} messages={messages} isLoading={isLoading} />
              </div>
            </div>
          )}

          {type === "task_detail" && data && (
            <TaskDetailEditor item={data} items={items} setItems={setItems} onDelete={onDelete} onClose={onClose} />
          )}

          {type === "calendar_detail" && (
            <CalendarConnector 
              googleConnected={googleConnected}
              googleConnectedEmail={googleConnectedEmail}
              setGoogleConnected={setGoogleConnected}
              setGoogleConnectedEmail={setGoogleConnectedEmail}
              onConnectGoogle={onConnectGoogle}
            />
          )}

          {type === "finance_detail" && (
            <FinanceLedger items={items} setItems={setItems} onDelete={onDelete} />
          )}
        </div>
      </div>
    </>
  );
}

// ── ContactosPanel ─────────────────────────────────────────────────────────
function ContactosPanel() {
  const [lista, setLista] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cerebro_contactos") || "[]"); } catch { return []; }
  });
  const [form, setForm] = useState({ nombre: "", empresa: "", email: "", telefono: "", whatsapp: "" });

  function guardar() {
    if (!form.nombre.trim()) return;
    const nuevo = { id: Math.random().toString(36).slice(2,9), ...form };
    const updated = [nuevo, ...lista];
    setLista(updated);
    localStorage.setItem("cerebro_contactos", JSON.stringify(updated));
    setForm({ nombre: "", empresa: "", email: "", telefono: "", whatsapp: "" });
  }

  function eliminar(id) {
    const updated = lista.filter(c => c.id !== id);
    setLista(updated);
    localStorage.setItem("cerebro_contactos", JSON.stringify(updated));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>
        Agenda de Contactos · El Asistente los conoce
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(0,113,227,0.04)", borderRadius: 10, padding: 12, border: "1px solid rgba(0,113,227,0.1)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#0071e3", marginBottom: 2 }}>NUEVO CONTACTO</div>
        {[
          { key: "nombre", placeholder: "Nombre completo *" },
          { key: "empresa", placeholder: "Empresa / Rol" },
          { key: "email", placeholder: "Email" },
          { key: "telefono", placeholder: "Teléfono (+57...)" },
          { key: "whatsapp", placeholder: "WhatsApp (+57...)" },
        ].map(f => (
          <input key={f.key} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, outline: "none" }} />
        ))}
        <button onClick={guardar} style={{ padding: "7px 14px", background: "#0071e3", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
          + Guardar contacto
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
        {lista.length === 0 && (
          <div style={{ fontSize: 11, color: "#86868b", textAlign: "center", padding: "20px 0" }}>
            Sin contactos aún. Agréguelos para que el Asistente pueda enviar correos y WhatsApps automáticamente.
          </div>
        )}
        {lista.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f" }}>{c.nombre}</div>
              {c.empresa && <div style={{ fontSize: 10, color: "#515154" }}>{c.empresa}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                {c.email && <span style={{ fontSize: 10, color: "#ea4335" }}>✉️ {c.email}</span>}
                {c.telefono && <span style={{ fontSize: 10, color: "#34c759" }}>📞 {c.telefono}</span>}
                {c.whatsapp && <span style={{ fontSize: 10, color: "#25d366" }}>💬 {c.whatsapp}</span>}
              </div>
            </div>
            <button onClick={() => eliminar(c.id)} style={{ background: "none", border: "none", color: "#ff3b30", cursor: "pointer", fontSize: 14, padding: 2 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Standalone GeneralConfigModal Component ───────────────────────────────

function GeneralConfigModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  tempKey,
  setTempKey,
  personality,
  setPersonality,
  googleConnected,
  setGoogleConnected,
  googleConnectedEmail,
  setGoogleConnectedEmail,
  googleScopes,
  setGoogleScopes,
  outlookConnected,
  setOutlookConnected,
  configTab,
  setConfigTab,
  simulatingConnection,
  setSimulatingConnection,
  simulatingStep,
  setSimulatingStep,
  googleConnectionMethod,
  setGoogleConnectionMethod
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 20, width: "100%", maxWidth: 420,
        padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", gap: 16,
        position: "relative", overflow: "hidden"
      }}>
        {/* Pantalla de Permisos / Éxito Simulado */}
        {simulatingConnection && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 20, zIndex: 2100,
            padding: 24, display: "flex", flexDirection: "column",
            justifyContent: "space-between", animation: "fadeIn 0.3s ease",
            color: G.textPrimary
          }}>
            {simulatingConnection === "google" ? (
              <>
                {/* PASO 1: Selección de Método de Conexión */}
                {simulatingStep === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 10 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.31 7.56 8.9 5.04 12 5.04z" />
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.58v2.98h3.84c2.24-2.06 3.58-5.1 3.58-8.66z" />
                          <path fill="#FBBC05" d="M5.35 10.63C5.11 11.37 5 12.17 5 13s.11 1.63.35 2.37l-3.96 3.07C.51 16.89 0 14.99 0 13s.51-3.89 1.39-5.44l3.96 3.07z" />
                          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.1 0-5.69-2.52-6.65-5.59L1.39 15.74C3.37 19.63 7.35 23 12 23z" />
                        </svg>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>Google Workspace Integration</span>
                      </div>
                      
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.02em", marginBottom: 4 }}>
                          Conectar Google Workspace
                        </h4>
                        <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4 }}>
                          Seleccione el método para autorizar la lectura de su agenda y correspondencia de forma segura:
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                        <div
                          onClick={() => setGoogleConnectionMethod("oauth")}
                          style={{
                            border: `2px solid ${googleConnectionMethod === "oauth" ? G.accent : "rgba(0,0,0,0.06)"}`,
                            background: googleConnectionMethod === "oauth" ? G.accentSoft : "rgba(255,255,255,0.5)",
                            padding: 12, borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                            display: "flex", gap: 10, alignItems: "flex-start"
                          }}
                        >
                          <div style={{ marginTop: 2 }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${googleConnectionMethod === "oauth" ? G.accent : "rgba(0,0,0,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {googleConnectionMethod === "oauth" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent }} />}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>OAuth 2.0 Directo (Recomendado)</div>
                            <div style={{ fontSize: 9, color: G.textSecondary, marginTop: 2, lineHeight: 1.3 }}>Inicie sesión con su cuenta de Google y otorgue permisos en un solo paso. Rápido y totalmente seguro.</div>
                          </div>
                        </div>

                        <div
                          onClick={() => setGoogleConnectionMethod("service_account")}
                          style={{
                            border: `2px solid ${googleConnectionMethod === "service_account" ? G.accent : "rgba(0,0,0,0.06)"}`,
                            background: googleConnectionMethod === "service_account" ? G.accentSoft : "rgba(255,255,255,0.5)",
                            padding: 12, borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                            display: "flex", gap: 10, alignItems: "flex-start"
                          }}
                        >
                          <div style={{ marginTop: 2 }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${googleConnectionMethod === "service_account" ? G.accent : "rgba(0,0,0,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {googleConnectionMethod === "service_account" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent }} />}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>Cuenta de Servicio (Empresarial)</div>
                            <div style={{ fontSize: 9, color: G.textSecondary, marginTop: 2, lineHeight: 1.3 }}>Cargue su archivo JSON de credenciales de API para integraciones dedicadas en servidores.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => setSimulatingStep(2)}
                        style={{
                          flex: 1, padding: "10px 14px", borderRadius: 10,
                          background: G.accent, color: "#ffffff", fontSize: 11, fontWeight: 700,
                          boxShadow: `0 4px 12px ${G.accentGlow}`, transition: "transform 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        Siguiente paso
                      </button>
                      <button
                        onClick={() => {
                          setSimulatingConnection(null);
                          setSimulatingStep(1);
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: 10,
                          background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                          fontSize: 11, fontWeight: 600
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 2: Selección de Cuenta (Estilo Google Selector) */}
                {simulatingStep === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" style={{ marginBottom: 4 }}>
                        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.31 7.56 8.9 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.58v2.98h3.84c2.24-2.06 3.58-5.1 3.58-8.66z" />
                        <path fill="#FBBC05" d="M5.35 10.63C5.11 11.37 5 12.17 5 13s.11 1.63.35 2.37l-3.96 3.07C.51 16.89 0 14.99 0 13s.51-3.89 1.39-5.44l3.96 3.07z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.1 0-5.69-2.52-6.65-5.59L1.39 15.74C3.37 19.63 7.35 23 12 23z" />
                      </svg>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.02em" }}>
                        Conectar su cuenta de Google
                      </h4>
                      <p style={{ fontSize: 11, color: G.textSecondary, marginTop: -4 }}>
                        para continuar en Cerebro Personal
                      </p>

                      <div style={{ width: "100%", textAlign: "left", marginTop: 8 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>DIRECCIÓN DE CORREO DE GOOGLE</label>
                        <input
                          type="email"
                          placeholder="ingrese.su.correo@gmail.com"
                          value={googleConnectedEmail || ""}
                          onChange={(e) => setGoogleConnectedEmail(e.target.value)}
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 10,
                            border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
                            fontSize: 12.5, color: G.textPrimary, outline: "none"
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: G.textTertiary, textAlign: "left" }}>O SELECCIONE UNA SUGERENCIA:</div>
                        {[
                          { name: "Suelos y Estructuras (Real)", email: "suelosyestructuras@gmail.com", initials: "SE", color: "#34c759" },
                          { name: "Javier Ospina (Construito)", email: "javier.ospina@construito.co", initials: "JO", color: G.accent },
                          { name: "Javier Ospina (Personal)", email: "javier.ospina.design@gmail.com", initials: "JP", color: "#e100ff" }
                        ].map((sug, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setGoogleConnectedEmail(sug.email);
                            }}
                            style={{
                              border: `1px solid ${googleConnectedEmail === sug.email ? G.accent : "rgba(0,0,0,0.06)"}`,
                              background: googleConnectedEmail === sug.email ? G.accentSoft : "rgba(255,255,255,0.8)",
                              padding: "8px 10px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                              display: "flex", alignItems: "center", gap: 10, textAlign: "left"
                            }}
                            onMouseEnter={e => { if (googleConnectedEmail !== sug.email) e.currentTarget.style.background = "#f2f2f7"; }}
                            onMouseLeave={e => { if (googleConnectedEmail !== sug.email) e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
                          >
                            <div style={{
                              width: 24, height: 24, borderRadius: "50%", background: sug.color, color: "#ffffff",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700
                            }}>
                              {sug.initials}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>{sug.name}</span>
                              <span style={{ fontSize: 8.5, color: G.textTertiary }}>{sug.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <button
                        onClick={() => setSimulatingStep(1)}
                        style={{ fontSize: 11, color: G.accent, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                      >
                        ← Volver
                      </button>
                      <button
                        disabled={!googleConnectedEmail || !googleConnectedEmail.includes("@")}
                        onClick={() => setSimulatingStep(3)}
                        style={{
                          padding: "8px 16px", borderRadius: 8,
                          background: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? G.accent : "rgba(0,0,0,0.05)",
                          color: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? "#ffffff" : G.textTertiary,
                          fontSize: 11, fontWeight: 700, border: "none", cursor: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? "pointer" : "default"
                        }}
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 3: Consentimiento de Permisos Detallados (Inspirado en Foto 1) */}
                {simulatingStep === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto", paddingRight: 4 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 9, color: G.textTertiary, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Google Consent System</span>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                        Selecciona los servicios a los que puede acceder Cerebro Personal
                      </h4>
                    </div>

                    {/* Caja de Advertencia e Información de Google */}
                    <div style={{
                      background: G.amberSoft,
                      border: `1px solid ${G.amber}`,
                      borderRadius: 10,
                      padding: 8,
                      fontSize: 9,
                      color: "#b26600",
                      lineHeight: 1.3
                    }}>
                      <strong>🔒 Privacidad & Control:</strong> Si permites que Cerebro Personal acceda a tus datos de Google Workspace, Google te pedirá que revises periódicamente el acceso de esta app para asegurar su protección. Puedes revocar este acceso en cualquier momento.
                    </div>

                    {/* Checklist de Permisos */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(0,0,0,0.02)", padding: 10, borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <input
                          type="checkbox"
                          checked={googleScopes.calendar}
                          disabled
                          style={{ accentColor: G.accent, marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>Ver, editar, compartir y borrar calendarios (Google Calendar)</div>
                          <div style={{ fontSize: 8, color: G.textSecondary, marginTop: 1 }}>Requerido para la sincronización del Dashboard ejecutivo.</div>
                        </div>
                      </div>

                      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={googleScopes.gmail}
                          onChange={(e) => setGoogleScopes(prev => ({ ...prev, gmail: e.target.checked }))}
                          style={{ accentColor: G.accent, marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>Leer, redactar y borrar correos de Gmail</div>
                          <div style={{ fontSize: 8, color: G.textSecondary, marginTop: 1 }}>Permite a la IA escanear recibos, vuelos y alertas de bandeja de entrada.</div>
                        </div>
                      </label>

                      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={googleScopes.drive}
                          onChange={(e) => setGoogleScopes(prev => ({ ...prev, drive: e.target.checked }))}
                          style={{ accentColor: G.accent, marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>Ver, editar y borrar archivos en Google Drive</div>
                          <div style={{ fontSize: 8, color: G.textSecondary, marginTop: 1 }}>Para escanear informes estructurales y documentos vinculados.</div>
                        </div>
                      </label>

                      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={googleScopes.tasks}
                          onChange={(e) => setGoogleScopes(prev => ({ ...prev, tasks: e.target.checked }))}
                          style={{ accentColor: G.accent, marginTop: 2 }}
                        />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>Crear, organizar y borrar tareas (Google Tasks)</div>
                          <div style={{ fontSize: 8, color: G.textSecondary, marginTop: 1 }}>Sincroniza su Kanban de oficina con su lista de tareas móviles.</div>
                        </div>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => {
                          setGoogleConnected(true);
                          setSimulatingStep(4);
                        }}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          background: G.accent, color: "#ffffff", fontSize: 10, fontWeight: 700,
                          border: "none", boxShadow: `0 3px 8px ${G.accentGlow}`
                        }}
                      >
                        Permitir Acceso
                      </button>
                      <button
                        onClick={() => setSimulatingStep(2)}
                        style={{
                          padding: "8px 12px", borderRadius: 8,
                          background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                          fontSize: 10, fontWeight: 600
                        }}
                      >
                        Atrás
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 4: Éxito & Orb de Sincronización */}
                {simulatingStep === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", height: "100%", justifyContent: "center" }}>
                    <div style={{ position: "relative", width: 78, height: 78, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* Anillo de Sincronización Giratorio */}
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        border: "3px solid transparent", borderTopColor: G.green,
                        borderRightColor: G.accent, animation: "spin 2s linear infinite"
                      }} />
                      <div style={{
                        width: 62, height: 62, borderRadius: "50%",
                        background: "linear-gradient(135deg, #34c759 0%, #0071e3 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, color: "#ffffff", boxShadow: `0 10px 24px rgba(52, 199, 89, 0.25)`,
                        animation: "floatOrb 3s ease-in-out infinite"
                      }}>
                        ✓
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.02em", marginBottom: 6 }}>
                        ¡Sincronización Completada!
                      </h3>
                      <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4, padding: "0 8px" }}>
                        Ing. Ospina, me he conectado exitosamente a su cuenta <strong>{googleConnectedEmail}</strong>.
                      </p>
                      <div style={{
                        fontSize: 9, color: G.green, background: G.greenSoft, border: `1px solid ${G.green}`,
                        padding: "4px 8px", borderRadius: 8, display: "inline-block", marginTop: 8, fontWeight: 700
                      }}>
                        Google Calendar Sincronizado en Tiempo Real
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSimulatingConnection(null);
                        setSimulatingStep(1);
                        onClose();
                      }}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 10,
                        background: "linear-gradient(135deg, #0071e3 0%, #34c759 100%)",
                        color: "#ffffff", fontSize: 11, fontWeight: 700, border: "none",
                        boxShadow: "0 4px 12px rgba(0, 113, 227, 0.2)", marginTop: 6
                      }}
                    >
                      Ver mi Agenda en el Dashboard
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Cuentas de Outlook */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#0078D4"/>
                    <path d="M5 8H19V17H5V8Z" fill="white"/>
                    <path d="M5 8L12 12.5L19 8V9.5L12 14L5 9.5V8Z" fill="#50E6FF"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Microsoft Azure AD</span>
                </div>

                {simulatingStep === 1 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em", marginBottom: 4 }}>
                        Microsoft 365 solicita permisos
                      </h4>
                      <p style={{ fontSize: 11, color: G.textSecondary }}>
                        Permitirá a la IA escanear y organizar sus eventos y correos de Outlook:
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked disabled style={{ accentColor: G.accent }} />
                        <span>Sincronizar correos de Outlook</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked disabled style={{ accentColor: G.accent }} />
                        <span>Sincronizar eventos de Outlook Calendar</span>
                      </label>
                    </div>

                    <p style={{ fontSize: 9, color: G.textTertiary, lineHeight: 1.3 }}>
                      Al hacer clic en Permitir, consientes que Cerebro Personal procese tus datos de forma confidencial.
                    </p>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => {
                          setOutlookConnected(true);
                          setSimulatingStep(2);
                        }}
                        style={{
                          flex: 1, padding: "10px", borderRadius: 10,
                          background: "#0078d4", color: "#ffffff", fontSize: 12, fontWeight: 600, textAlign: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                      >
                        Permitir
                      </button>
                      <button
                        onClick={() => {
                          setSimulatingConnection(null);
                          setSimulatingStep(1);
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: 10,
                          background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                          fontSize: 12, fontWeight: 600
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg, #0078d4 0%, #50e6ff 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, color: "#ffffff", boxShadow: "0 10px 24px rgba(0, 120, 212, 0.25)",
                      animation: "floatOrb 3s ease-in-out infinite"
                    }}>
                      ✓
                    </div>

                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em", marginBottom: 6 }}>
                        ¡Microsoft Conectado!
                      </h3>
                      <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4, padding: "0 8px" }}>
                        Ing. Ospina, me he conectado exitosamente a su cuenta de Microsoft 365 para sincronizar su agenda.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSimulatingConnection(null);
                        setSimulatingStep(1);
                        onClose();
                      }}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 10,
                        background: "#0078d4",
                        color: "#ffffff", fontSize: 12, fontWeight: 700, border: "none",
                        boxShadow: "0 4px 12px rgba(0, 120, 212, 0.2)"
                      }}
                    >
                      Continuar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Encabezado del modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>
            ⚙️ Configuración General
          </span>
          <button
            onClick={onClose}
            style={{
              color: G.textTertiary, padding: 4, borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = G.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
          >
            <Icon.x />
          </button>
        </div>

        {/* Control de Pestañas */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          paddingBottom: 4,
          gap: 8
        }}>
          <button
            onClick={() => setConfigTab("api")}
            style={{
              fontSize: 12,
              fontWeight: configTab === "api" ? 700 : 500,
              color: configTab === "api" ? G.accent : G.textSecondary,
              padding: "6px 12px",
              borderRadius: 8,
              background: configTab === "api" ? G.accentSoft : "transparent",
              transition: "all 0.2s"
            }}
          >
            🔑 Clave API
          </button>
          <button
            onClick={() => setConfigTab("personality")}
            style={{
              fontSize: 12,
              fontWeight: configTab === "personality" ? 700 : 500,
              color: configTab === "personality" ? G.accent : G.textSecondary,
              padding: "6px 12px",
              borderRadius: 8,
              background: configTab === "personality" ? G.accentSoft : "transparent",
              transition: "all 0.2s"
            }}
          >
            👤 Personalidad
          </button>
          <button
            onClick={() => setConfigTab("connections")}
            style={{
              fontSize: 12,
              fontWeight: configTab === "connections" ? 700 : 500,
              color: configTab === "connections" ? G.accent : G.textSecondary,
              padding: "6px 12px",
              borderRadius: 8,
              background: configTab === "connections" ? G.accentSoft : "transparent",
              transition: "all 0.2s"
            }}
          >
            🔗 Conexiones
          </button>
          <button
            onClick={() => setConfigTab("contactos")}
            style={{
              fontSize: 12,
              fontWeight: configTab === "contactos" ? 700 : 500,
              color: configTab === "contactos" ? G.accent : G.textSecondary,
              padding: "6px 12px",
              borderRadius: 8,
              background: configTab === "contactos" ? G.accentSoft : "transparent",
              transition: "all 0.2s"
            }}
          >
            👥 Contactos
          </button>
        </div>

        {/* Contenido Pestaña API */}
        {configTab === "api" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
            <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.5 }}>
              Ingrese su clave de API de Google AI Studio para activar las funciones de inteligencia artificial de Cerebro Personal de forma directa.
            </p>

            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: "100%", background: "rgba(255, 255, 255, 0.6)",
                  border: `1px solid ${G.border}`,
                  borderRadius: 10, padding: "10px 12px",
                  color: G.textPrimary, fontSize: 13, outline: "none",
                  fontFamily: "Inter",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => {
                  localStorage.setItem("gemini_api_key", tempKey.trim());
                  setApiKey(tempKey.trim());
                  onClose();
                }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  background: G.accent, color: "#ffffff",
                  fontSize: 12, fontWeight: 600, textAlign: "center",
                  boxShadow: `0 2px 8px rgba(0, 113, 227, 0.2)`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                Guardar
              </button>
              {apiKey && (
                <button
                  onClick={() => {
                    localStorage.removeItem("gemini_api_key");
                    setApiKey("");
                    setTempKey("");
                    onClose();
                  }}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: G.coralSoft, color: G.coral,
                    border: `1px solid rgba(255, 59, 48, 0.15)`,
                    fontSize: 12, fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = G.coral;
                    e.currentTarget.style.color = "#ffffff";
                  }}
                >
                  Borrar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contenido Pestaña Personalidad */}
        {configTab === "personality" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4 }}>
              ¿Cómo quieres que me dirija a ti? Modifica el comportamiento e inyección contextual de Cerebro Personal en tiempo real.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 4
            }}>
              {/* Card 1: Entrenador */}
              <div
                onClick={() => setPersonality("entrenador")}
                style={{
                  background: personality === "entrenador" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.50)",
                  border: personality === "entrenador" ? `2px solid ${G.accent}` : "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 14,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  transform: personality === "entrenador" ? "scale(1.02)" : "none",
                  boxShadow: personality === "entrenador" ? "0 4px 12px rgba(0, 113, 227, 0.08)" : "none"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #ff5e62 0%, #ff9966 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "0 4px 8px rgba(255, 94, 98, 0.2)"
                }}>🏃‍♂️</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Entrenador directo</div>
                <div style={{ fontSize: 9, color: G.textTertiary, lineHeight: 1.2 }}>Enérgico y motivador.</div>
              </div>

              {/* Card 2: Copiloto */}
              <div
                onClick={() => setPersonality("copiloto")}
                style={{
                  background: personality === "copiloto" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.50)",
                  border: personality === "copiloto" ? `2px solid ${G.accent}` : "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 14,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  transform: personality === "copiloto" ? "scale(1.02)" : "none",
                  boxShadow: personality === "copiloto" ? "0 4px 12px rgba(0, 113, 227, 0.08)" : "none"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #56ccf2 0%, #2f80ed 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "0 4px 8px rgba(86, 204, 242, 0.2)"
                }}>😌</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Copiloto tranquilo</div>
                <div style={{ fontSize: 9, color: G.textTertiary, lineHeight: 1.2 }}>Empático y de apoyo constante.</div>
              </div>

              {/* Card 3: Profesional */}
              <div
                onClick={() => setPersonality("profesional")}
                style={{
                  background: personality === "profesional" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.50)",
                  border: personality === "profesional" ? `2px solid ${G.accent}` : "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 14,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  transform: personality === "profesional" ? "scale(1.02)" : "none",
                  boxShadow: personality === "profesional" ? "0 4px 12px rgba(0, 113, 227, 0.08)" : "none"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #834d9b 0%, #d04ed6 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "0 4px 8px rgba(131, 77, 155, 0.2)"
                }}>💼</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Profesional eficiente</div>
                <div style={{ fontSize: 9, color: G.textTertiary, lineHeight: 1.2 }}>Ejecutivo, formal y preciso.</div>
              </div>

              {/* Card 4: Minimalista */}
              <div
                onClick={() => setPersonality("minimalista")}
                style={{
                  background: personality === "minimalista" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.50)",
                  border: personality === "minimalista" ? `2px solid ${G.accent}` : "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 14,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  transform: personality === "minimalista" ? "scale(1.02)" : "none",
                  boxShadow: personality === "minimalista" ? "0 4px 12px rgba(0, 113, 227, 0.08)" : "none"
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #3a7bd5 0%, #3a6073 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: "0 4px 8px rgba(58, 123, 213, 0.2)"
                }}>☁️</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Minimalista discreto</div>
                <div style={{ fontSize: 9, color: G.textTertiary, lineHeight: 1.2 }}>Sobrio, ultra-breve y silencioso.</div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Pestaña Conexiones */}
        {configTab === "connections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
            <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4, background: "rgba(0,113,227,0.04)", padding: 8, borderRadius: 10, borderLeft: `3px solid ${G.accent}` }}>
              💬 <strong>ING. OSPINA</strong>... ahora que sé dónde localizarle, solo necesito conectarme a su correo y calendario. Viajes, facturas, reuniones, archivos, enlaces... todo pasa por ahí.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Tarjeta Google */}
              <div style={{
                background: "rgba(255,255,255,0.60)",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 12,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.31 7.56 8.9 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.58v2.98h3.84c2.24-2.06 3.58-5.1 3.58-8.66z" />
                    <path fill="#FBBC05" d="M5.35 10.63C5.11 11.37 5 12.17 5 13s.11 1.63.35 2.37l-3.96 3.07C.51 16.89 0 14.99 0 13s.51-3.89 1.39-5.44l3.96 3.07z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.1 0-5.69-2.52-6.65-5.59L1.39 15.74C3.37 19.63 7.35 23 12 23z" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Google Workspace</div>
                    <div style={{ fontSize: 9, color: G.textTertiary }}>Gmail, Calendar, Drive</div>
                  </div>
                </div>
                {googleConnected ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: G.green, fontWeight: 700 }}>✓ Conectado</span>
                    <button
                      onClick={() => setGoogleConnected(false)}
                      style={{ fontSize: 8, color: G.coral, textDecoration: "underline", padding: 2 }}
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSimulatingConnection("google");
                      setSimulatingStep(1);
                    }}
                    style={{
                      background: G.accentSoft,
                      border: `1px solid ${G.accent}`,
                      color: G.accent,
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  >
                    Conectar
                  </button>
                )}
              </div>

              {/* Tarjeta Outlook */}
              <div style={{
                background: "rgba(255,255,255,0.60)",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 12,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#0078D4"/>
                    <path d="M5 8H19V17H5V8Z" fill="white"/>
                    <path d="M5 8L12 12.5L19 8V9.5L12 14L5 9.5V8Z" fill="#50E6FF"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Microsoft 365</div>
                    <div style={{ fontSize: 9, color: G.textTertiary }}>Outlook Mail & Calendar</div>
                  </div>
                </div>
                {outlookConnected ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: 10, color: G.green, fontWeight: 700 }}>✓ Conectado</span>
                    <button
                      onClick={() => setOutlookConnected(false)}
                      style={{ fontSize: 8, color: G.coral, textDecoration: "underline", padding: 2 }}
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSimulatingConnection("outlook");
                      setSimulatingStep(1);
                    }}
                    style={{
                      background: G.accentSoft,
                      border: `1px solid ${G.accent}`,
                      color: G.accent,
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenido Pestaña Contactos */}
        {configTab === "contactos" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <ContactosPanel />
          </div>
        )}
      </div>
    </div>
  );
}

// ── App principal ──────────────────────────────────────────────────────────
export default function CerebralApp() {
  const [session, setSession]     = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [vista, setVista] = useState("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("cerebro_dark") === "true");

  // G reactivo según el modo
  G = darkMode ? DARK : LIGHT;

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cerebro_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("cerebro_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showConfig, setShowConfig] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [personality, setPersonality] = useState(() => localStorage.getItem("cerebro_personality") || "profesional");
  const [googleConnected, setGoogleConnected] = useState(() => localStorage.getItem("cerebro_google_connected") === "true");
  const [googleConnectedEmail, setGoogleConnectedEmail] = useState(() => localStorage.getItem("cerebro_google_email") || "");

  // Nuevos estados del ecosistema de Brite
  const [mood, setMood] = useState(() => localStorage.getItem("cerebro_mood") || "🎯 Enfocado");
  const [diario, setDiario] = useState(() => localStorage.getItem("cerebro_diario") || "");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null); // null | 'task_detail' | 'calendar_detail' | 'finance_detail' | 'ia_chat'
  const [drawerData, setDrawerData] = useState(null);

  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem("cerebro_habits");
      return saved ? JSON.parse(saved) : [
        { id: "h1", nombre: "Hidratación", completado: 0, total: 4, icono: "💧" },
        { id: "h2", nombre: "Lectura NSR-10", completado: 0, total: 1, icono: "📚" },
        { id: "h3", nombre: "Ejercicio", completado: 0, total: 1, icono: "🏋️" },
        { id: "h4", nombre: "Enfoque Profundo", completado: 0, total: 2, icono: "⚡" }
      ];
    } catch {
      return [
        { id: "h1", nombre: "Hidratación", completado: 0, total: 4, icono: "💧" },
        { id: "h2", nombre: "Lectura NSR-10", completado: 0, total: 1, icono: "📚" },
        { id: "h3", nombre: "Ejercicio", completado: 0, total: 1, icono: "🏋️" },
        { id: "h4", nombre: "Enfoque Profundo", completado: 0, total: 2, icono: "⚡" }
      ];
    }
  });

  // ── Supabase Auth — init de sesión ────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
      if (data.session) initUserData(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        initUserData(s.user.id);
      }
      if (!s) {
        setSyncing(false);
        if (realtimeChannelRef.current) {
          unsubscribeUserData(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      }
    });

    const handleOnline = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.id) {
          flushSyncQueue(data.session.user.id).catch(() => {});
        }
      });
    };
    window.addEventListener("online", handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      if (realtimeChannelRef.current) {
        unsubscribeUserData(realtimeChannelRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Efectos de persistencia para estados de Brite
  useEffect(() => {
    localStorage.setItem("cerebro_mood", mood);
  }, [mood]);

  useEffect(() => {
    localStorage.setItem("cerebro_diario", diario);
  }, [diario]);

  useEffect(() => {
    localStorage.setItem("cerebro_habits", JSON.stringify(habits));
  }, [habits]);

  const [contactos, setContactos] = useState(() => {
    try {
      const saved = localStorage.getItem("cerebro_contactos");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("cerebro_contactos", JSON.stringify(contactos));
  }, [contactos]);

  // ── Supabase — carga inicial y migración ─────────────────────────────────
  async function initUserData(userId) {
    if (initInProgressRef.current) return;
    initInProgressRef.current = true;
    setSyncing(true);
    try {
      await migrateLocalStorageToSupabase(userId);
      const data = await loadAllUserData(userId);

      if (data.items.length)     setItems(data.items);
      if (data.contactos.length) setContactos(data.contactos);
      if (data.messages.length)  setMessages(data.messages);

      if (data.settings) {
        if (data.settings.dark_mode !== undefined) setDarkMode(data.settings.dark_mode);
        if (data.settings.mood)         setMood(data.settings.mood);
        if (data.settings.diario)       setDiario(data.settings.diario);
        if (data.settings.habits)       setHabits(data.settings.habits);
        if (data.settings.personality)  setPersonality(data.settings.personality);
        if (data.settings.google_email) {
          setGoogleConnectedEmail(data.settings.google_email);
          setGoogleConnected(true);
        }
        if (data.settings.gemini_api_key) {
          setApiKey(data.settings.gemini_api_key);
          localStorage.setItem("gemini_api_key", data.settings.gemini_api_key);
        }
      }

      if (realtimeChannelRef.current) unsubscribeUserData(realtimeChannelRef.current);
      realtimeChannelRef.current = subscribeUserData(userId, {
        onItemsChange:     (newItems)     => setItems(newItems),
        onContactosChange: (newContactos) => setContactos(newContactos),
      });

      flushSyncQueue(userId).catch(() => {});
    } catch (err) {
      console.error("[CerebralApp] initUserData error:", err);
      setSyncFailed(true);
    } finally {
      initInProgressRef.current = false;
      setSyncing(false);
    }
  }

  const handleIncrementHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextVal = h.completado >= h.total ? 0 : h.completado + 1;
        return { ...h, completado: nextVal };
      }
      return h;
    }));
  };

  const handleAddItem = (texto, tipo = "tarea") => {
    const newItem = {
      id: uid(),
      tipo: tipo,
      texto: texto,
      datos: {},
      creado: now(),
      hecho: false,
      columna: "cesta",
    };
    setItems(prev => [newItem, ...prev]);
  };

  const handleOpenDrawer = ({ type, data = null }) => {
    setDrawerType(type);
    setDrawerData(data);

    // Briefing automático estilo Asistente Personal al abrir el chat por primera vez
    if (type === "ia_chat" && messages.length === 0) {
      const ahora = new Date();
      const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);
      const hoyStr = ahora.toDateString();
      const mesActual = ahora.toISOString().slice(0, 7);

      const pendientes = items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho);
      const vencidas = pendientes.filter(i => i.fecha && new Date(i.fecha) < hoy);
      const paraHoy = pendientes.filter(i => i.fecha && new Date(i.fecha).toDateString() === hoyStr);
      const gastosMes = items.filter(i => i.tipo === "gasto" && i.creado?.startsWith(mesActual));
      const totalGastos = gastosMes.reduce((s, i) => s + (i.datos?.monto || 0), 0);

      const hora = ahora.getHours();
      const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
      const fmtP = n => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n/1_000)}k` : `$${n}`;

      let texto = `${saludo}, Ing. Ospina.`;
      if (pendientes.length === 0) {
        texto += " Sin tareas pendientes al momento.";
      } else {
        texto += ` Tiene ${pendientes.length} tarea${pendientes.length > 1 ? "s" : ""} activa${pendientes.length > 1 ? "s" : ""}`;
        const alertas = [];
        if (vencidas.length > 0) alertas.push(`${vencidas.length} vencida${vencidas.length > 1 ? "s" : ""}`);
        if (paraHoy.length > 0) alertas.push(`${paraHoy.length} para hoy`);
        if (alertas.length > 0) texto += ` — ${alertas.join(", ")}`;
        texto += ".";
      }
      if (totalGastos > 0) texto += ` Gastos del mes: ${fmtP(totalGastos)} COP.`;
      texto += " ¿En qué le puedo asistir?";

      setMessages([{ role: "assistant", content: texto, tipo: "chat", time: ahora.toISOString() }]);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerType(null);
    setDrawerData(null);
  };

  const [googleScopes, setGoogleScopes] = useState(() => {
    try {
      const saved = localStorage.getItem("cerebro_google_scopes");
      return saved ? JSON.parse(saved) : { calendar: true, gmail: false, drive: false, tasks: false };
    } catch {
      return { calendar: true, gmail: false, drive: false, tasks: false };
    }
  });
  const [googleConnectionMethod, setGoogleConnectionMethod] = useState("oauth"); // 'oauth' | 'service_account'
  const [outlookConnected, setOutlookConnected] = useState(() => localStorage.getItem("cerebro_outlook_connected") === "true");
  const [configTab, setConfigTab] = useState("api"); // 'api' | 'personality' | 'connections'
  const [simulatingConnection, setSimulatingConnection] = useState(null); // 'google' | 'outlook' | null
  const [simulatingStep, setSimulatingStep] = useState(1); // 1: method, 2: email, 3: scopes, 4: success
  const historyRef = useRef([]);
  const realtimeChannelRef = useRef(null);
  const initInProgressRef = useRef(false);

  // Persistir configuración de personalidad en localStorage
  useEffect(() => {
    localStorage.setItem("cerebro_personality", personality);
  }, [personality]);

  // Persistir conexiones de cuentas en localStorage
  useEffect(() => {
    localStorage.setItem("cerebro_google_connected", googleConnected ? "true" : "false");
  }, [googleConnected]);

  // ── Asistente Personal Proactive Notification System ────────────────────────
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  function fmtFecha(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  }

  function enviarNotifBrowser(titulo, cuerpo) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(titulo, { body: cuerpo, icon: "/favicon.ico" });
    }
  }

  function inyectarMensajeAsistente(texto) {
    setMessages(prev => [...prev, {
      role: "assistant", content: texto, tipo: "chat", time: new Date().toISOString()
    }]);
  }

  // Revisar recordatorios individuales de tareas
  function revisarRecordatorios(ahora) {
    const its = itemsRef.current;
    its.forEach(item => {
      if (item.hecho) return;
      if (!item.fecha) return;
      const rec = item.datos?.recordatorio;
      if (!rec || rec === "none") return;

      const horaItem = item.datos?.hora || "09:00";
      const fechaHoraStr = `${item.fecha}T${horaItem}:00`;
      const fechaHora = new Date(fechaHoraStr);
      const diffMin = (fechaHora - ahora) / 60000;
      const minutos = parseInt(rec, 10);

      // Disparar si estamos en la ventana del recordatorio (entre -1 y +1 min)
      if (diffMin >= -1 && diffMin <= minutos + 1 && diffMin <= minutos) {
        const clave = `cerebro_notif_${item.id}_${rec}`;
        if (!localStorage.getItem(clave)) {
          localStorage.setItem(clave, "1");
          const titulo = item.datos?.titulo || item.texto;
          const msg = rec === "0"
            ? `🔔 Ing. Ospina, es el momento de: "${titulo}".`
            : `⏰ Recordatorio: "${titulo}" ${rec === "1440" ? "mañana" : rec === "2880" ? "en 2 días" : `en ${rec} minutos`} a las ${horaItem}.`;
          enviarNotifBrowser("Cerebro Personal — Asistente", msg);
          inyectarMensajeAsistente(msg);
        }
      }
    });
  }

  // Briefing matutino
  function generarBriefingManana(ahora) {
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    const mananaFin = new Date(manana); mananaFin.setHours(23, 59, 59, 999);
    const its = itemsRef.current;
    const tareasManana = its.filter(i => {
      if (i.hecho || (!i.tipo === "tarea" && i.tipo !== "recordatorio")) return false;
      if (!i.fecha) return false;
      const f = new Date(i.fecha + "T12:00:00");
      return f >= manana && f <= mananaFin;
    });
    return tareasManana;
  }

  function generarResumenSemana() {
    const its = itemsRef.current;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 7);
    const completadas = its.filter(i => i.hecho && new Date(i.creado) >= hace7);
    const pendientes = its.filter(i => !i.hecho && (i.tipo === "tarea" || i.tipo === "recordatorio"));
    return { completadas, pendientes };
  }

  useEffect(() => {
    const tick = () => {
      const ahora = new Date();
      const h = ahora.getHours();
      const m = ahora.getMinutes();
      const dia = ahora.getDay(); // 0=dom 1=lun...5=vie 6=sab
      const hoyStr = ahora.toDateString();

      // Revisar recordatorios individuales (cada minuto)
      revisarRecordatorios(ahora);

      // Briefing matutino (8:00 AM)
      if (h === 8 && m === 0) {
        const clave = `cerebro_morning_${hoyStr}`;
        if (!localStorage.getItem(clave)) {
          localStorage.setItem(clave, "1");
          const tareasManana = generarBriefingManana(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1));
          const its = itemsRef.current;
          const pendientes = its.filter(i => !i.hecho && (i.tipo === "tarea" || i.tipo === "recordatorio"));
          const vencidas = pendientes.filter(i => i.fecha && new Date(i.fecha + "T12:00:00") < ahora);
          const paraHoy = pendientes.filter(i => i.fecha && new Date(i.fecha + "T12:00:00").toDateString() === hoyStr);
          let msg = `☀️ Buenos días, Ing. Ospina. Briefing del día:\n`;
          if (paraHoy.length > 0) {
            msg += `📋 Tiene ${paraHoy.length} tarea${paraHoy.length > 1 ? "s" : ""} programada${paraHoy.length > 1 ? "s" : ""} para hoy: ${paraHoy.map(t => `"${t.datos?.titulo || t.texto}"`).join(", ")}.`;
          } else {
            msg += `📋 Sin tareas programadas para hoy.`;
          }
          if (vencidas.length > 0) msg += ` ⚠️ ${vencidas.length} tarea${vencidas.length > 1 ? "s" : ""} vencida${vencidas.length > 1 ? "s" : ""} pendiente${vencidas.length > 1 ? "s" : ""}.`;
          msg += " ¡Buen día!";
          enviarNotifBrowser("☀️ Asistente — Briefing matutino", `${paraHoy.length} tareas hoy. ${vencidas.length > 0 ? vencidas.length + " vencidas." : ""}`);
          inyectarMensajeAsistente(msg);
        }
      }

      // Recordatorio nocturno — resumen de mañana (8:00 PM)
      if (h === 20 && m === 0) {
        const clave = `cerebro_evening_${hoyStr}`;
        if (!localStorage.getItem(clave)) {
          localStorage.setItem(clave, "1");
          const manana = new Date(ahora); manana.setDate(manana.getDate() + 1);
          manana.setHours(0, 0, 0, 0);
          const mananaFin = new Date(manana); mananaFin.setHours(23, 59, 59, 999);
          const its = itemsRef.current;
          const tareasManana = its.filter(i => {
            if (i.hecho) return false;
            if (!i.fecha) return false;
            const f = new Date(i.fecha + "T12:00:00");
            return f >= manana && f <= mananaFin;
          });
          if (tareasManana.length > 0) {
            const lista = tareasManana.map((t, i) => `${i + 1}. "${t.datos?.titulo || t.texto}"${t.datos?.hora ? ` a las ${t.datos.hora}` : ""}`).join("\n");
            const msg = `🌙 Buenas noches, Ing. Ospina. Mañana tiene ${tareasManana.length} tarea${tareasManana.length > 1 ? "s" : ""} programada${tareasManana.length > 1 ? "s" : ""}:\n${lista}\n\nLe recomiendo preparar los materiales necesarios esta noche.`;
            enviarNotifBrowser("🌙 Asistente — Resumen de mañana", `${tareasManana.length} tareas programadas para mañana.`);
            inyectarMensajeAsistente(msg);
          }
        }
      }

      // Resumen semanal (viernes 6:00 PM o domingo 9:00 AM)
      const esResumenSemanal = (dia === 5 && h === 18 && m === 0) || (dia === 0 && h === 9 && m === 0);
      if (esResumenSemanal) {
        const semanaKey = `cerebro_weekend_${ahora.getFullYear()}_${Math.floor(ahora.getDate() / 7)}`;
        if (!localStorage.getItem(semanaKey)) {
          localStorage.setItem(semanaKey, "1");
          const { completadas, pendientes } = generarResumenSemana();
          const proxima = new Date(ahora); proxima.setDate(proxima.getDate() + (dia === 5 ? 3 : 1));
          proxima.setHours(0, 0, 0, 0);
          const proximaFin = new Date(proxima); proximaFin.setDate(proximaFin.getDate() + 7);
          const its = itemsRef.current;
          const proximaSemana = its.filter(i => {
            if (i.hecho || !i.fecha) return false;
            const f = new Date(i.fecha + "T12:00:00");
            return f >= proxima && f < proximaFin;
          });
          let msg = dia === 5
            ? `📊 Ing. Ospina, resumen de cierre de semana:\n`
            : `📋 Ing. Ospina, panorama para la semana entrante:\n`;
          if (completadas.length > 0) msg += `✅ Esta semana completó ${completadas.length} ítem${completadas.length > 1 ? "s" : ""}. Excelente gestión.\n`;
          if (pendientes.length > 0) msg += `⏳ Tiene ${pendientes.length} tarea${pendientes.length > 1 ? "s" : ""} aún pendiente${pendientes.length > 1 ? "s" : ""}`;
          if (pendientes.filter(t => !t.fecha).length > 0) msg += ` (${pendientes.filter(t => !t.fecha).length} sin fecha asignada — le recomiendo programarlas)`;
          msg += ".\n";
          if (proximaSemana.length > 0) msg += `📅 Próxima semana tiene agendadas: ${proximaSemana.map(t => `"${t.datos?.titulo || t.texto}"`).join(", ")}.`;
          msg += "\n¿Desea que le ayude a organizar la agenda?";
          enviarNotifBrowser("📊 Asistente — Resumen semanal", `${completadas.length} completadas · ${pendientes.length} pendientes`);
          inyectarMensajeAsistente(msg);
        }
      }
    };

    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("cerebro_google_email", googleConnectedEmail);
  }, [googleConnectedEmail]);

  useEffect(() => {
    localStorage.setItem("cerebro_google_scopes", JSON.stringify(googleScopes));
  }, [googleScopes]);

  useEffect(() => {
    localStorage.setItem("cerebro_outlook_connected", outlookConnected ? "true" : "false");
  }, [outlookConnected]);

  // Cargar historial conversacional inicial en la referencia del modelo
  useEffect(() => {
    historyRef.current = messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }, []);

  // Persistir items capturados en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem("cerebro_items", JSON.stringify(items));
  }, [items]);

  // Persistir mensajes del chat en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem("cerebro_messages", JSON.stringify(messages));
  }, [messages]);

  // Sincronizar tempKey si cambia la API Key de base
  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  async function handleCaptura(texto) {
    const userMsg = { role: "user", content: texto, time: now() };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: "user", content: texto }];
    setIsLoading(true);

    try {
      // Si la consulta parece una búsqueda web, usa Google Search grounding
      const respuesta = looksLikeWebSearch(texto) && apiKey
        ? await searchWithGemini(historyRef.current, apiKey)
        : await askGemini(historyRef.current, apiKey, personality, items);
      const itemsToProcess = Array.isArray(respuesta) ? respuesta : [respuesta];
      
      const assistantContent = itemsToProcess.map(item => item.respuesta || "").filter(Boolean).join("\n") || "Listo.";
      const primerItem = Array.isArray(respuesta) ? respuesta[0] : respuesta;
      const assistantMsg = {
        role: "assistant",
        content: assistantContent,
        tipo: Array.isArray(respuesta) ? "chat" : respuesta.tipo,
        time: now(),
        accion: primerItem?.accion?.tipo && primerItem.accion.tipo !== "null" ? primerItem.accion : null,
      };
      setMessages(prev => [...prev, assistantMsg]);
      historyRef.current = [...historyRef.current, { role: "assistant", content: assistantContent }];

      // Si el Asistente ordena eliminar el ítem original (reprogramación con "mover")
      const accionResp = primerItem?.accion;
      if (
        accionResp?.tipo === "reprogramar" &&
        accionResp?.accion_original === "eliminar" &&
        accionResp?.item_id_original
      ) {
        setItems(prev => prev.filter(i => i.id !== accionResp.item_id_original));
      }

      itemsToProcess.forEach(item => {
        if (item.tipo && item.tipo !== "chat") {
          const datos = item.datos || {};
          const fechaItem = datos.fecha || null;

          // Calcular columna automáticamente según la fecha
          function calcularColumna(fecha) {
            if (!fecha) return "cesta"; // sin fecha → cesta (el Asistente debería haber preguntado)
            const hoy = new Date();
            const hoyStr = hoy.toISOString().slice(0, 10);
            if (fecha === hoyStr) return "hoy";
            // inicio y fin de la semana actual (lunes–domingo)
            const dow = hoy.getDay(); // 0=dom, 1=lun...
            const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((dow + 6) % 7)); lunes.setHours(0,0,0,0);
            const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6); domingo.setHours(23,59,59,999);
            const fechaDate = new Date(fecha + "T12:00:00");
            if (fechaDate >= lunes && fechaDate <= domingo) return "semana";
            return "cesta"; // fecha futura más allá de esta semana → cesta
          }

          // Si la nota tiene bloques estructurados, asegurar IDs únicos
          const bloquesBrutos = datos.bloques;
          const bloquesNota = Array.isArray(bloquesBrutos) && bloquesBrutos.length > 0
            ? bloquesBrutos.map(b => ({
                ...b,
                id: uid(),
                ...(b.items ? { items: b.items.map(it => ({ ...it, id: uid() })) } : {}),
              }))
            : undefined;

          const newItem = {
            id: uid(),
            tipo: item.tipo,
            texto: datos.titulo || texto,
            titulo: datos.titulo || null,
            datos,
            ...(bloquesNota ? { bloques: bloquesNota } : {}),
            creado: now(),
            hecho: false,
            columna: calcularColumna(fechaItem),
            // Promover fecha/hora al nivel raíz para que el calendario los lea
            fecha: fechaItem,
            hora: datos.hora || null,
          };
          setItems(prev => [newItem, ...prev]);
        }
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant", 
        content: `⚠️ Error de conexión con Gemini: ${err.message}. Verifique que su clave de API sea correcta y esté activa.`, 
        time: now(), 
        tipo: "chat",
      }]);
    }
    setIsLoading(false);
  }

  function handleDelete(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleToggle(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, hecho: !i.hecho } : i));
  }

  const navItems = [
    { id: "inicio",     label: "Inicio",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { id: "tareas",     label: "Tareas",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
    { id: "notas",      label: "Notas",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> },
    { id: "calendario", label: "Calendario",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: "reuniones",  label: "Reuniones",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
    { id: "finanzas",   label: "Finanzas",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
    { id: "contactos",  label: "Contactos",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: "correos",    label: "Correos",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ];

  // ── Render condicional: auth → syncing → app ──────────────────────────────
  if (!authReady) return null;
  if (!session)   return <AuthScreen onAuth={setSession} darkMode={darkMode} />;
  if (syncing)    return <SyncingScreen darkMode={darkMode} />;
  if (syncFailed) return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0f0f14" : "#f0f0f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: darkMode ? "#f5f5f7" : "#1d1d1f" }}>Error al cargar datos</div>
      <div style={{ fontSize: 13, color: darkMode ? "#aeaeb2" : "#515154" }}>No se pudo sincronizar con Supabase.</div>
      <button onClick={() => { setSyncFailed(false); if (session?.user?.id) initUserData(session.user.id); }}
        style={{ padding: "9px 20px", borderRadius: 10, background: "#0071e3", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        Reintentar
      </button>
      <button onClick={async () => { await supabase.auth.signOut(); }}
        style={{ padding: "7px 16px", borderRadius: 10, background: "transparent", color: darkMode ? "#aeaeb2" : "#515154", border: `1px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`, fontSize: 12, cursor: "pointer" }}>
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className={`workspace-container${darkMode ? " dark" : ""}`}>
        
        {/* MENÚ LATERAL PERMANENTE — Tema Oscuro */}
        <aside className={`sidebar-permanent ${isMobileSidebarOpen ? "open" : ""}`}>

          {/* App Logo / Nombre */}
          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0071e3,#5e5ce6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>Cerebro</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Personal OS</div>
            </div>
            <button className="mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}
              style={{ marginLeft: "auto", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>×</button>
          </div>

          {/* Navegación Principal */}
          <div style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 8, marginBottom: 4 }}>
              Principal
            </span>

            {navItems.map(n => {
              const active = vista === n.id;
              const pendientes = n.id === "tareas" ? items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho).length : 0;
              return (
                <button key={n.id}
                  onClick={() => { setVista(n.id); setIsMobileSidebarOpen(false); }}
                  style={{
                    width: "100%", padding: "9px 10px", borderRadius: 8,
                    background: active ? "rgba(0,113,227,0.22)" : "transparent",
                    border: active ? "1px solid rgba(0,113,227,0.30)" : "1px solid transparent",
                    color: active ? "#ffffff" : "rgba(255,255,255,0.58)",
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 9,
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.58)"; } }}
                >
                  <span style={{ opacity: active ? 1 : 0.65, display: "flex", alignItems: "center" }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {pendientes > 0 && (
                    <span style={{ background: G.accent, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{pendientes}</span>
                  )}
                </button>
              );
            })}

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 8px" }} />

            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 8, marginBottom: 4 }}>
              Conexiones
            </span>

            {/* Chat del Asistente */}
            <button onClick={() => { handleOpenDrawer({ type: "ia_chat" }); setIsMobileSidebarOpen(false); }}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent", border: "1px solid transparent", color: "rgba(255,255,255,0.58)", fontSize: 12, fontWeight: 400, display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.58)"; }}>
              <span style={{ opacity: 0.65, display: "flex", alignItems: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </span>
              <span>Chat del Asistente</span>
            </button>

            {/* Google Workspace */}
            <button
              onClick={() => { if (googleConnected) { handleOpenDrawer({ type: "calendar_detail" }); } else { setShowConfig(true); setConfigTab("connections"); setSimulatingConnection("google"); setSimulatingStep(1); } setIsMobileSidebarOpen(false); }}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent", border: "1px solid transparent", color: googleConnected ? "rgba(52,199,89,0.9)" : "rgba(255,255,255,0.58)", fontSize: 12, fontWeight: 400, display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <span style={{ opacity: 0.65, display: "flex", alignItems: "center", position: "relative" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                  {googleConnected && <path d="M9 14l2 2 4-4" stroke="#30d158" strokeWidth="2"/>}
                </svg>
              </span>
              <span>Google Workspace</span>
            </button>
          </div>

          {/* Bottom — Perfil + Configuración */}
          <div style={{ padding: "12px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* MemoryOrb / Asistente chip */}
            <div onClick={() => handleOpenDrawer({ type: "ia_chat" })}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
              <AsistenteAvatar size={24} state="idle" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Asistente Cognitivo</div>
                <div style={{ fontSize: 9, color: "rgba(52,199,89,0.9)", fontWeight: 600 }}>● En línea</div>
              </div>
            </div>

            {/* Perfil del usuario */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0071e3,#34c759)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>JO</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Javier Ospina</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>Director de Proyectos</div>
              </div>
            </div>

            {/* Configuración API */}
            <button onClick={() => { setShowConfig(true); setIsMobileSidebarOpen(false); }}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <Icon.key />
              <span>Configuración de API</span>
            </button>
          </div>
        </aside>

        {/* CONTENEDOR PRINCIPAL */}
        <main className="main-content-pane">
          
          {/* ── Topbar ── */}
          <header className="topbar-header" style={{
            padding: "0 24px",
            height: 56,
            borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
            background: darkMode ? "#16161e" : "#ffffff",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 90, flexShrink: 0,
            boxShadow: darkMode ? "none" : "0 1px 0 rgba(0,0,0,0.05)",
            transition: "background 0.25s, border-color 0.25s"
          }}>
            {/* Izquierda: hamburger + título */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="mobile-hamburger-btn" onClick={() => setIsMobileSidebarOpen(true)}
                style={{ border: "none", background: "transparent", color: G.textPrimary, fontSize: 20, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                ☰
              </button>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.02em", margin: 0 }}>
                {vista === "inicio"     && "Dashboard"}
                {vista === "tareas"     && "Tareas"}
                {vista === "notas"      && "Notas"}
                {vista === "calendario" && "Calendario"}
                {vista === "reuniones"  && "Reuniones"}
                {vista === "finanzas"   && "Finanzas"}
                {vista === "contactos"  && "Contactos"}
                {vista === "correos"    && "Correos"}
              </h1>
              {/* Badge de estado del Asistente Personal */}
              {vista === "inicio" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: G.accentSoft, border: `1px solid rgba(0,113,227,0.15)`, borderRadius: 20, padding: "4px 10px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={G.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 11, color: G.accent, fontWeight: 600 }}>
                    {items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho).length > 0
                      ? `${items.filter(i => (i.tipo === "tarea" || i.tipo === "recordatorio") && !i.hecho).length} misiones activas`
                      : "Sistemas al día"}
                  </span>
                </div>
              )}
            </div>

            {/* Derecha: búsqueda + acciones */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Barra de búsqueda global */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "6px 12px", width: 200 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#86868b" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#86868b" strokeWidth="2" strokeLinecap="round"/></svg>
                <input placeholder="Búsqueda global…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: G.textPrimary, width: "100%", fontFamily: "Inter" }} />
              </div>

              {/* Toggle Dark/Light Mode */}
              <button
                onClick={() => { const next = !darkMode; setDarkMode(next); localStorage.setItem("cerebro_dark", next); }}
                title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                style={{ width: 34, height: 34, borderRadius: 9,
                  background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}>
                {darkMode
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#f5f5f7" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={G.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
              </button>

              {/* Campana de notificaciones */}
              <button style={{ width: 34, height: 34, borderRadius: 9,
                background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={G.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={G.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {/* Botón configurar API */}
              <button onClick={() => setShowConfig(!showConfig)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
                  color: apiKey ? G.green : G.amber,
                  background: apiKey ? G.greenSoft : G.amberSoft,
                  border: `1px solid ${apiKey ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)"}`,
                  padding: "6px 12px", borderRadius: 9, cursor: "pointer", transition: "all 0.2s" }}>
                <Icon.key />
                <span>{apiKey ? "API activa" : "Configurar"}</span>
              </button>

              {/* Contador de capturas */}
              <div style={{ fontSize: 11, color: G.textSecondary,
                background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
                padding: "6px 10px", borderRadius: 9, fontWeight: 600 }}>
                {items.length} cap.
              </div>
            </div>
          </header>

          {/* Área del Contenido de la Vista Activa */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {vista === "inicio" && (
              <ViewDashboard items={items} onNavigate={setVista} onOpenDrawer={handleOpenDrawer} darkMode={darkMode} apiKey={apiKey} googleConnectedEmail={googleConnectedEmail} />
            )}
            {vista === "tareas" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <ViewTareas
                  items={items}
                  setItems={setItems}
                  onDelete={handleDelete}
                  onOpenDrawer={handleOpenDrawer}
                  darkMode={darkMode}
                />
              </div>
            )}
            {vista === "notas" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <ViewNotas items={items} setItems={setItems} darkMode={darkMode} />
              </div>
            )}
            {vista === "calendario" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <ViewCalendario items={items} setItems={setItems} darkMode={darkMode} />
              </div>
            )}
            {vista === "reuniones" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <ViewReuniones items={items} setItems={setItems} apiKey={apiKey} darkMode={darkMode} />
              </div>
            )}
            {vista === "finanzas" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px", background: darkMode ? DARK.bg : LIGHT.bg }}>
                <FinanceLedger
                  items={items}
                  setItems={setItems}
                  onDelete={handleDelete}
                  darkMode={darkMode}
                />
              </div>
            )}
            {vista === "contactos" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px", background: darkMode ? DARK.bg : LIGHT.bg }}>
                <ViewContactos contactos={contactos} setContactos={setContactos} darkMode={darkMode} />
              </div>
            )}
            {vista === "correos" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                <ViewCorreos
                  googleConnectedEmail={googleConnectedEmail}
                  apiKey={apiKey}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>

        </main>

        {/* Modal de Configuración General - Flotante y Centrado de forma Fija */}
        {showConfig && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 850, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.50)",
              borderRadius: 24,
              width: "100%",
              maxWidth: 400,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "relative",
            }}>
              {/* Contenido de simulación de conexión */}
              {simulatingConnection && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: 24,
                  zIndex: 20,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  animation: "fadeIn 0.2s ease",
                }}>
                  {simulatingConnection === "google" ? (
                    <>
                      {/* PASO 1: Selección de Método de Conexión (Opciones Avanzadas) */}
                      {simulatingStep === 1 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24">
                              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.31 7.56 8.9 5.04 12 5.04z" />
                              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.58v2.98h3.84c2.24-2.06 3.58-5.1 3.58-8.66z" />
                              <path fill="#FBBC05" d="M5.35 10.63C5.11 11.37 5 12.17 5 13s.11 1.63.35 2.37l-3.96 3.07C.51 16.89 0 14.99 0 13s.51-3.89 1.39-5.44l3.96 3.07z" />
                              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.1 0-5.69-2.52-6.65-5.59L1.39 15.74C3.37 19.63 7.35 23 12 23z" />
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.01em" }}>Google API Integration</span>
                          </div>

                          <div>
                            <h4 style={{ fontSize: 12, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em", marginBottom: 4 }}>
                              ¿Cómo desea conectar su cuenta?
                            </h4>
                            <p style={{ fontSize: 10, color: G.textSecondary, lineHeight: 1.4 }}>
                              Para sincronizar eventos bidireccionalmente, elija el método adaptado a sus políticas:
                            </p>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div
                              onClick={() => setGoogleConnectionMethod("oauth")}
                              style={{
                                border: `2px solid ${googleConnectionMethod === "oauth" ? G.accent : "rgba(0,0,0,0.06)"}`,
                                background: googleConnectionMethod === "oauth" ? G.accentSoft : "rgba(255,255,255,0.5)",
                                padding: 12, borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                                display: "flex", gap: 10, alignItems: "flex-start"
                              }}
                            >
                              <div style={{ marginTop: 2 }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${googleConnectionMethod === "oauth" ? G.accent : "rgba(0,0,0,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {googleConnectionMethod === "oauth" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent }} />}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>OAuth 2.0 Directo (Recomendado)</div>
                                <div style={{ fontSize: 9, color: G.textSecondary, marginTop: 2, lineHeight: 1.3 }}>Inicie sesión con su cuenta de Google y otorgue permisos en un solo paso. Rápido y totalmente seguro.</div>
                              </div>
                            </div>

                            <div
                              onClick={() => setGoogleConnectionMethod("service_account")}
                              style={{
                                border: `2px solid ${googleConnectionMethod === "service_account" ? G.accent : "rgba(0,0,0,0.06)"}`,
                                background: googleConnectionMethod === "service_account" ? G.accentSoft : "rgba(255,255,255,0.5)",
                                padding: 12, borderRadius: 14, cursor: "pointer", transition: "all 0.2s",
                                display: "flex", gap: 10, alignItems: "flex-start"
                              }}
                            >
                              <div style={{ marginTop: 2 }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${googleConnectionMethod === "service_account" ? G.accent : "rgba(0,0,0,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {googleConnectionMethod === "service_account" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent }} />}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: G.textPrimary }}>Cuenta de Servicio (Empresarial)</div>
                                <div style={{ fontSize: 9, color: G.textSecondary, marginTop: 2, lineHeight: 1.3 }}>Cargue su archivo JSON de credenciales de API para integraciones dedicadas en servidores.</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button
                              onClick={() => setSimulatingStep(2)}
                              style={{
                                flex: 1, padding: "10px 14px", borderRadius: 10,
                                background: G.accent, color: "#ffffff", fontSize: 11, fontWeight: 700,
                                border: "none", boxShadow: `0 4px 12px ${G.accentGlow}`, transition: "transform 0.2s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                              Siguiente paso
                            </button>
                            <button
                              onClick={() => {
                                setSimulatingConnection(null);
                                setSimulatingStep(1);
                              }}
                              style={{
                                padding: "10px 14px", borderRadius: 10,
                                background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                                border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer"
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 2: Selección de Cuenta (Estilo Google Selector) */}
                      {simulatingStep === 2 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" style={{ marginBottom: 4 }}>
                              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.31 7.56 8.9 5.04 12 5.04z" />
                              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.74-2.37 3.58v2.98h3.84c2.24-2.06 3.58-5.1 3.58-8.66z" />
                              <path fill="#FBBC05" d="M5.35 10.63C5.11 11.37 5 12.17 5 13s.11 1.63.35 2.37l-3.96 3.07C.51 16.89 0 14.99 0 13s.51-3.89 1.39-5.44l3.96 3.07z" />
                              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.1 0-5.69-2.52-6.65-5.59L1.39 15.74C3.37 19.63 7.35 23 12 23z" />
                            </svg>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: G.textPrimary, letterSpacing: "-0.02em" }}>
                              Conectar su cuenta de Google
                            </h4>
                            <p style={{ fontSize: 11, color: G.textSecondary, marginTop: -4 }}>
                              para continuar en Cerebro Personal
                            </p>

                            <div style={{ width: "100%", textAlign: "left", marginTop: 8 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: G.textSecondary, display: "block", marginBottom: 6 }}>DIRECCIÓN DE CORREO DE GOOGLE</label>
                              <input
                                type="email"
                                placeholder="ingrese.su.correo@gmail.com"
                                value={googleConnectedEmail || ""}
                                onChange={(e) => setGoogleConnectedEmail(e.target.value)}
                                style={{
                                  width: "100%", padding: "10px 12px", borderRadius: 10,
                                  border: "1px solid rgba(0, 0, 0, 0.12)", background: "#ffffff",
                                  fontSize: 12.5, color: G.textPrimary, outline: "none"
                                }}
                              />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 700, color: G.textTertiary, textAlign: "left" }}>O SELECCIONE UNA SUGERENCIA:</div>
                              {[
                                { name: "Suelos y Estructuras (Real)", email: "suelosyestructuras@gmail.com", initials: "SE", color: "#34c759" },
                                { name: "Javier Ospina (Construito)", email: "javier.ospina@construito.co", initials: "JO", color: G.accent },
                                { name: "Javier Ospina (Personal)", email: "javier.ospina.design@gmail.com", initials: "JP", color: "#e100ff" }
                              ].map((sug, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setGoogleConnectedEmail(sug.email);
                                  }}
                                  style={{
                                    border: `1px solid ${googleConnectedEmail === sug.email ? G.accent : "rgba(0,0,0,0.06)"}`,
                                    background: googleConnectedEmail === sug.email ? G.accentSoft : "rgba(255,255,255,0.8)",
                                    padding: "8px 10px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                                    display: "flex", alignItems: "center", gap: 10, textAlign: "left"
                                  }}
                                  onMouseEnter={e => { if (googleConnectedEmail !== sug.email) e.currentTarget.style.background = "#f2f2f7"; }}
                                  onMouseLeave={e => { if (googleConnectedEmail !== sug.email) e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
                                >
                                  <div style={{
                                    width: 24, height: 24, borderRadius: "50%", background: sug.color, color: "#ffffff",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700
                                  }}>
                                    {sug.initials}
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>{sug.name}</span>
                                    <span style={{ fontSize: 8.5, color: G.textTertiary }}>{sug.email}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                            <button
                              onClick={() => setSimulatingStep(1)}
                              style={{ fontSize: 11, color: G.accent, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer" }}
                            >
                              ← Volver
                            </button>
                            <button
                              disabled={!googleConnectedEmail || !googleConnectedEmail.includes("@")}
                              onClick={() => setSimulatingStep(3)}
                              style={{
                                padding: "8px 16px", borderRadius: 8,
                                background: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? G.accent : "rgba(0,0,0,0.05)",
                                color: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? "#ffffff" : G.textTertiary,
                                fontSize: 11, fontWeight: 700, border: "none", cursor: (googleConnectedEmail && googleConnectedEmail.includes("@")) ? "pointer" : "default"
                              }}
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 3: Consentimiento de Permisos Detallados */}
                      {simulatingStep === 3 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.02em" }}>
                            Selecciona los servicios a los que puede acceder
                          </h4>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(0,0,0,0.02)", padding: 10, borderRadius: 12 }}>
                            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                              <input type="checkbox" checked={googleScopes.calendar} disabled style={{ accentColor: G.accent, marginTop: 2 }} />
                              <div style={{ fontSize: 10, fontWeight: 700, color: G.textPrimary }}>Ver, editar y compartir calendarios</div>
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button
                              onClick={() => {
                                setGoogleConnected(true);
                                setSimulatingStep(4);
                              }}
                              style={{
                                flex: 1, padding: "8px 12px", borderRadius: 8,
                                background: G.accent, color: "#ffffff", fontSize: 10, fontWeight: 700,
                                border: "none", boxShadow: `0 3px 8px ${G.accentGlow}`, cursor: "pointer"
                              }}
                            >
                              Permitir Acceso
                            </button>
                            <button
                              onClick={() => setSimulatingStep(2)}
                              style={{
                                padding: "8px 12px", borderRadius: 8,
                                background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                                fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer"
                              }}
                            >
                              Atrás
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASO 4: Éxito */}
                      {simulatingStep === 4 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                          <div style={{
                            width: 62, height: 62, borderRadius: "50%",
                            background: "linear-gradient(135deg, #34c759 0%, #0071e3 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24, color: "#ffffff", boxShadow: `0 10px 24px rgba(52, 199, 89, 0.25)`
                          }}>✓</div>

                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: G.textPrimary, marginBottom: 6 }}>
                              ¡Sincronización Completada!
                            </h3>
                            <p style={{ fontSize: 11, color: G.textSecondary, lineHeight: 1.4 }}>
                              Ing. Ospina, me he conectado exitosamente a su cuenta <strong>{googleConnectedEmail}</strong>.
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSimulatingConnection(null);
                              setSimulatingStep(1);
                            }}
                            style={{
                              width: "100%", padding: "10px", borderRadius: 10,
                              background: "linear-gradient(135deg, #0071e3 0%, #34c759 100%)",
                              color: "#ffffff", fontSize: 11, fontWeight: 700, border: "none",
                              boxShadow: "0 4px 12px rgba(0, 113, 227, 0.2)", marginTop: 6, cursor: "pointer"
                            }}
                          >
                            Ver mi Agenda en el Dashboard
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Cuentas de Outlook */
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Microsoft Azure AD</span>
                      </div>

                      {simulatingStep === 1 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 800 }}>Microsoft 365 solicita permisos</h4>
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button
                              onClick={() => {
                                setOutlookConnected(true);
                                setSimulatingStep(2);
                              }}
                              style={{
                                flex: 1, padding: "10px", borderRadius: 10,
                                background: "#0078d4", color: "#ffffff", fontSize: 12, fontWeight: 600, textAlign: "center",
                                border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer"
                              }}
                            >
                              Permitir
                            </button>
                            <button
                              onClick={() => {
                                setSimulatingConnection(null);
                                setSimulatingStep(1);
                              }}
                              style={{
                                padding: "10px 14px", borderRadius: 10,
                                background: "rgba(0,0,0,0.05)", color: G.textSecondary,
                                border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer"
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                          <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "linear-gradient(135deg, #0078d4 0%, #50e6ff 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24, color: "#ffffff", boxShadow: "0 10px 24px rgba(0, 120, 212, 0.25)"
                          }}>✓</div>

                          <button
                            onClick={() => {
                              setSimulatingConnection(null);
                              setSimulatingStep(1);
                            }}
                            style={{
                              width: "100%", padding: "10px", borderRadius: 10,
                              background: "#0078d4", border: "none",
                              color: "#ffffff", fontSize: 12, fontWeight: 700,
                              boxShadow: "0 4px 12px rgba(0, 120, 212, 0.2)", cursor: "pointer"
                            }}
                          >
                            Continuar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Encabezado del modal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: G.textPrimary, letterSpacing: "-0.01em" }}>
                  ⚙️ Configuración General
                </span>
                <button
                  onClick={() => setShowConfig(false)}
                  style={{
                    color: G.textTertiary, padding: 4, borderRadius: 6,
                    border: "none", background: "transparent",
                    transition: "all 0.2s", cursor: "pointer",
                    display: "flex", alignItems: "center"
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = G.textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = G.textTertiary}
                >
                  <Icon.x />
                </button>
              </div>

              {/* Control de Pestañas */}
              <div style={{
                display: "flex",
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                paddingBottom: 4,
                gap: 8
              }}>
                <button
                  onClick={() => setConfigTab("api")}
                  style={{
                    fontSize: 12,
                    fontWeight: configTab === "api" ? 700 : 500,
                    color: configTab === "api" ? G.accent : G.textSecondary,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: configTab === "api" ? G.accentSoft : "transparent",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                >
                  🔑 Clave API
                </button>
                <button
                  onClick={() => setConfigTab("personality")}
                  style={{
                    fontSize: 12,
                    fontWeight: configTab === "personality" ? 700 : 500,
                    color: configTab === "personality" ? G.accent : G.textSecondary,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: configTab === "personality" ? G.accentSoft : "transparent",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                >
                  👤 Personalidad
                </button>
                <button
                  onClick={() => setConfigTab("connections")}
                  style={{
                    fontSize: 12,
                    fontWeight: configTab === "connections" ? 700 : 500,
                    color: configTab === "connections" ? G.accent : G.textSecondary,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: configTab === "connections" ? G.accentSoft : "transparent",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                >
                  🔗 Conexiones
                </button>
                <button
                  onClick={() => setConfigTab("contactos")}
                  style={{
                    fontSize: 12,
                    fontWeight: configTab === "contactos" ? 700 : 500,
                    color: configTab === "contactos" ? G.accent : G.textSecondary,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: configTab === "contactos" ? G.accentSoft : "transparent",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                >
                  👥 Contactos
                </button>
              </div>

              {/* Contenido Pestaña API */}
              {configTab === "api" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={e => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{
                      width: "100%", background: "rgba(255, 255, 255, 0.6)",
                      border: `1px solid ${G.border}`,
                      borderRadius: 10, padding: "10px 12px",
                      color: G.textPrimary, fontSize: 13, outline: "none",
                      fontFamily: "Inter",
                    }}
                  />

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        localStorage.setItem("gemini_api_key", tempKey.trim());
                        setApiKey(tempKey.trim());
                        setShowConfig(false);
                      }}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10,
                        background: G.accent, color: "#ffffff",
                        border: "none",
                        fontSize: 12, fontWeight: 600, textAlign: "center",
                        boxShadow: `0 2px 8px rgba(0, 113, 227, 0.2)`,
                        transition: "all 0.2s",
                        cursor: "pointer"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"}
                    >
                      Guardar
                    </button>
                    {apiKey && (
                      <button
                        onClick={() => {
                          localStorage.removeItem("gemini_api_key");
                          setApiKey("");
                          setTempKey("");
                          setShowConfig(false);
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: 10,
                          background: G.coralSoft, color: G.coral,
                          border: `1px solid rgba(255, 59, 48, 0.15)`,
                          fontSize: 12, fontWeight: 600,
                          transition: "all 0.2s",
                          cursor: "pointer"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = G.coral;
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = G.coralSoft;
                          e.currentTarget.style.color = G.coral;
                        }}
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Contenido Pestaña Conexiones */}
              {configTab === "connections" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Tarjeta Google */}
                    <div style={{
                      background: "rgba(255,255,255,0.60)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Google Workspace</div>
                      </div>
                      {googleConnected ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: 10, color: G.green, fontWeight: 700 }}>✓ Conectado</span>
                          <button
                            onClick={() => {
                              setGoogleConnected(false);
                              setGoogleConnectedEmail("");
                            }}
                            style={{ fontSize: 8, color: G.coral, textDecoration: "underline", padding: 2, border: "none", background: "transparent", cursor: "pointer" }}
                          >
                            Desconectar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSimulatingConnection("google");
                            setSimulatingStep(1);
                          }}
                          style={{
                            background: G.accentSoft,
                            border: `1px solid ${G.accent}`,
                            color: G.accent,
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Conectar
                        </button>
                      )}
                    </div>

                    {/* Tarjeta Outlook */}
                    <div style={{
                      background: "rgba(255,255,255,0.60)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G.textPrimary }}>Microsoft 365</div>
                      </div>
                      {outlookConnected ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: 10, color: G.green, fontWeight: 700 }}>✓ Conectado</span>
                          <button
                            onClick={() => setOutlookConnected(false)}
                            style={{ fontSize: 8, color: G.coral, textDecoration: "underline", padding: 2, border: "none", background: "transparent", cursor: "pointer" }}
                          >
                            Desconectar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSimulatingConnection("outlook");
                            setSimulatingStep(1);
                          }}
                          style={{
                            background: G.accentSoft,
                            border: `1px solid ${G.accent}`,
                            color: G.accent,
                            borderRadius: 8,
                            padding: "4px 10px",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido Pestaña Contactos */}
              {configTab === "contactos" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <ContactosPanel />
                </div>
              )}

              {/* Cerrar sesión */}
              <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 16, marginTop: 8 }}>
                <button
                  onClick={async () => { await supabase.auth.signOut(); }}
                  style={{
                    width: "100%", padding: "9px 0", borderRadius: 10,
                    background: G.coralSoft, border: `1px solid rgba(255,59,48,0.20)`,
                    color: G.coral, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cerrar sesión
                </button>
                {session?.user?.email && (
                  <div style={{ textAlign: "center", fontSize: 11, color: G.textTertiary, marginTop: 8 }}>
                    {session.user.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Sidebar — barra lateral derecha */}
        <AIChatSidebar
          messages={messages}
          onCaptura={handleCaptura}
          isLoading={isLoading}
        />

        {/* RightDrawer — edición de tareas, calendario, finanzas */}
        <RightDrawer
          isOpen={drawerType !== null && drawerType !== "ia_chat"}
          type={drawerType}
          data={drawerData}
          onClose={handleCloseDrawer}
          items={items}
          setItems={setItems}
          onDelete={handleDelete}
          onCaptura={handleCaptura}
          messages={messages}
          isLoading={isLoading}
          googleConnected={googleConnected}
          googleConnectedEmail={googleConnectedEmail}
          setGoogleConnected={setGoogleConnected}
          setGoogleConnectedEmail={setGoogleConnectedEmail}
        />
      </div>
    </>
  );
}
