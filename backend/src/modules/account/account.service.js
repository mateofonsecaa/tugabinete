import bcrypt from "bcryptjs";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import * as repo from "./account.repository.js";
import {
  sendEmailChangeNoticeEmail,
  sendEmailChangeVerificationEmail,
} from "./account.email.js";
import {
  validateEmailChangeInput,
  validatePasswordChangeInput,
  validateProfileUpdateInput,
} from "./account.validation.js";
import {
  generateOpaqueToken,
  getRequestIp,
  getRequestUserAgent,
  hashToken,
  PASSWORD_HASH_ROUNDS,
} from "../auth/auth.security.js";
import { normalizeEmail } from "../auth/auth.validation.js";
import {
  deleteFromSupabase,
  uploadToSupabase,
} from "../../core/utils/upload.js";
import {
  generateRefreshToken,
  getInitialRefreshExpiresAt,
  hashRefreshToken,
  newSessionFamilyId,
  newSessionId,
  signAccessToken,
} from "../auth/auth.tokens.js";

const EMAIL_CHANGE_TTL_MINUTES = 60;
const ALLOWED_AVATAR_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_AVATAR_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

function createAppError(status, code, message, fieldErrors) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
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
    profileImage: user.profileImage ?? null,
    emailVerified: user.isVerified,
  };
}

async function createFreshSessionForUser(user, req) {
  const sessionId = newSessionId();
  const familyId = newSessionFamilyId();
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getInitialRefreshExpiresAt();

  const prisma = (await import("../../config/prisma.js")).default;

  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      familyId,
      tokenHash,
      expiresAt,
      ip: getRequestIp(req),
      userAgent: getRequestUserAgent(req),
      lastUsedAt: new Date(),
    },
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

export async function getAccount(userId) {
  const user = await repo.findPublicUserById(userId);

  if (!user) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  return toPublicUser(user);
}

export async function updateProfile(userId, payload) {
  const validated = validateProfileUpdateInput(payload);

  if (!validated.ok) {
    throw createAppError(
      400,
      "PROFILE_VALIDATION_FAILED",
      "Revisá los campos marcados.",
      validated.fieldErrors
    );
  }

  const { firstName, lastName, displayName, profession, phone, bio } =
    validated.data;

  const updated = await repo.updateProfileFields(userId, {
    firstName,
    lastName,
    displayName,
    profession,
    phone,
    bio,
    name: `${firstName} ${lastName}`.trim(),
  });

  return {
    message: "Perfil actualizado correctamente.",
    user: toPublicUser(updated),
  };
}

export async function updateAvatar(userId, file) {
  if (!file?.buffer) {
    throw createAppError(
      400,
      "AVATAR_REQUIRED",
      "Seleccioná una imagen para continuar."
    );
  }

  const fileType = await fileTypeFromBuffer(file.buffer);

  if (!fileType || !ALLOWED_AVATAR_MIME.has(fileType.mime)) {
    throw createAppError(
      400,
      "INVALID_AVATAR_TYPE",
      "Formato de imagen no permitido. Usá JPG, PNG o WEBP."
    );
  }

  if (!ALLOWED_AVATAR_EXT.has(fileType.ext)) {
    throw createAppError(
      400,
      "INVALID_AVATAR_EXTENSION",
      "Formato de imagen no permitido."
    );
  }

  const image = sharp(file.buffer, { failOn: "error" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw createAppError(
      400,
      "INVALID_AVATAR_IMAGE",
      "No se pudo procesar la imagen."
    );
  }

  if (metadata.width < 256 || metadata.height < 256) {
    throw createAppError(
      400,
      "AVATAR_TOO_SMALL",
      "La imagen debe medir al menos 256x256 píxeles."
    );
  }

  const processedBuffer = await image
    .rotate()
    .resize(512, 512, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 86 })
    .toBuffer();

  const currentUser = await repo.findPublicUserById(userId);

  if (!currentUser) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  const { publicUrl, objectPath } = await uploadToSupabase(processedBuffer, {
    folder: `profile-avatars/user-${userId}`,
    filename: `avatar-${Date.now()}.webp`,
    contentType: "image/webp",
  });

  const updatedUser = await repo.updateAvatarFields(
    userId,
    publicUrl,
    objectPath
  );

  if (currentUser.profileImagePath && currentUser.profileImagePath !== objectPath) {
    try {
      await deleteFromSupabase(currentUser.profileImagePath);
    } catch (err) {
      console.warn("No se pudo borrar el avatar anterior:", err?.message || err);
    }
  }

  return {
    message: "Foto de perfil actualizada correctamente.",
    user: toPublicUser(updatedUser),
  };
}

export async function deleteAvatar(userId) {
  const currentUser = await repo.findPublicUserById(userId);

  if (!currentUser) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  if (currentUser.profileImagePath) {
    try {
      await deleteFromSupabase(currentUser.profileImagePath);
    } catch (err) {
      console.warn("No se pudo borrar el avatar:", err?.message || err);
    }
  }

  const updatedUser = await repo.clearAvatarFields(userId);

  return {
    message: "La foto de perfil fue eliminada.",
    user: toPublicUser(updatedUser),
  };
}

