import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as repo from "./auth.repository.js";
import { mailer } from "../../config/mailer.js";

const VERIFICATION_TTL_MINUTES = 15;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const buildVerifyUrl = (token) =>
  `${process.env.BASE_URL}/api/auth/verify/${token}`;

async function issueFreshVerificationToken(userId) {
  await repo.deleteVerificationTokensByUserId(userId);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000
  );

  await repo.createVerificationToken(userId, token, expiresAt);

  return { token, expiresAt };
}

async function sendVerificationEmail({ name, email, token }) {
  const verifyUrl = buildVerifyUrl(token);
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
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
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
                  Hola, ${name} 👋
                </div>

                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#374151;font-size:14px;line-height:1.6;margin-top:10px;">
                  Gracias por registrarte en <strong>TuGabinete</strong>. Para activar tu cuenta y empezar a usar la plataforma,
                  confirmá tu correo haciendo clic en el botón:
                </div>

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
                  Este enlace vence en ${VERIFICATION_TTL_MINUTES} minutos.<br/>
                  Si vos no creaste una cuenta en TuGabinete, podés ignorar este correo con tranquilidad.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 26px 22px 26px;background:#ffffff;">
                <div style="font-family:Poppins, Arial, Helvetica, sans-serif;color:#9ca3af;font-size:11.5px;line-height:1.6;">
                  © ${new Date().getFullYear()} TuGabinete. Todos los derechos reservados.<br/>
                  Este es un correo automático, por favor no respondas a este mensaje.
                </div>
              </td>
            </tr>

          </table>

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

Este enlace vence en ${VERIFICATION_TTL_MINUTES} minutos.

Si vos no creaste una cuenta, podés ignorar este correo.
`;

  await mailer.sendMail({
    from: `"TuGabinete" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text,
    html,
  });
}

export const register = async (data) => {
  const name = String(data.name ?? "").trim();
  const email = normalizeEmail(data.email);
  const password = data.password;

  console.log("1) register start:", email);

  const existingUser = await repo.findUserByEmail(email);
  console.log("2) existing user:", !!existingUser);

  if (existingUser?.isVerified) {
    return {
      status: 409,
      ok: false,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "Ya existe una cuenta registrada con este correo.",
    };
  }

  const hashed = await bcrypt.hash(password, 10);
  console.log("3) password hashed");

  let user;
  let status;
  let code;
  let message;

  if (existingUser) {
    console.log(
      "4) existing user not verified, refreshing pending registration:",
      existingUser.id
    );

    user = await repo.updateUser(existingUser.id, {
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    status = 200;
    code = "EMAIL_ALREADY_PENDING_VERIFICATION";
    message =
      "Tu cuenta ya existe pero todavía no fue verificada. Te reenviamos el correo.";
  } else {
    user = await repo.createUser({
      name,
      email,
      password: hashed,
    });

    console.log("5) user created:", user.id);

    status = 201;
    code = "VERIFY_EMAIL_SENT";
    message = "Correo de verificación enviado.";
  }

  const { token } = await issueFreshVerificationToken(user.id);
  console.log("6) fresh verification token created");

  try {
    console.log("7) before sendMail");
    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      token,
    });
    console.log("8) after sendMail");
  } catch (err) {
    console.error("❌ register mail error:", err);

    return {
      status: 503,
      ok: false,
      code: "MAIL_SEND_FAILED",
      message:
        "No pudimos enviar el correo de verificación. Intentá nuevamente en unos minutos.",
      email: user.email,
    };
  }

  return {
    status,
    ok: true,
    code,
    message,
    email: user.email,
    expiresInMinutes: VERIFICATION_TTL_MINUTES,
  };
};

export const resendVerification = async (data) => {
  const email = normalizeEmail(data.email);

  const user = await repo.findUserByEmail(email);

  if (!user) {
    return {
      status: 404,
      ok: false,
      code: "PENDING_ACCOUNT_NOT_FOUND",
      message: "No existe una cuenta pendiente con ese correo.",
    };
  }

  if (user.isVerified) {
    return {
      status: 409,
      ok: false,
      code: "EMAIL_ALREADY_VERIFIED",
      message: "Esa cuenta ya fue verificada. Iniciá sesión.",
    };
  }

  const { token } = await issueFreshVerificationToken(user.id);

  try {
    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("❌ resendVerification mail error:", err);

    return {
      status: 503,
      ok: false,
      code: "MAIL_SEND_FAILED",
      message:
        "No pudimos reenviar el correo de verificación. Intentá nuevamente en unos minutos.",
      email: user.email,
    };
  }

  return {
    status: 200,
    ok: true,
    code: "VERIFICATION_EMAIL_RESENT",
    message: "Te reenviamos el correo de verificación.",
    email: user.email,
    expiresInMinutes: VERIFICATION_TTL_MINUTES,
  };
};

export const login = async (data) => {
  const email = normalizeEmail(data.email);
  const { password } = data;

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
  const record = await repo.findVerificationTokenWithUser(token);

  if (!record) {
    return {
      redirectUrl: `${process.env.FRONTEND_URL}/verify?status=invalid`,
    };
  }

  const now = new Date();

  if (now > new Date(record.expiresAt)) {
    await repo.deleteVerificationToken(token);

    return {
      redirectUrl: `${process.env.FRONTEND_URL}/verify?status=expired`,
    };
  }

  await repo.verifyUser(record.userId);
  await repo.deleteVerificationTokensByUserId(record.userId);

  return {
    redirectUrl: `${process.env.FRONTEND_URL}/verify?status=success`,
  };
};