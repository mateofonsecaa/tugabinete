import * as service from "./feedback.service.js";

export async function create(req, res) {
  try {
    const item = await service.createFeedback({
      userId: req.user.id,
      body: req.body,
      file: req.file,
    });

    return res.status(201).json({
      ok: true,
      message: item.isPublic
        ? "Gracias. Tu sugerencia ya quedó publicada para que la comunidad la vote."
        : "Gracias. Tu reporte fue enviado en privado para revisión.",
      item,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message || "No se pudo enviar el feedback.",
    });
  }
}

export async function listPublic(req, res) {
  try {
    const items = await service.listPublicFeedback({
      userId: req.user.id,
      query: req.query,
    });

    return res.json({
      ok: true,
      items,
    });
  } catch (error) {
    console.error("feedback list error:", error);

    return res.status(400).json({
      ok: false,
      error: error.message || "No se pudo listar el feedback.",
    });
  }
}

export async function vote(req, res) {
  try {
    const item = await service.voteFeedback({
      userId: req.user.id,
      feedbackId: req.params.id,
    });

    return res.json({
      ok: true,
      item,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message || "No se pudo registrar el voto.",
    });
  }
}

export async function unvote(req, res) {
  try {
    const item = await service.unvoteFeedback({
      userId: req.user.id,
      feedbackId: req.params.id,
    });

    return res.json({
      ok: true,
      item,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message || "No se pudo quitar el voto.",
    });
  }
}