function mb(value) {
  return value * 1024 * 1024;
}

const publicBucket = process.env.STORAGE_PUBLIC_BUCKET;
const privateBucket = process.env.STORAGE_PRIVATE_BUCKET;

if (!publicBucket) {
  throw new Error("Falta STORAGE_PUBLIC_BUCKET en el entorno.");
}

if (!privateBucket) {
  throw new Error("Falta STORAGE_PRIVATE_BUCKET en el entorno.");
}

const signedUrlTtl = Number(process.env.STORAGE_SIGNED_URL_TTL_SECONDS || 60);

export const STORAGE_PUBLIC_BUCKET = publicBucket;
export const STORAGE_PRIVATE_BUCKET = privateBucket;
export const STORAGE_SIGNED_URL_TTL_SECONDS =
  Number.isInteger(signedUrlTtl) && signedUrlTtl > 0 ? signedUrlTtl : 60;

export const FILE_PURPOSES = {
  USER_AVATAR: {
    visibility: "PUBLIC",
    bucket: STORAGE_PUBLIC_BUCKET,
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxSizeBytes: mb(5),
    buildObjectPath: ({ ownerUserId, fileId, extension }) =>
      `users/${ownerUserId}/avatars/${fileId}.${extension}`,
  },

  FEEDBACK_PUBLIC_ATTACHMENT: {
    visibility: "PUBLIC",
    bucket: STORAGE_PUBLIC_BUCKET,
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxSizeBytes: mb(5),
    buildObjectPath: ({ ownerUserId, resourceId, fileId, extension }) =>
      `users/${ownerUserId}/feedback/public/${resourceId}/${fileId}.${extension}`,
  },

  FEEDBACK_PRIVATE_ATTACHMENT: {
    visibility: "PRIVATE",
    bucket: STORAGE_PRIVATE_BUCKET,
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxSizeBytes: mb(5),
    buildObjectPath: ({ ownerUserId, resourceId, fileId, extension }) =>
      `users/${ownerUserId}/feedback/private/${resourceId}/${fileId}.${extension}`,
  },

  APPOINTMENT_BEFORE_PHOTO: {
    visibility: "PRIVATE",
    bucket: STORAGE_PRIVATE_BUCKET,
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxSizeBytes: mb(10),
    buildObjectPath: ({ ownerUserId, resourceId, fileId, extension }) =>
      `users/${ownerUserId}/appointments/${resourceId}/before/${fileId}.${extension}`,
  },

  APPOINTMENT_AFTER_PHOTO: {
    visibility: "PRIVATE",
    bucket: STORAGE_PRIVATE_BUCKET,
    allowedMimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxSizeBytes: mb(10),
    buildObjectPath: ({ ownerUserId, resourceId, fileId, extension }) =>
      `users/${ownerUserId}/appointments/${resourceId}/after/${fileId}.${extension}`,
  },
};