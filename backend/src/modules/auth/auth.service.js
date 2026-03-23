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
import { buildUserAvatarUrl } from "../../core/storage/storage.service.js";
import {
  normalizeEmail,
  validatePasswordPolicy,
} from "./auth.validation.js";
import {
  generateRefreshToken,
  getInitialRefreshExpiresAt,
  hashRefreshToken,
  newSessionFamilyId,
  newSessionId,
  signAccessToken,
} from "./auth.tokens.js";
import { readRefreshCookie } from "./auth.cookies.js";

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

const REFRESH_ROTATION_GRACE_MS = 10_000;

function createAppError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || null;
}

function getClientUserAgent(req) {
  return req.headers["user-agent"] || null;
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: user.displayName ?? null,
    email: user.email,
    pendingEmail: user.pendingEmail ?? null,
    profession: user.profession ?? null,
    phone: user.phone ?? null,
    bio: user.bio ?? null,
    profileImage: buildUserAvatarUrl(user),
    emailVerified: user.isVerified,
  };
}

function splitName(fullName = "") {
  const cleaned = String(fullName).replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return { firstName: "", lastName: "" };
  }

  const parts = cleaned.split(" ");

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

async function createSessionForUser(user, req) {
  const sessionId = newSessionId();
  const familyId = newSessionFamilyId();
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getInitialRefreshExpiresAt();

  await repo.createAuthSession({
    id: sessionId,
    userId: user.id,
    familyId,
    tokenHash,
    expiresAt,
    ip: getClientIp(req),
    userAgent: getClientUserAgent(req),
    lastUsedAt: new Date(),
  });

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    sessionId,
    tokenVersion: user.authTokenVersion ?? 0,
  });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
  };
}

export const register = async (data) => {
  const name = String(data.name ?? "").trim();
  const email = normalizeEmail(data.email);
  const password = String(data.password ?? "");
  const { firstName, lastName } = splitName(name);

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
      firstName,
      lastName,
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
      firstName,
      lastName,
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

export const login = async (data, req) => {
  const email = normalizeEmail(data.email);
  const password = String(data.password ?? "");

  const user = await repo.findUserByEmail(email);

  if (!user) {
    throw createAppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas.");
  }

  if (!user.isVerified) {
    throw createAppError(403, "EMAIL_NOT_VERIFIED", "Cuenta no verificada.");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw createAppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas.");
  }

  const session = await createSessionForUser(user, req);

  return {
    message: `Bienvenida, ${user.name}!`,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
    user: toPublicUser(user),
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

export const refreshSession = async (req) => {
  const rawRefreshToken = readRefreshCookie(req);

  if (!rawRefreshToken) {
    throw createAppError(
      401,
      "NO_REFRESH_COOKIE",
      "No hay una sesión activa para restaurar."
    );
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const session = await repo.findAuthSessionByTokenHash(tokenHash);

  if (!session) {
    throw createAppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "La sesión no es válida."
    );
  }

  const now = new Date();

  if (!session.user) {
    throw createAppError(401, "USER_NOT_FOUND", "Usuario no válido.");
  }

  if (session.revokedAt) {
    if (
      session.revokeReason === "ROTATED" &&
      session.replacedBySessionId
    ) {
      const replacement = await repo.findAuthSessionById(
        session.replacedBySessionId
      );

      const rotatedRecently =
        replacement &&
        Date.now() - new Date(replacement.createdAt).getTime() <=
          REFRESH_ROTATION_GRACE_MS;

      const sameUserAgent =
        replacement?.userAgent === getClientUserAgent(req);

      if (rotatedRecently && sameUserAgent) {
        throw createAppError(
          409,
          "REFRESH_RACE",
          "Otra pestaña ya renovó la sesión. Reintentá."
        );
      }

      await repo.revokeAuthSessionFamily(
        session.familyId,
        "REFRESH_TOKEN_REUSED"
      );
      await repo.bumpUserAuthTokenVersion(session.userId);

      throw createAppError(
        401,
        "REFRESH_TOKEN_REUSED",
        "Se detectó reutilización de refresh token. Cerramos tus sesiones por seguridad."
      );
    }

    throw createAppError(
      401,
      "REFRESH_TOKEN_REVOKED",
      "La sesión fue revocada. Iniciá sesión nuevamente."
    );
  }

  if (new Date(session.expiresAt) <= now) {
    await repo.revokeAuthSessionById(session.id, "EXPIRED");

    throw createAppError(
      401,
      "REFRESH_TOKEN_EXPIRED",
      "La sesión venció. Iniciá sesión nuevamente."
    );
  }

  const newSessionIdValue = newSessionId();
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);

  const rotated = await repo.rotateAuthSession({
    currentSessionId: session.id,
    newSessionId: newSessionIdValue,
    newTokenHash,
    expiresAt: session.expiresAt,
    ip: getClientIp(req),
    userAgent: getClientUserAgent(req),
  });

  if (!rotated) {
    throw createAppError(
      409,
      "REFRESH_RACE",
      "Otra pestaña ya renovó la sesión. Reintentá."
    );
  }

  const accessToken = signAccessToken({
    userId: session.user.id,
    email: session.user.email,
    sessionId: newSessionIdValue,
    tokenVersion: session.user.authTokenVersion ?? 0,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt: session.expiresAt,
  };
};

export const logout = async (req) => {
  const rawRefreshToken = readRefreshCookie(req);

  if (!rawRefreshToken) {
    return true;
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const session = await repo.findAuthSessionByTokenHash(tokenHash);

  if (!session || session.revokedAt) {
    return true;
  }

  await repo.revokeAuthSessionById(session.id, "LOGOUT_CURRENT");

  return true;
};

export const logoutAll = async (userId) => {
  await repo.revokeAllUserAuthSessions(userId, "LOGOUT_ALL");
  await repo.bumpUserAuthTokenVersion(userId);
  return true;
};