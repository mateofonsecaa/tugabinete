import { processPendingStoredFileDeletions } from "../core/storage/storage.service.js";

let cleanupInterval = null;
let cleanupRunning = false;

export function startCleanupPendingStoredFilesJob() {
  if (cleanupInterval) return;

  const run = async () => {
    if (cleanupRunning) return;
    cleanupRunning = true;

    try {
      const result = await processPendingStoredFileDeletions({ limit: 20 });

      if (result.processed > 0) {
        console.log("[stored-files-cleanup] processed:", result.processed);
      }
    } catch (error) {
      console.error(
        "[stored-files-cleanup] job failed:",
        error?.message || error
      );
    } finally {
      cleanupRunning = false;
    }
  };

  void run();

  cleanupInterval = setInterval(() => {
    void run();
  }, 5 * 60 * 1000);
}