/**
 * core/email/transport.js
 *
 * Infraestructura de correo compartida por toda la aplicación.
 * Responsabilidad única: la conexión SMTP (nodemailer) y su configuración
 * vía variables de entorno. Este es el ÚNICO archivo del proyecto que
 * debería leer SMTP_* / MAIL_FROM o importar nodemailer.
 *
 * Los módulos de dominio (account, auth, etc.) definen sus plantillas
 * y llaman a sendMail(); nunca instancian su propio transporter.
 *
 * Capas resultantes:
 *   account.notifications.js -> account.email.js -> core/email/transport.js
 *   (política)                  (plantillas)         (SMTP compartido)
 */

import nodemailer from "nodemailer";

let transporter = null;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    // Falla rápido y con un mensaje claro, en lugar del error críptico
    // de conexión que daría nodemailer con host undefined.
    throw new Error(
      `[email/transport] Falta configurar la variable de entorno ${name}.`
    );
  }

  return value;
}

/**
 * Devuelve el transporter SMTP (singleton, lazy).
 * Se crea recién en el primer envío para no exigir las variables
 * SMTP en procesos que no mandan correos (ej: scripts, migraciones).
 */
export function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
  });

  return transporter;
}

/**
 * Remitente por defecto de la aplicación.
 */
export function getDefaultFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER;
}

/**
 * Punto de envío único para toda la app.
 * Aplica el remitente por defecto si el caller no especifica uno,
 * y centraliza el lugar donde a futuro agregar logging, reintentos
 * o una cola de envío sin tocar ningún módulo de dominio.
 *
 * @param {import("nodemailer").SendMailOptions} options
 */
export async function sendMail(options) {
  const transport = getTransporter();

  return transport.sendMail({
    from: getDefaultFrom(),
    ...options,
  });
}

/**
 * Solo para tests: permite resetear el singleton
 * (ej: entre suites que cambian las variables de entorno).
 */
export function resetTransporterForTests() {
  transporter = null;
}
