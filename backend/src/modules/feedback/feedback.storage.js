import { uploadManagedFile } from "../../core/storage/storage.service.js";

function resolveFeedbackPurpose(category) {
  return category === "ERROR_PROBLEMA"
    ? "FEEDBACK_PRIVATE_ATTACHMENT"
    : "FEEDBACK_PUBLIC_ATTACHMENT";
}

export async function uploadFeedbackAttachment({
  userId,
  feedbackId,
  category,
  file,
}) {
  const purpose = resolveFeedbackPurpose(category);

  return uploadManagedFile({
    ownerUserId: userId,
    purpose,
    resourceType: "FEEDBACK",
    resourceId: String(feedbackId),
    file,
    metadata: {
      source: "feedback",
      category,
    },
  });
}