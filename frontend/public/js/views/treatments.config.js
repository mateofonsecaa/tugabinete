// /public/js/views/treatments.config.js
//
// Catálogo de tratamientos y helpers de normalización.
// Fuente única de verdad para la lista: cualquier vista que necesite
// el catálogo o validar contra él importa de acá.
//
// NOTA: normalizeText NO hace .trim() — se preserva el comportamiento
// exacto del código original. Si algún día se agrega, revisar los
// puntos de comparación en treatments.js (validación de tratamiento
// y matching de pacientes) porque cambia qué valores matchean.

export const TREATMENTS_LIST = [
  // Faciales
  "Diagnóstico facial",
  "Limpieza facial express",
  "Limpieza facial profunda",
  "Higiene facial profesional",
  "Limpieza de espalda",
  "Hidratación facial",
  "Nutrición facial",
  "Tratamiento calmante/descongestivo",
  "Tratamiento para piel sensible",
  "Tratamiento antiacné",
  "Tratamiento despigmentante",
  "Tratamiento antiage",

  // Renovación / exfoliación
  "Peeling químico",
  "Peeling enzimático",
  "Peeling mecánico",
  "Microdermoabrasión",
  "Microdermoabrasión con punta de diamante",
  "Dermaplaning",
  "Espátula ultrasónica",

  // Aparatología facial
  "Alta frecuencia",
  "Electroporación",
  "Corrientes galvánicas",
  "Ultrasonido facial",
  "Radiofrecuencia facial",
  "Fotobiomodulación LED",
  "HydraFacial / Hidrodermoabrasión",
  "Microneedling / Dermapen",
  "BB Glow",
  "HIFU facial",
  "IPL acné",
  "IPL manchas",
  "Fotorejuvenecimiento IPL",

  // Corporales manuales
  "Masaje relajante",
  "Masaje descontracturante",
  "Drenaje linfático manual",
  "Masaje modelador/reductor",
  "Exfoliación corporal",
  "Hidratación corporal",

  // Corporales con aparatología
  "Radiofrecuencia corporal",
  "Cavitación",
  "Ultracavitación",
  "Presoterapia",
  "Vacumterapia",
  "Electroestimulación / gimnasia pasiva",
  "Ondas de choque",
  "Criolipólisis",
  "HIFU corporal",
  "Lipoláser",
  "Mesoterapia corporal",

  // Capilares
  "Tratamiento capilar nutritivo",
  "Hidratación capilar",
  "Shock de keratina",
  "Botox capilar",
  "Reparación capilar",
  "Mesoterapia capilar",

  // Depilación
  "Depilación con cera",
  "Depilación con cera roll-on",
  "Depilación definitiva láser",
  "Depilación IPL"
];

export function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const allowedTreatments = TREATMENTS_LIST.map((t) => normalizeText(t));
