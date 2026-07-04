// /public/js/features/auth/auth.api.js
//
// Capa de API PUBLICA del dominio auth: operaciones sin sesion
// (registro, verificacion, recuperacion y reseteo de contraseña).
//
// login / refresh / logout NO viven aca: son operaciones con estado y
// su dueño es core/session.js. Duplicarlas crearia dos fuentes de
// verdad sobre el token.
//
// Contrato (variante code-aware del datos-o-excepcion de patients):
//   - res.ok  -> devuelve el JSON parseado; data.code guia el flujo de
//                UI (ej: VERIFY_EMAIL_SENT vs EMAIL_ALREADY_PENDING_...)
//   - !res.ok -> lanza Error con:
//                  .message -> data.error || data.message || fallback
//                  .code    -> data.code || "REQUEST_FAILED"
//                  .status  -> HTTP status (ej: 429 para rate limit)
//                  .body    -> payload completo (fieldErrors, message crudo)
//   - red caida -> lanza Error con .code "NETWORK_ERROR" y el texto
//                  historico "No se pudo conectar con el servidor."

import { API_URL } from "../../core/config.js";

async function publicRequest(path, body, { fallbackError } = {}) {
  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    const error = new Error("No se pudo conectar con el servidor.");
    error.code = "NETWORK_ERROR";
    error.status = 0;
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      data?.error || data?.message || fallbackError || "La solicitud falló."
    );
    error.code = data?.code || "REQUEST_FAILED";
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

export const registerAccount = (payload) =>
  publicRequest("/auth/register", payload, {
    fallbackError: "Error al registrar usuario.",
  });

export const resendVerification = (email) =>
  publicRequest("/auth/resend-verification", { email }, {
    fallbackError: "No se pudo reenviar el correo de verificación.",
  });

export const forgotPassword = (email) =>
  publicRequest("/auth/forgot-password", { email }, {
    fallbackError: "No se pudo procesar la solicitud en este momento.",
  });

export const validateResetToken = (token) =>
  publicRequest("/auth/reset-password/validate", { token }, {
    fallbackError: "El enlace de recuperación es inválido o no existe.",
  });

export const resetPassword = ({ token, password, confirmPassword }) =>
  publicRequest("/auth/reset-password", { token, password, confirmPassword }, {
    fallbackError: "No se pudo actualizar la contraseña en este momento.",
  });
