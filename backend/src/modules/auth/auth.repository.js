import prisma from "../../config/prisma.js";

export const createUser = (data) => {
    return prisma.user.create({
        data: { ...data, isVerified: false },
    });
};

export const findUserByEmail = (email) => {
    return prisma.user.findUnique({ where: { email } });
};

export const createVerificationToken = (userId, token) => {
    return prisma.verificationToken.create({
        data: { userId, token, createdAt: new Date() },
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
