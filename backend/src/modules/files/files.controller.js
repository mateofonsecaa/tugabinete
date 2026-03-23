import { createPrivateSignedUrlForFile } from "../../core/storage/storage.service.js";

export async function getPrivateFileAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const fileId = String(req.params.fileId || "").trim();

    if (!fileId) {
      return res.status(400).json({
        ok: false,
        code: "FILE_ID_REQUIRED",
        message: "fileId es obligatorio.",
      });
    }

    const result = await createPrivateSignedUrlForFile({
      fileId,
      ownerUserId: userId,
    });

    return res.status(200).json({
      ok: true,
      signedUrl: result.signedUrl,
      expiresInSeconds: result.expiresInSeconds,
      file: result.file,
    });
  } catch (error) {
    return next(error);
  }
}