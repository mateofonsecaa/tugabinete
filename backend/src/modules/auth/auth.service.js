import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as repo from "./auth.repository.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "./auth.email.js";
import {
  generateOpaqueToken,
  getRequestIp,
  getRequestUserAgent,
  hashToken,
  PASSWORD_HASH_ROUNDS,
  PASSWORD_RESET_TTL_MINUTES,
  VERIFICATION_TTL_MINUTES,
} from "./auth.security.js";
import {
  normalizeEmail,
  validatePasswordPolicy,
} from "./auth.validation.js";

const GENERIC_FORGOT_PASSWORD_RESPONSE = {
  status: 200,
  ok: true,
  code: "PASSWORD_RESET_REQUEST_ACCEPTED",
  message:
    "Si el correo ingresado está registrado, te vamos a enviar un enlace para restablecer tu contraseña.",
};

async function issueFreshVerificationToken(userId) {
  await repo.deleteVerificationTokensByUserId(userId);

  const token = generateOpaqueToken();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000
  );

  await repo.createVerificationToken(userId, token, expiresAt);

  return { token, expiresAt };
}

async function issueFreshPasswordResetToken(userId, req) {
  await repo.deleteActivePasswordResetTokensByUserId(userId);

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
  );

  await repo.createPasswordResetToken({
    userId,
    tokenHash,
    expiresAt,
    requestedIp: getRequestIp(req),
    requestedUserAgent: getRequestUserAgent(req),
  });

  return {
    rawToken,
    expiresAt,
  };
}

async function inspectPasswordResetToken(rawToken) {
  const token = String(rawToken ?? "").trim();

  if (!token) {
    return {
      ok: false,
      response: {
        status: 400,
        ok: false,
        code: "INVALID_RESET_TOKEN",
        message: "El enlace de recuperación es inválido o incompleto.",
      },
    };
  }

  const tokenHash = hashToken(token);
  const record = await repo.findPasswordResetTokenByHash(tokenHash);

  if (!record) {
    return {
      ok: false,
      response: {
        status: 400,
        ok: false,
        code: "INVALID_RESET_TOKEN",
        message: "El enlace de recuperación es inválido o no existe.",
      },
    };
  }

  if (record.usedAt) {
    return {
      ok: false,
      response: {
        status: 409,
        ok: false,
        code: "USED_RESET_TOKEN",
        message: "Este enlace ya fue utilizado. Solicitá uno nuevo.",
      },
    };
  }

  if (new Date(record.expiresAt) <= new Date()) {
    return {
      ok: false,
      response: {
        status: 410,
        ok: false,
        code: "EXPIRED_RESET_TOKEN",
        message: "Este enlace venció. Solicitá uno nuevo.",
      },
    };
  }

  return {
    ok: true,
    record,
  };
}

export const register = async (data) => {
  const name = String(data.name ?? "").trim();
  const email = normalizeEmail(data.email);
  const password = String(data.password ?? "");

  const existingUser = await repo.findUserByEmail(email);

  if (existingUser?.isVerified) {
    return {
      status: 409,
      ok: false,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "Ya existe una cuenta registrada con este correo.",
    };
  }

  const hashed = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  let user;
  let status;
  let code;
  let message;

  if (existingUser) {
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

    status = 201;
    code = "VERIFY_EMAIL_SENT";
    message = "Correo de verificación enviado.";
  }

  const { token } = await issueFreshVerificationToken(user.id);

  try {
    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("register mail error:", err?.message || err);

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
    console.error("resendVerification mail error:", err?.message || err);

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
    {
      id: user.id,
      email: user.email,
      tokenVersion: user.authTokenVersion ?? 0,
    },
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

export const forgotPassword = async (data, req) => {
  const email = normalizeEmail(data?.email);

  if (!email) {
    return GENERIC_FORGOT_PASSWORD_RESPONSE;
  }

  const user = await repo.findUserByEmail(email);

  if (!user || !user.isVerified) {
    return GENERIC_FORGOT_PASSWORD_RESPONSE;
  }

  const { rawToken } = await issueFreshPasswordResetToken(user.id, req);

  void sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    token: rawToken,
  }).catch((err) => {
    console.error("forgotPassword mail error:", err?.message || err);
  });

  return GENERIC_FORGOT_PASSWORD_RESPONSE;
};

export const validateResetToken = async (data) => {
  const inspection = await inspectPasswordResetToken(data?.token);

  if (!inspection.ok) {
    return inspection.response;
  }

  return {
    status: 200,
    ok: true,
    code: "VALID_RESET_TOKEN",
    message: "Token válido. Ya podés restablecer tu contraseña.",
  };
};

export const resetPassword = async (data, req) => {
  const password = String(data?.password ?? "");
  const confirmPassword = String(data?.confirmPassword ?? "");
  const token = String(data?.token ?? "");

  const policy = validatePasswordPolicy({
    password,
    confirmPassword,
    requireConfirmation: true,
  });

  if (!policy.ok) {
    return {
      status: 400,
      ok: false,
      code: "PASSWORD_VALIDATION_FAILED",
      message: "Revisá los campos marcados.",
      fieldErrors: policy.errors,
    };
  }

  const inspection = await inspectPasswordResetToken(token);

  if (!inspection.ok) {
    return inspection.response;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  try {
    await repo.consumePasswordResetTokenAndUpdatePassword({
      resetTokenId: inspection.record.id,
      userId: inspection.record.userId,
      passwordHash,
      consumedIp: getRequestIp(req),
      consumedUserAgent: getRequestUserAgent(req),
    });
  } catch (err) {
    if (err?.code === "RESET_TOKEN_NOT_USABLE") {
      return {
        status: 409,
        ok: false,
        code: "USED_RESET_TOKEN",
        message: "Este enlace ya no está disponible. Solicitá uno nuevo.",
      };
    }

    throw err;
  }

  return {
    status: 200,
    ok: true,
    code: "PASSWORD_RESET_SUCCESS",
    message:
      "Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión.",
  };
};