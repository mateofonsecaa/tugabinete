import prisma from "../../config/prisma.js";

const AUTH_STORED_FILE_SELECT = {
  id: true,
  bucket: true,
  objectPath: true,
  visibility: true,
  status: true,
  deletedAt: true,
};

export const createUser = (data) => {
  return prisma.user.create({
    data: { ...data, isVerified: false },
  });
};

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      avatarFile: {
        select: AUTH_STORED_FILE_SELECT,
      },
    },
  });
};

export const createVerificationToken = (userId, token, expiresAt) => {
  return prisma.verificationToken.create({
    data: {
      userId,
      token,
      createdAt: new Date(),
      expiresAt,
    },
  });
};

export const findVerificationToken = (token) => {
  return prisma.verificationToken.findUnique({ where: { token } });
};

export const verifyUser = (id) => {
  return prisma.user.update({
    where: { id },
    data: { isVerified: true },
  });
};

export const deleteVerificationToken = (token) => {
  return prisma.verificationToken.delete({
    where: { token },
  });
};

export const findUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const findVerificationTokenWithUser = (token) => {
  return prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });
};

export const deleteUserById = (id) => {
  return prisma.user.delete({
    where: { id },
  });
};

export const deleteVerificationTokensByUserId = (userId) => {
  return prisma.verificationToken.deleteMany({
    where: { userId },
  });
};

export const createPasswordResetToken = (data) => {
  return prisma.passwordResetToken.create({
    data,
  });
};

export const deleteActivePasswordResetTokensByUserId = (userId) => {
  return prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  });
};

export const findPasswordResetTokenByHash = (tokenHash) => {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
};

export const consumePasswordResetTokenAndUpdatePassword = ({
  resetTokenId,
  userId,
  passwordHash,
  consumedIp,
  consumedUserAgent,
}) => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetTokenId,
        userId,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        usedAt: now,
        consumedIp,
        consumedUserAgent,
      },
    });

    if (claimed.count !== 1) {
      const error = new Error("El token de recuperación ya no es válido.");
      error.code = "RESET_TOKEN_NOT_USABLE";
      throw error;
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        authTokenVersion: {
          increment: 1,
        },
      },
    });

    await tx.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokeReason: "PASSWORD_RESET",
      },
    });

    return true;
  });
};

export const createAuthSession = (data) => {
  return prisma.authSession.create({ data });
};

export const findAuthSessionByTokenHash = (tokenHash) => {
  return prisma.authSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
          pendingEmail: true,
          profession: true,
          phone: true,
          bio: true,
          avatarFileId: true,
          avatarFile: {
            select: AUTH_STORED_FILE_SELECT,
          },
          isVerified: true,
          authTokenVersion: true,
        },
      },
    },
  });
};

export const findAuthSessionById = (id) => {
  return prisma.authSession.findUnique({
    where: { id },
  });
};

export const rotateAuthSession = ({
  currentSessionId,
  newSessionId,
  newTokenHash,
  expiresAt,
  ip,
  userAgent,
}) => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const current = await tx.authSession.findUnique({
      where: { id: currentSessionId },
    });

    if (!current) {
      return null;
    }

    const updated = await tx.authSession.updateMany({
      where: {
        id: currentSessionId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
        revokeReason: "ROTATED",
        replacedBySessionId: newSessionId,
        lastUsedAt: now,
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    return tx.authSession.create({
      data: {
        id: newSessionId,
        userId: current.userId,
        familyId: current.familyId,
        tokenHash: newTokenHash,
        expiresAt,
        ip,
        userAgent,
        lastUsedAt: now,
      },
    });
  });
};

export const revokeAuthSessionById = (id, reason) => {
  return prisma.authSession.updateMany({
    where: {
      id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
};

export const revokeAuthSessionFamily = (familyId, reason) => {
  return prisma.authSession.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
};

export const revokeAllUserAuthSessions = (userId, reason) => {
  return prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
};

export const bumpUserAuthTokenVersion = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      authTokenVersion: {
        increment: 1,
      },
    },
  });
};

export const findPublicUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
      pendingEmail: true,
      profession: true,
      phone: true,
      bio: true,
      avatarFileId: true,
      avatarFile: {
        select: AUTH_STORED_FILE_SELECT,
      },
      isVerified: true,
      authTokenVersion: true,
    },
  });
};