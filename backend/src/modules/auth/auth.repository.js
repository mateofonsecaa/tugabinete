import prisma from "../../config/prisma.js";

export const createUser = (data) => {
  return prisma.user.create({
    data: { ...data, isVerified: false },
  });
};

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
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

    return true;
  });
};