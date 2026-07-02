/**
 * account.service.js (refactorizado — sección de cambio de email)
 *
 * Cambios respecto a la versión original:
 *  - Eliminados los imports directos de account.email.js.
 *  - Eliminada la lectura de process.env.API_PUBLIC_URL y la construcción
 *    manual del confirmUrl: eso ahora vive en account.notifications.js.
 *  - Eliminada la lógica "displayName || firstName || name": es política
 *    de presentación de notificaciones, no de dominio.
 *  - El servicio conserva su responsabilidad: validar input, verificar
 *    credenciales, chequear unicidad, generar/persistir el token, y
 *    DISPARAR el evento de notificación sin conocer sus detalles.
 */

import bcrypt from "bcryptjs";
import * as repo from "./account.repository.js";
import * as notifications from "./account.notifications.js";
import { validateEmailChangeInput } from "./account.validation.js";
import { normalizeEmail } from "../auth/auth.validation.js";
import { generateOpaqueToken, hashToken } from "../auth/auth.security.js";

const EMAIL_CHANGE_TTL_MINUTES = 60;

function createAppError(status, code, message, fieldErrors) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}

export async function requestEmailChange(userId, payload) {
  const validated = validateEmailChangeInput(payload);

  if (!validated.ok) {
    throw createAppError(
      400,
      "EMAIL_CHANGE_VALIDATION_FAILED",
      "Revisá los campos marcados.",
      validated.fieldErrors
    );
  }

  const { newEmail, currentPassword } = validated.data;

  const user = await repo.findSensitiveUserById(userId);

  if (!user) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  if (normalizeEmail(user.email) === newEmail) {
    throw createAppError(
      409,
      "EMAIL_UNCHANGED",
      "El nuevo correo no puede ser igual al actual.",
      {
        newEmail: "Ingresá un correo distinto al actual.",
      }
    );
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.password);

  if (!passwordOk) {
    throw createAppError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "La contraseña actual es incorrecta.",
      {
        currentPassword: "La contraseña actual es incorrecta.",
      }
    );
  }

  const emailInUse = await repo.findUserByEmailOrPendingEmail(newEmail, userId);

  if (emailInUse) {
    throw createAppError(
      409,
      "EMAIL_ALREADY_IN_USE",
      "Ese correo ya está en uso.",
      {
        newEmail: "Ese correo ya está en uso.",
      }
    );
  }

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + EMAIL_CHANGE_TTL_MINUTES * 60 * 1000
  );

  await repo.createEmailChangeRequest({
    userId,
    newEmail,
    tokenHash,
    expiresAt,
    requestedIp: null,
    requestedUserAgent: null,
  });

  // El servicio dispara el evento; notifications decide qué correos
  // salen, construye la URL de confirmación y resuelve el nombre.
  await notifications.notifyEmailChangeRequested({
    user,
    newEmail,
    rawToken,
  });

  return {
    message:
      "Te enviamos un enlace al nuevo correo para confirmar el cambio.",
    pendingEmail: newEmail,
  };
}
