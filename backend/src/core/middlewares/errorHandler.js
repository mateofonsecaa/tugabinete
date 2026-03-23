import multer from "multer";

export const errorHandler = (err, req, res, next) => {
  let status =
    Number.isInteger(err?.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  let code = err?.code || "INTERNAL_SERVER_ERROR";
  let message =
    status >= 500
      ? "Error interno del servidor."
      : err?.message || "La solicitud falló.";

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      status = 400;
      code = "FILE_TOO_LARGE";
      message = "El archivo supera el tamaño máximo permitido.";
    }
  }

  if (status >= 500) {
    console.error("Unhandled error:", {
      path: req.originalUrl,
      method: req.method,
      code,
      message: err?.message,
      stack: err?.stack,
    });
  } else {
    console.warn("Handled error:", {
      path: req.originalUrl,
      method: req.method,
      code,
      message,
    });
  }

  const payload = {
    ok: false,
    code,
    message,
  };

  if (err?.fieldErrors && typeof err.fieldErrors === "object") {
    payload.fieldErrors = err.fieldErrors;
  }

  return res.status(status).json(payload);
};