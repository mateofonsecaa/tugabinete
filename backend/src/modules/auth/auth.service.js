// auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as repo from "./auth.repository.js";
import { mailer } from "../../config/mailer.js";

export const register = async (data) => {
  const { name, email, password } = data;

  const hashed = await bcrypt.hash(password, 10);
  const user = await repo.createUser({
    name,
    email,
    password: hashed,
  });

  const token = crypto.randomBytes(32).toString("hex");
  await repo.createVerificationToken(user.id, token);

  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify/${token}`;

  const subject = "Confirmá tu correo para activar TuGabinete";
  const preheader =
    "Un último paso: verificá tu cuenta para empezar a usar TuGabinete.";

  const html = `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#fff7f7;">
    <!-- Preheader (texto oculto que se ve en la bandeja) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f7;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,0.08);">
            
            <!-- Header -->
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

            <!-- Body -->
            <tr>
              <td style="padding:28px 26px 10px 26px;">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#111827;font-size:18px;font-weight:700;line-height:1.35;">
                  Hola, ${name} 👋
                </div>

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#374151;font-size:14px;line-height:1.6;margin-top:10px;">
                  Gracias por registrarte en <strong>TuGabinete</strong>. Para activar tu cuenta y empezar a usar la plataforma,
                  confirmá tu correo haciendo clic en el botón:
                </div>

                <!-- CTA -->
                <div style="text-align:center;margin:20px 0 18px 0;">
                  <a href="${verifyUrl}"
                     style="display:inline-block;background:#ffadad;color:#ffffff;text-decoration:none;
                            font-family:Poppins, Arial, Helvetica, sans-serif;font-size:14px;font-weight:700;
                            padding:12px 20px;border-radius:12px;">
                    Verificar cuenta
                  </a>
                </div>

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#6b7280;font-size:12.5px;line-height:1.6;">
                  Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                </div>

                <div style="font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:12.5px;line-height:1.6;margin-top:6px;word-break:break-all;">
                  <a href="${verifyUrl}" style="color:#ff7f7f;text-decoration:underline;">${verifyUrl}</a>
                </div>

                <hr style="border:none;border-top:1px solid #f1f5f9;margin:18px 0;" />

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#6b7280;font-size:12.5px;line-height:1.6;">
                  Si vos no creaste una cuenta en TuGabinete, podés ignorar este correo con tranquilidad.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 26px 22px 26px;background:#ffffff;">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#9ca3af;font-size:11.5px;line-height:1.6;">
                  © ${new Date().getFullYear()} TuGabinete. Todos los derechos reservados.<br/>
                  Este es un correo automático, por favor no respondas a este mensaje.
                </div>
              </td>
            </tr>

          </table>

          <!-- Outer small note -->
          <div style="max-width:560px;margin-top:14px;font-family:Poppins, Arial, Helvetica, sans-serif;color:#9ca3af;font-size:11.5px;line-height:1.5;text-align:center;">
            ¿Necesitás ayuda? Respondé este correo o escribinos desde la sección de soporte dentro de TuGabinete.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  const text = `
TuGabinete - Verificación de cuenta

Hola, ${name}!

Gracias por registrarte en TuGabinete.
Para activar tu cuenta, abrí este enlace:
${verifyUrl}

Si vos no creaste una cuenta, podés ignorar este correo.
`;

  await mailer.sendMail({
    from: `"TuGabinete" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text,
    html,
  });

  return { message: "Correo de verificación enviado." };
};

export const login = async (data) => {
  const { email, password } = data;

  const user = await repo.findUserByEmail(email);
  if (!user) throw new Error("Usuario no encontrado");
  if (!user.isVerified) throw new Error("Cuenta no verificada");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Contraseña incorrecta");

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  return {
    message: `Bienvenida, ${user.name}!`,
    token,
    user,
  };
};

export const verifyEmail = async (token) => {
  const record = await repo.findVerificationToken(token);
  if (!record) throw new Error("Token inválido o expirado");

  await repo.verifyUser(record.userId);
  await repo.deleteVerificationToken(token);

  return {
    redirectUrl: `${process.env.FRONTEND_URL}/verify?status=success`,
  };
};
