/*
  Warnings:

  - Changed the type of `ownerUserId` on the `StoredFile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "afterPhotoFileId" TEXT,
ADD COLUMN     "beforePhotoFileId" TEXT;

-- AlterTable
ALTER TABLE "FeedbackItem" ADD COLUMN     "attachmentFileId" TEXT;

-- AlterTable
ALTER TABLE "StoredFile" DROP COLUMN "ownerUserId",
ADD COLUMN     "ownerUserId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "StoredFile_ownerUserId_status_idx" ON "StoredFile"("ownerUserId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_beforePhotoFileId_fkey" FOREIGN KEY ("beforePhotoFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_afterPhotoFileId_fkey" FOREIGN KEY ("afterPhotoFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackItem" ADD CONSTRAINT "FeedbackItem_attachmentFileId_fkey" FOREIGN KEY ("attachmentFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
