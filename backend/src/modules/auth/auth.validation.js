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

export const normalizeEmail = (email = "") =>
  String(email).trim().toLowerCase();

function normalizePasswordForBlacklist(password = "") {
  return String(password).toLowerCase().replace(/\s+/g, "");
}

export function validatePasswordPolicy({
  password,
  confirmPassword,
  requireConfirmation = true,
}) {
  const errors = {};
  const nextPassword = String(password ?? "");
  const nextConfirm = String(confirmPassword ?? "");
  const utf8Length = Buffer.byteLength(nextPassword, "utf8");

  if (!nextPassword) {
    errors.password = "Ingresá una nueva contraseña.";
  } else if (/^\s+$/.test(nextPassword)) {
    errors.password = "La contraseña no puede estar formada solo por espacios.";
  } else if (nextPassword.length < 10) {
    errors.password = "La contraseña debe tener al menos 10 caracteres.";
  } else if (utf8Length > 72) {
    errors.password =
      "La contraseña es demasiado larga para el sistema actual. Usá hasta 72 bytes UTF-8.";
  } else if (COMMON_PASSWORDS.has(normalizePasswordForBlacklist(nextPassword))) {
    errors.password = "Esa contraseña es demasiado común. Elegí otra.";
  }

  if (requireConfirmation) {
    if (!nextConfirm) {
      errors.confirmPassword = "Confirmá la nueva contraseña.";
    } else if (nextPassword !== nextConfirm) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}