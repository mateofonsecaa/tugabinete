import prisma from "../../config/prisma.js";

export const PUBLIC_USER_SELECT = {
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
  profileImage: true,
  profileImagePath: true,
  isVerified: true,
  authTokenVersion: true,
};

export const findPublicUserById = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });
};

export const findSensitiveUserById = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...PUBLIC_USER_SELECT,
      password: true,
    },
  });
};

export const updateProfileFields = (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: PUBLIC_USER_SELECT,
  });
};

export const findUserByEmailOrPendingEmail = (email, excludeUserId) => {
  return prisma.user.findFirst({
    where: {
      id: excludeUserId ? { not: excludeUserId } : undefined,
      OR: [{ email }, { pendingEmail: email }],
    },
    select: { id: true },
  });
};

export const createEmailChangeRequest = ({
  userId,
  newEmail,
  tokenHash,
  expiresAt,
  requestedIp,
  requestedUserAgent,
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.emailChangeToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailRequestedAt: new Date(),
      },
    });

    await tx.emailChangeToken.create({
      data: {
        userId,
        newEmail,
        tokenHash,
        expiresAt,
        requestedIp,
        requestedUserAgent,
      },
    });

    return true;
  });
};

export const findEmailChangeTokenByHash = (tokenHash) => {
  return prisma.emailChangeToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          ...PUBLIC_USER_SELECT,
          password: true,
        },
      },
    },
  });
};

export const consumeEmailChangeToken = ({
  emailChangeTokenId,
  userId,
  newEmail,
}) => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const claimed = await tx.emailChangeToken.updateMany({
      where: {
        id: emailChangeTokenId,
        userId,
        newEmail,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
      },
    });

    if (claimed.count !== 1) {
      const err = new Error("El cambio de correo ya no es válido.");
      err.code = "EMAIL_CHANGE_NOT_USABLE";
      throw err;
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        pendingEmail: null,
        pendingEmailRequestedAt: null,
      },
      select: PUBLIC_USER_SELECT,
    });

    await tx.emailChangeToken.deleteMany({
      where: { userId },
    });

    return updatedUser;
  });
};

export const clearPendingEmailState = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      pendingEmail: null,
      pendingEmailRequestedAt: null,
    },
    select: PUBLIC_USER_SELECT,
  });
};

export const updateAvatarFields = (userId, profileImage, profileImagePath) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      profileImage,
      profileImagePath,
    },
    select: PUBLIC_USER_SELECT,
  });
};

export const clearAvatarFields = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      profileImage: null,
      profileImagePath: null,
    },
    select: PUBLIC_USER_SELECT,
  });
};

export const updatePasswordAndInvalidateSessions = async ({
  userId,
  passwordHash,
}) => {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        authTokenVersion: {
          increment: 1,
        },
      },
      select: PUBLIC_USER_SELECT,
    });

    await tx.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokeReason: "PASSWORD_CHANGED",
      },
    });

    return updatedUser;
  });
};

export const revokeOtherSessions = ({
  userId,
  currentSessionId,
  reason = "LOGOUT_OTHERS",
}) => {
  return prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      id: { not: currentSessionId || undefined },
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
};