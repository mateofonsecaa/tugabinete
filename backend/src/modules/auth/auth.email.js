import { mailer } from "../../config/mailer.js";
import {
  PASSWORD_RESET_TTL_MINUTES,
  VERIFICATION_TTL_MINUTES,
} from "./auth.security.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildVerifyUrl(token) {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL no está configurada");
  }

  return new URL(`/api/auth/verify/${token}`, process.env.BASE_URL).toString();
}

function buildResetPasswordUrl(token) {
  if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL no está configurada");
  }

  const url = new URL("/reset-password", process.env.FRONTEND_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

function buildEmailShell({
  subject,
  preheader,
  greeting,
  lead,
  ctaLabel,
  ctaUrl,
  expiresText,
  ignoreText,
}) {
  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fff7f7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f7;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:22px 26px;background:linear-gradient(135deg,#ffadad 0%, #ffd6d6 100%);">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#ffffff;font-weight:700;font-size:20px;letter-spacing:0.2px;">
                  TuGabinete
                </div>
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#ffffff;opacity:0.9;font-size:13px;margin-top:4px;">
                  Gestión simple y profesional para tu gabinete
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 26px 10px 26px;">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#111827;font-size:18px;font-weight:700;line-height:1.35;">
                  ${greeting}
                </div>

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#374151;font-size:14px;line-height:1.6;margin-top:10px;">
                  ${lead}
                </div>

                <div style="text-align:center;margin:20px 0 18px 0;">
                  <a href="${ctaUrl}"
                     style="display:inline-block;background:#ffadad;color:#ffffff;text-decoration:none;
                            font-family:Poppins, Arial, Helvetica, sans-serif;font-size:14px;font-weight:700;
                            padding:12px 20px;border-radius:12px;">
                    ${escapeHtml(ctaLabel)}
                  </a>
                </div>

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#6b7280;font-size:12.5px;line-height:1.6;">
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </div>

                <div style="font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:12.5px;line-height:1.6;margin-top:6px;word-break:break-all;">
                  <a href="${ctaUrl}" style="color:#ff7f7f;text-decoration:underline;">${ctaUrl}</a>
                </div>

                <hr style="border:none;border-top:1px solid #f1f5f9;margin:18px 0;" />

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#6b7280;font-size:12.5px;line-height:1.6;">
                  ${expiresText}<br/>
                  ${ignoreText}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 26px 22px 26px;background:#ffffff;">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#9ca3af;font-size:11.5px;line-height:1.6;">
                  © ${new Date().getFullYear()} TuGabinete. Todos los derechos reservados.<br/>
                  Este es un correo automático. Por favor no respondas a este mensaje.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export async function sendVerificationEmail({ name, email, token }) {
  const safeName = escapeHtml(name || "Profesional");
  const verifyUrl = buildVerifyUrl(token);
  const subject = "Confirmá tu correo para activar TuGabinete";
  const preheader =
    "Un último paso: verificá tu cuenta para empezar a usar TuGabinete.";

  const html = buildEmailShell({
    subject,
    preheader,
    greeting: `Hola, ${safeName}`,
    lead:
      "Gracias por registrarte en <strong>TuGabinete</strong>. Para activar tu cuenta y empezar a usar la plataforma, confirmá tu correo haciendo clic en el botón:",
    ctaLabel: "Verificar cuenta",
    ctaUrl: verifyUrl,
    expiresText: `Este enlace vence en ${VERIFICATION_TTL_MINUTES} minutos.`,
    ignoreText:
      "Si vos no creaste una cuenta en TuGabinete, podés ignorar este correo con tranquilidad.",
  });

  const text = `
TuGabinete - Verificación de cuenta

Hola, ${name || "Profesional"}.

Gracias por registrarte en TuGabinete.
Para activar tu cuenta, abrí este enlace:
${verifyUrl}

Este enlace vence en ${VERIFICATION_TTL_MINUTES} minutos.

Si vos no creaste una cuenta, podés ignorar este correo.
`;

  await mailer.sendMail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail({ name, email, token }) {
  const safeName = escapeHtml(name || "Profesional");
  const resetUrl = buildResetPasswordUrl(token);
  const subject = "Restablecé tu contraseña de TuGabinete";
  const preheader =
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta.";

  const html = buildEmailShell({
    subject,
    preheader,
    greeting: `Hola, ${safeName}`,
    lead:
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>TuGabinete</strong>. Hacé clic en el botón para crear una nueva contraseña.",
    ctaLabel: "Restablecer contraseña",
    ctaUrl: resetUrl,
    expiresText: `Este enlace vence en ${PASSWORD_RESET_TTL_MINUTES} minutos.`,
    ignoreText:
      "Si vos no solicitaste este cambio, ignorá este correo. Tu contraseña actual seguirá siendo válida hasta que completes el proceso.",
  });

  const text = `
TuGabinete - Restablecimiento de contraseña

Hola, ${name || "Profesional"}.

Recibimos una solicitud para restablecer la contraseña de tu cuenta.
Abrí este enlace para crear una nueva contraseña:
${resetUrl}

Este enlace vence en ${PASSWORD_RESET_TTL_MINUTES} minutos.

Si vos no solicitaste este cambio, ignorá este correo.
`;

  await mailer.sendMail({
    to: email,
    subject,
    text,
    html,
  });
}