// /public/js/features/patients/patients.validation.js
//
// Reglas de validacion UNICAS del dominio Pacientes (Paso 7).
// Decision de producto: ganan las reglas de alta (las de edicion
// rechazaban datos que la propia app habia guardado legitimamente).
//
//   fullName   obligatorio, max 60, solo letras y espacios
//   birthDate  opcional, no puede ser futura
//   phone      opcional, max 25 chars con formato [0-9 + ( ) -], 6-20 digitos
//   address    opcional, max 80, letras/numeros/signos basicos
//   profession opcional, max 50, solo letras y espacios
//
// Convenciones:
//   sanitize*Input -> filtro de caracteres mientras se tipea
//   validate*      -> "" si es valido, mensaje de error si no
//   Al persistir, el telefono se reduce a digitos (toPhoneDigits).

const onlyLetters = (s) => /^[\p{L}\s]+$/u.test(s);
const phoneAllowed = (s) => /^[0-9+\s()-]+$/.test(s);
const addressAllowed = (s) => /^[\p{L}0-9\s.,#°ºª/\-]+$/u.test(s);
const professionAllowed = (s) => /^[\p{L}\s]+$/u.test(s);

export function getTodayYYYYMMDD() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const normalizeSpaces = (s) => s.replace(/\s+/g, " ").trim();

export const sanitizeFullNameInput = (v) => v.replace(/[^\p{L}\s]/gu, "");
export const sanitizePhoneInput = (v) => v.replace(/[^0-9+\s()-]/g, "");
export const sanitizeAddressInput = (v) => v.replace(/[^\p{L}0-9\s.,#°ºª/\-]/gu, "");
export const sanitizeProfessionInput = (v) => v.replace(/[^\p{L}\s]/gu, "");

export const toPhoneDigits = (v) => v.replace(/\D/g, "");

export function validateFullName(value) {
  if (!value) return "Ingresá el nombre completo.";
  if (value.length > 60) return "El nombre no puede superar los 60 caracteres.";
  if (!onlyLetters(value)) return "Usá solo letras y espacios.";
  return "";
}

export function validateBirthDate(value) {
  if (!value) return "";

  const today = getTodayYYYYMMDD();
  if (value > today) return "La fecha no puede ser posterior a hoy.";

  return "";
}

export function validatePhone(value) {
  if (!value) return "";

  if (value.length > 25) return "El teléfono no puede superar los 25 caracteres.";
  if (!phoneAllowed(value)) return "Ingresá un teléfono válido.";

  const digits = toPhoneDigits(value);
  if (digits.length < 6) return "Ingresá un teléfono válido.";
  if (digits.length > 20) return "El teléfono no puede superar los 20 dígitos.";

  return "";
}

export function validateAddress(value) {
  if (!value) return "";
  if (value.length > 80) return "La dirección no puede superar los 80 caracteres.";
  if (!addressAllowed(value)) return "Usá solo letras, números y signos básicos.";
  return "";
}

export function validateProfession(value) {
  if (!value) return "";
  if (value.length > 50) return "La profesión no puede superar los 50 caracteres.";
  if (!professionAllowed(value)) return "Usá solo letras y espacios.";
  return "";
}
