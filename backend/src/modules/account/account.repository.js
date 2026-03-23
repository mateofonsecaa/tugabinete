import prisma from "../../config/prisma.js";

const FEEDBACK_ATTACHMENT_FILE_SELECT = {
  id: true,
  bucket: true,
  objectPath: true,
  visibility: true,
  status: true,
  deletedAt: true,
};

export function findRecentDuplicate({ userId, descriptionHash, afterDate }) {
  return prisma.feedbackItem.findFirst({
    where: {
      userId,
      descriptionHash,
      createdAt: {
        gte: afterDate,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

export function createItem(data) {
  return prisma.feedbackItem.create({
    data,
    include: {
      attachmentFile: {
        select: FEEDBACK_ATTACHMENT_FILE_SELECT,
      },
    },
  });
}

export function attachFileToItem({
  feedbackId,
  userId,
  attachmentFileId,
  attachmentMime,
  attachmentSize,
}) {
  return prisma.feedbackItem.update({
    where: { id: feedbackId },
    data: {
      userId,
      attachmentFileId,
      attachmentUrl: null,
      attachmentPath: null,
      attachmentMime,
      attachmentSize,
    },
    include: {
      attachmentFile: {
        select: FEEDBACK_ATTACHMENT_FILE_SELECT,
      },
    },
  });
}

export function deleteItem({ feedbackId, userId }) {
  return prisma.feedbackItem.deleteMany({
    where: {
      id: feedbackId,
      userId,
    },
  });
}

export function listPublic({ userId, category, sort }) {
  return prisma.feedbackItem.findMany({
    where: {
      visibility: "PUBLIC",
      ...(category ? { category } : {}),
    },
    select: {
      id: true,
      category: true,
      description: true,
      votesCount: true,
      createdAt: true,
      status: true,
      attachmentFile: {
        select: FEEDBACK_ATTACHMENT_FILE_SELECT,
      },
      votes: {
        where: { userId },
        select: { id: true },
        take: 1,
      },
    },
    orderBy:
      sort === "new"
        ? [{ createdAt: "desc" }]
        : [{ votesCount: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}

export function findPublicById(id) {
  return prisma.feedbackItem.findFirst({
    where: {
      id,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      votesCount: true,
    },
  });
}

export async function createVoteAndIncrement({ feedbackId, userId }) {
  return prisma.$transaction(async (tx) => {
    const existingVote = await tx.feedbackVote.findUnique({
      where: {
        feedbackId_userId: {
          feedbackId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingVote) {
      return null;
    }

    await tx.feedbackVote.create({
      data: {
        feedbackId,
        userId,
      },
    });

    return tx.feedbackItem.update({
      where: { id: feedbackId },
      data: {
        votesCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        votesCount: true,
      },
    });
  });
}

export async function deleteVoteAndDecrement({ feedbackId, userId }) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.feedbackVote.deleteMany({
      where: {
        feedbackId,
        userId,
      },
    });

    if (deleted.count === 0) {
      return null;
    }

    const currentItem = await tx.feedbackItem.findUnique({
      where: { id: feedbackId },
      select: { votesCount: true },
    });

    const nextVotesCount = Math.max(
      0,
      (currentItem?.votesCount || 0) - deleted.count
    );

    return tx.feedbackItem.update({
      where: { id: feedbackId },
      data: {
        votesCount: nextVotesCount,
      },
      select: {
        id: true,
        votesCount: true,
      },
    });
  });
}