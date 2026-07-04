// /public/js/features/auth/auth.validation.js
//
// Politica de contraseña UNICA del dominio auth (Paso 7).
// Decision de producto: gana la politica de reset-password, que es la
// correcta respecto de bcrypt y favorece frases largas:
//
//   - minimo 10 caracteres, no solo espacios
//   - maximo 72 bytes UTF-8 (limite duro de bcrypt)
//   - denylist de contraseñas comunes (case/espacios-insensible)
//   - confirmacion obligatoria y coincidente
//
// Las reglas viejas de registro (mayuscula obligatoria, letras+numeros)
// se ELIMINAN a proposito: exigir composicion contradice el enfoque de
// passphrase y ya no aportaba con el minimo de 10.
//
// validatePasswordFields devuelve { password?, confirmPassword? } con
// mensajes listos para UI (fieldErrors inline en reset, toast del
// primer error en register). Los mensajes de campo vacio dicen "nueva
// contraseña" porque solo reset puede alcanzarlos: register valida
// campos vacios antes con su "Completa todos los campos".

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "123123123",
  "password",
  "password123",
  "qwerty123",
  "qwertyuiop",
  "admin123",
  "contraseña",
  "tucontraseña",
  "abcdef123",
]);

function getByteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

function isCommonPassword(value) {
  return COMMON_PASSWORDS.has(String(value).toLowerCase().replace(/\s+/g, ""));
}

export function validatePasswordFields(password, confirmPassword) {
  const errors = {};

  if (!password) {
    errors.password = "Ingresá una nueva contraseña.";
  } else if (/^\s+$/.test(password)) {
    errors.password = "La contraseña no puede estar formada solo por espacios.";
  } else if (password.length < 10) {
    errors.password = "La contraseña debe tener al menos 10 caracteres.";
  } else if (getByteLength(password) > 72) {
    errors.password =
      "La contraseña es demasiado larga para el sistema actual. Usá hasta 72 bytes UTF-8.";
  } else if (isCommonPassword(password)) {
    errors.password = "Esa contraseña es demasiado común. Elegí otra.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirmá la nueva contraseña.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