export async function requestEmailChange(userId, payload) {
  const validated = validateEmailChangeInput(payload);

  if (!validated.ok) {
    throw createAppError(
      400,
      "EMAIL_CHANGE_VALIDATION_FAILED",
      "Revisá los campos marcados.",
      validated.fieldErrors
    );
  }

  const { newEmail, currentPassword } = validated.data;

  const user = await repo.findSensitiveUserById(userId);

  if (!user) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  if (normalizeEmail(user.email) === newEmail) {
    throw createAppError(
      409,
      "EMAIL_UNCHANGED",
      "El nuevo correo no puede ser igual al actual.",
      {
        newEmail: "Ingresá un correo distinto al actual.",
      }
    );
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.password);

  if (!passwordOk) {
    throw createAppError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "La contraseña actual es incorrecta.",
      {
        currentPassword: "La contraseña actual es incorrecta.",
      }
    );
  }

  const emailInUse = await repo.findUserByEmailOrPendingEmail(newEmail, userId);

  if (emailInUse) {
    throw createAppError(
      409,
      "EMAIL_ALREADY_IN_USE",
      "Ese correo ya está en uso.",
      {
        newEmail: "Ese correo ya está en uso.",
      }
    );
  }

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + EMAIL_CHANGE_TTL_MINUTES * 60 * 1000
  );

  await repo.createEmailChangeRequest({
    userId,
    newEmail,
    tokenHash,
    expiresAt,
    requestedIp: null,
    requestedUserAgent: null,
  });

  const apiBase = process.env.API_PUBLIC_URL;
  if (!apiBase) {
    throw createAppError(
      500,
      "API_PUBLIC_URL_MISSING",
      "Falta configurar API_PUBLIC_URL."
    );
  }

  const confirmUrl = `${apiBase}/api/account/email/confirm/${rawToken}`;

  await sendEmailChangeVerificationEmail({
    name: user.displayName || user.firstName || user.name,
    email: newEmail,
    confirmUrl,
  });

  await sendEmailChangeNoticeEmail({
    name: user.displayName || user.firstName || user.name,
    currentEmail: user.email,
    newEmail,
  });

  return {
    message:
      "Te enviamos un enlace al nuevo correo para confirmar el cambio.",
    pendingEmail: newEmail,
  };
}

export async function confirmEmailChange(rawToken) {
  const token = String(rawToken ?? "").trim();

  if (!token) {
    return { status: "invalid" };
  }

  const tokenHash = hashToken(token);
  const record = await repo.findEmailChangeTokenByHash(tokenHash);

  if (!record) {
    return { status: "invalid" };
  }

  if (record.usedAt) {
    return { status: "used" };
  }

  if (new Date(record.expiresAt) <= new Date()) {
    await repo.clearPendingEmailState(record.userId);
    return { status: "expired" };
  }

  try {
    await repo.consumeEmailChangeToken({
      emailChangeTokenId: record.id,
      userId: record.userId,
      newEmail: record.newEmail,
    });
  } catch (err) {
    if (err?.code === "EMAIL_CHANGE_NOT_USABLE") {
      return { status: "used" };
    }
    throw err;
  }

  return { status: "success" };
}

export async function changePassword(userId, payload, req) {
  const validated = validatePasswordChangeInput(payload);

  if (!validated.ok) {
    throw createAppError(
      400,
      "PASSWORD_CHANGE_VALIDATION_FAILED",
      "Revisá los campos marcados.",
      validated.fieldErrors
    );
  }

  const { currentPassword, newPassword } = validated.data;

  const user = await repo.findSensitiveUserById(userId);

  if (!user) {
    throw createAppError(404, "USER_NOT_FOUND", "Usuario no encontrado.");
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.password);

  if (!currentMatches) {
    throw createAppError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "La contraseña actual es incorrecta.",
      {
        currentPassword: "La contraseña actual es incorrecta.",
      }
    );
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (sameAsCurrent) {
    throw createAppError(
      400,
      "PASSWORD_UNCHANGED",
      "La nueva contraseña no puede ser igual a la actual.",
      {
        newPassword: "Elegí una contraseña distinta a la actual.",
      }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);

  const updatedUser = await repo.updatePasswordAndInvalidateSessions({
    userId,
    passwordHash,
  });

  const session = await createFreshSessionForUser(updatedUser, req);

  return {
    message:
      "Contraseña actualizada correctamente. Cerramos las demás sesiones por seguridad.",
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
    user: toPublicUser(updatedUser),
  };
}

export async function logoutOtherSessions(userId, currentSessionId) {
  await repo.revokeOtherSessions({
    userId,
    currentSessionId,
  });

  return {
    message: "Se cerraron las demás sesiones activas.",
  };
}