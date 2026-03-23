import crypto from "crypto";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import prisma from "../../config/prisma.js";
import supabaseAdmin from "./supabaseAdmin.js";
import {
  FILE_PURPOSES,
  STORAGE_SIGNED_URL_TTL_SECONDS,
} from "./storage.config.js";

const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function truncateErrorMessage(value, max = 1000) {
  return String(value || "Error inesperado").slice(0, max);
}

function sanitizeOriginalName(name = "file") {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function getPurposeConfig(purpose) {
  const config = FILE_PURPOSES[purpose];
  if (!config) {
    throw new Error(`Propósito de archivo no soportado: ${purpose}`);
  }
  return config;
}

async function resolveMimeTypeAndExtension({
  file,
  buffer,
  forcedMimeType = null,
  forcedExtension = null,
}) {
  const detected = await fileTypeFromBuffer(buffer).catch(() => null);

  const mimeType =
    forcedMimeType ||
    detected?.mime ||
    file?.mimetype ||
    "application/octet-stream";

  const extension =
    forcedExtension ||
    detected?.ext ||
    path.extname(file?.originalname || "").replace(".", "").toLowerCase() ||
    MIME_TO_EXTENSION[mimeType] ||
    "bin";

  return {
    mimeType,
    extension,
  };
}

export function buildStoredFilePublicUrl(storedFile) {
  if (!storedFile) return null;
  if (storedFile.visibility !== "PUBLIC") return null;
  if (storedFile.status !== "ACTIVE") return null;
  if (storedFile.deletedAt) return null;

  const { data } = supabaseAdmin.storage
    .from(storedFile.bucket)
    .getPublicUrl(storedFile.objectPath);

  return data.publicUrl;
}

export function buildUserAvatarUrl(user) {
  return buildStoredFilePublicUrl(user?.avatarFile) || null;
}

export function serializeStoredFile(storedFile) {
  if (!storedFile) return null;

  return {
    id: storedFile.id,
    bucket: storedFile.bucket,
    objectPath: storedFile.objectPath,
    visibility: storedFile.visibility,
    purpose: storedFile.purpose,
    resourceType: storedFile.resourceType,
    resourceId: storedFile.resourceId,
    originalName: storedFile.originalName,
    mimeType: storedFile.mimeType,
    sizeBytes: storedFile.sizeBytes,
    status: storedFile.status,
    publicUrl: buildStoredFilePublicUrl(storedFile),
    createdAt: storedFile.createdAt,
    deletedAt: storedFile.deletedAt,
  };
}

export async function uploadManagedFile({
  ownerUserId,
  purpose,
  resourceType,
  resourceId = null,
  file,
  processedBuffer = null,
  forcedMimeType = null,
  forcedExtension = null,
  metadata = null,
}) {
  if (!ownerUserId || !Number.isInteger(ownerUserId)) {
    throw new Error("ownerUserId inválido para uploadManagedFile.");
  }

  if (!purpose) {
    throw new Error("purpose es obligatorio.");
  }

  if (!resourceType) {
    throw new Error("resourceType es obligatorio.");
  }

  const config = getPurposeConfig(purpose);
  const buffer = processedBuffer || file?.buffer;

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("No se recibió un buffer válido para subir.");
  }

  const { mimeType, extension } = await resolveMimeTypeAndExtension({
    file,
    buffer,
    forcedMimeType,
    forcedExtension,
  });

  if (!config.allowedMimeTypes.has(mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}`);
  }

  if (buffer.length > config.maxSizeBytes) {
    throw new Error(
      `El archivo supera el máximo permitido de ${config.maxSizeBytes} bytes.`
    );
  }

  const fileId = crypto.randomUUID();
  const originalName = sanitizeOriginalName(
    file?.originalname || `file.${extension}`
  );
  const storedName = `${fileId}.${extension}`;
  const objectPath = config.buildObjectPath({
    ownerUserId,
    resourceId: resourceId ? String(resourceId) : null,
    fileId,
    extension,
  });

  const pendingRecord = await prisma.storedFile.create({
    data: {
      id: fileId,
      ownerUserId,
      bucket: config.bucket,
      objectPath,
      visibility: config.visibility,
      purpose,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      originalName,
      storedName,
      extension,
      mimeType,
      sizeBytes: buffer.length,
      checksumSha256: sha256(buffer),
      metadata: metadata || undefined,
      status: "UPLOAD_PENDING",
    },
  });

  let uploaded = false;

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from(config.bucket)
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "No se pudo subir el archivo.");
    }

    uploaded = true;

    const activeRecord = await prisma.storedFile.update({
      where: { id: pendingRecord.id },
      data: {
        status: "ACTIVE",
        lastError: null,
      },
    });

    return activeRecord;
  } catch (error) {
    if (uploaded) {
      try {
        await supabaseAdmin.storage.from(config.bucket).remove([objectPath]);
      } catch {
        // no-op
      }
    }

    await prisma.storedFile
      .update({
        where: { id: pendingRecord.id },
        data: {
          status: "UPLOAD_FAILED",
          lastError: truncateErrorMessage(error.message || error),
        },
      })
      .catch(() => {});

    throw error;
  }
}

export async function queueFileDeletion({
  fileId,
  ownerUserId,
  reason = "manual-delete",
}) {
  if (!fileId) {
    return { ok: true, skipped: true, reason: "missing-file-id" };
  }

  const storedFile = await prisma.storedFile.findFirst({
    where: {
      id: fileId,
      ownerUserId,
    },
  });

  if (!storedFile) {
    return { ok: true, skipped: true, reason: "not-found" };
  }

  if (storedFile.deletedAt || storedFile.status === "DELETED") {
    return { ok: true, skipped: true, reason: "already-deleted" };
  }

  await prisma.storedFile.update({
    where: { id: storedFile.id },
    data: {
      status: "DELETE_PENDING",
      deleteReason: reason,
    },
  });

  try {
    const { error } = await supabaseAdmin.storage
      .from(storedFile.bucket)
      .remove([storedFile.objectPath]);

    if (error) {
      throw new Error(error.message || "No se pudo borrar el archivo.");
    }

    await prisma.storedFile.update({
      where: { id: storedFile.id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        lastError: null,
        deleteAttempts: {
          increment: 1,
        },
      },
    });

    return { ok: true };
  } catch (error) {
    await prisma.storedFile.update({
      where: { id: storedFile.id },
      data: {
        status: "DELETE_PENDING",
        lastError: truncateErrorMessage(error.message || error),
        deleteAttempts: {
          increment: 1,
        },
      },
    });

    return {
      ok: false,
      pending: true,
      error: truncateErrorMessage(error.message || error),
    };
  }
}

export async function createPrivateSignedUrlForFile({
  fileId,
  ownerUserId,
  expiresInSeconds = STORAGE_SIGNED_URL_TTL_SECONDS,
}) {
  const storedFile = await prisma.storedFile.findFirst({
    where: {
      id: fileId,
      ownerUserId,
      visibility: "PRIVATE",
      status: "ACTIVE",
      deletedAt: null,
    },
  });

  if (!storedFile) {
    throw new Error("Archivo privado no encontrado.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(storedFile.bucket)
    .createSignedUrl(storedFile.objectPath, expiresInSeconds);

  if (error) {
    throw new Error(error.message || "No se pudo generar la signed URL.");
  }

  return {
    signedUrl: data.signedUrl,
    expiresInSeconds,
    file: serializeStoredFile(storedFile),
  };
}

export async function processPendingStoredFileDeletions({ limit = 20 } = {}) {
  const pendingFiles = await prisma.storedFile.findMany({
    where: {
      status: "DELETE_PENDING",
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "asc",
    },
    take: limit,
  });

  const results = [];

  for (const storedFile of pendingFiles) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(storedFile.bucket)
        .remove([storedFile.objectPath]);

      if (error) {
        throw new Error(error.message || "No se pudo borrar el archivo pendiente.");
      }

      await prisma.storedFile.update({
        where: { id: storedFile.id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          lastError: null,
          deleteAttempts: {
            increment: 1,
          },
        },
      });

      results.push({
        fileId: storedFile.id,
        ok: true,
      });
    } catch (error) {
      await prisma.storedFile.update({
        where: { id: storedFile.id },
        data: {
          status: "DELETE_PENDING",
          lastError: truncateErrorMessage(error.message || error),
          deleteAttempts: {
            increment: 1,
          },
        },
      });

      results.push({
        fileId: storedFile.id,
        ok: false,
        error: truncateErrorMessage(error.message || error),
      });
    }
  }

  return {
    processed: pendingFiles.length,
    results,
  };
}