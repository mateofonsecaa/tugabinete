import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function getFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER;
}

export async function sendEmailChangeVerificationEmail({
  name,
  email,
  confirmUrl,
}) {
  const transport = getTransporter();

  await transport.sendMail({
    from: getFrom(),
    to: email,
    subject: "Confirmá tu nuevo correo en TuGabinete",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Confirmá tu nuevo correo</h2>
        <p>Hola ${name || "Profesional"}, recibimos una solicitud para cambiar el correo de tu cuenta.</p>
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
  const transport = getTransporter();

  await transport.sendMail({
    from: getFrom(),
    to: currentEmail,
    subject: "Se solicitó un cambio de correo en TuGabinete",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Solicitud de cambio de correo</h2>
        <p>Hola ${name || "Profesional"}, se solicitó cambiar el correo de tu cuenta a <strong>${newEmail}</strong>.</p>
        <p>El cambio no se aplicará hasta que el nuevo correo sea confirmado.</p>
        <p>Si no fuiste vos, cambiá tu contraseña cuanto antes.</p>
      </div>
    `,
  });
}