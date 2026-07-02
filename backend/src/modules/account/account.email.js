/**
 * account.email.js (refactorizado)
 *
 * Plantillas de correo del módulo de cuenta. Nada más.
 * Ya no conoce nodemailer, SMTP_*, ni MAIL_FROM: delega el envío
 * en core/email/transport.js.
 *
 * Mejora de seguridad incluida: los datos dinámicos que se interpolan
 * en el HTML (name, newEmail) se escapan. `name` puede venir de
 * displayName, que es input del usuario — sin escape, un displayName
 * malicioso podía inyectar HTML en los correos.
 */

import { sendMail } from "../../core/email/transport.js";

const APP_NAME = "TuGabinete";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function greetingName(name) {
  return escapeHtml(name || "Profesional");
}

export async function sendEmailChangeVerificationEmail({
  name,
  email,
  confirmUrl,
}) {
  await sendMail({
    to: email,
    subject: `Confirmá tu nuevo correo en ${APP_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Confirmá tu nuevo correo</h2>
        <p>Hola ${greetingName(name)}, recibimos una solicitud para cambiar el correo de tu cuenta.</p>
        <p>Para confirmar el cambio, hacé clic en el siguiente enlace:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>Si no fuiste vos, ignorá este mensaje.</p>
      </div>
    `,
  });
}

export async function sendEmailChangeNoticeEmail({
  name,
  currentEmail,
  newEmail,
}) {
  await sendMail({
    to: currentEmail,
    subject: `Se solicitó un cambio de correo en ${APP_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Solicitud de cambio de correo</h2>
        <p>Hola ${greetingName(name)}, se solicitó cambiar el correo de tu cuenta a <strong>${escapeHtml(newEmail)}</strong>.</p>
        <p>El cambio no se aplicará hasta que el nuevo correo sea confirmado.</p>
        <p>Si no fuiste vos, cambiá tu contraseña cuanto antes.</p>
      </div>
    `,
  });
}
