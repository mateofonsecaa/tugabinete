/**
 * account.notifications.js
 *
 * Fachada de notificaciones del módulo de cuenta.
 * Responsabilidad única: dado un evento de dominio ("se solicitó un cambio
 * de email"), decidir QUÉ comunicaciones salen, a quién, y con qué datos.
 *
 * Encapsula acá (y saca del servicio):
 *  - La lectura de process.env.API_PUBLIC_URL y la construcción del confirmUrl.
 *  - La resolución del nombre a mostrar (displayName > firstName > name).
 *  - El hecho de que un cambio de email dispara DOS correos (verificación
 *    al correo nuevo + aviso de seguridad al correo actual).
 *
 * NO encapsula acá:
 *  - El transporte SMTP ni las plantillas HTML. Eso sigue viviendo en
 *    account.email.js (capa inferior). Esta separación es deliberada:
 *    notifications = "qué comunicar", email = "cómo enviarlo".
 *
 * Capas resultantes:
 *   account.service.js  ->  account.notifications.js  ->  account.email.js
 *   (dominio)               (política de notificación)    (plantillas + SMTP)
 */

import {
  sendEmailChangeNoticeEmail,
  sendEmailChangeVerificationEmail,
} from "./account.email.js";

// TODO: extraer a core/errors/appError.js (mismo TODO que en account.storage.js).
function createAppError(status, code, message, fieldErrors) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}

// --- Helpers privados del módulo ---

function resolveDisplayName(user) {
  return user.displayName || user.firstName || user.name || null;
}

function buildEmailChangeConfirmUrl(rawToken) {
  const apiBase = process.env.API_PUBLIC_URL;

  if (!apiBase) {
    throw createAppError(
      500,
      "API_PUBLIC_URL_MISSING",
      "Falta configurar API_PUBLIC_URL."
    );
  }

  // Normaliza para tolerar API_PUBLIC_URL con o sin barra final.
  const base = apiBase.replace(/\/+$/, "");

  return `${base}/api/account/email/confirm/${encodeURIComponent(rawToken)}`;
}

// --- API pública del módulo ---

/**
 * Notifica una solicitud de cambio de email:
 *  1. Correo de verificación al email NUEVO (con el enlace de confirmación).
 *  2. Aviso de seguridad al email ACTUAL.
 *
 * @param {Object} params
 * @param {Object} params.user - usuario de dominio (email, displayName, firstName, name)
 * @param {string} params.newEmail - email nuevo ya validado y normalizado
 * @param {string} params.rawToken - token opaco SIN hashear (solo viaja por email)
 */
export async function notifyEmailChangeRequested({ user, newEmail, rawToken }) {
  const name = resolveDisplayName(user);
  const confirmUrl = buildEmailChangeConfirmUrl(rawToken);

  // Envío secuencial a propósito: si falla la verificación al correo nuevo
  // (el crítico), no mandamos el aviso al correo viejo por un cambio que
  // nunca va a poder confirmarse.
  await sendEmailChangeVerificationEmail({
    name,
    email: newEmail,
    confirmUrl,
  });

  await sendEmailChangeNoticeEmail({
    name,
    currentEmail: user.email,
    newEmail,
  });
}
