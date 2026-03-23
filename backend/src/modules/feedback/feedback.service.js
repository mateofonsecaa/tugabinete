import * as repository from "./feedback.repository.js";
import { uploadFeedbackAttachment } from "./feedback.storage.js";
import {
  buildStoredFilePublicUrl,
  queueFileDeletion,
} from "../../core/storage/storage.service.js";
import {
  buildDescriptionHash,
  getVisibilityForCategory,
  isPublicCategory,
  normalizeBoolean,
  normalizeCategory,
  sanitizeDescription,
  validateAttachment,
  validateDescription,
} from "./feedback.validation.js";

const DUPLICATE_WINDOW_IN_HOURS = 6;

export async function createFeedback({ userId, body, file }) {
  const category = normalizeCategory(body.category);
  const description = sanitizeDescription(body.description);
  const contactAllowed = normalizeBoolean(body.contactAllowed);
  const visibility = getVisibilityForCategory(category);

  validateDescription(description);
  validateAttachment(file);

  const descriptionHash = buildDescriptionHash(description);

  const duplicate = await repository.findRecentDuplicate({
    userId,
    descriptionHash,
    afterDate: new Date(
      Date.now() - DUPLICATE_WINDOW_IN_HOURS * 60 * 60 * 1000
    ),
  });

  if (duplicate) {
    throw new Error(
      "Ya enviaste una sugerencia igual hace poco. Esperá un poco antes de reenviarla."
    );
  }

    let created = await repository.createItem({
        userId,
        category,
        description,
        descriptionHash,
        visibility,
        contactAllowed,
        attachmentMime: null,
        attachmentSize: null,
        attachmentFileId: null,
    });

  if (file) {
    let uploadedFile = null;

    try {
      uploadedFile = await uploadFeedbackAttachment({
        userId,
        feedbackId: created.id,
        category,
        file,
      });

      created = await repository.attachFileToItem({
        feedbackId: created.id,
        userId,
        attachmentFileId: uploadedFile.id,
        attachmentMime: uploadedFile.mimeType,
        attachmentSize: uploadedFile.sizeBytes,
      });
    } catch (error) {
      if (uploadedFile?.id) {
        await queueFileDeletion({
          fileId: uploadedFile.id,
          ownerUserId: userId,
          reason: "feedback-attachment-rollback",
        }).catch(() => {});
      }

      await repository
        .deleteItem({
          feedbackId: created.id,
          userId,
        })
        .catch(() => {});

      throw new Error("No se pudo subir la captura.");
    }
  }

  return serializeCreatedItem(created);
}

export async function listPublicFeedback({ userId, query }) {
  const sort = query.sort === "new" ? "new" : "top";
  let category;

  if (query.category && query.category !== "ALL") {
    const normalized = normalizeCategory(query.category);

    if (!isPublicCategory(normalized)) {
      throw new Error("Solo se pueden listar categorías públicas.");
    }

    category = normalized;
  }

  const items = await repository.listPublic({
    userId,
    category,
    sort,
  });

  return items.map((item) => ({
    id: item.id,
    category: item.category,
    description: item.description,
    votesCount: item.votesCount,
    createdAt: item.createdAt,
    status: item.status,
    attachmentUrl: buildStoredFilePublicUrl(item.attachmentFile),
    didVote: Array.isArray(item.votes) && item.votes.length > 0,
  }));
}

export async function voteFeedback({ userId, feedbackId }) {
  const normalizedId = Number(feedbackId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Id inválido.");
  }

  const target = await repository.findPublicById(normalizedId);
  if (!target) {
    throw new Error("La idea no existe o no está disponible para votar.");
  }

  const updated = await repository.createVoteAndIncrement({
    feedbackId: normalizedId,
    userId,
  });

  if (!updated) {
    throw new Error("Ya votaste esta idea.");
  }

  return {
    id: normalizedId,
    didVote: true,
    votesCount: updated.votesCount,
  };
}

export async function unvoteFeedback({ userId, feedbackId }) {
  const normalizedId = Number(feedbackId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Id inválido.");
  }

  const target = await repository.findPublicById(normalizedId);
  if (!target) {
    throw new Error("La idea no existe o no está disponible para votar.");
  }

  const updated = await repository.deleteVoteAndDecrement({
    feedbackId: normalizedId,
    userId,
  });

  if (!updated) {
    throw new Error("Todavía no habías votado esta idea.");
  }

  return {
    id: normalizedId,
    didVote: false,
    votesCount: updated.votesCount,
  };
}

function serializeCreatedItem(item) {
  return {
    id: item.id,
    category: item.category,
    description: item.description,
    status: item.status,
    createdAt: item.createdAt,
    votesCount: item.votesCount,
    attachmentUrl: buildStoredFilePublicUrl(item.attachmentFile),
    isPublic: item.visibility === "PUBLIC",
  };
}