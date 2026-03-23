/*
  Warnings:

  - You are about to drop the column `afterPhoto` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `beforePhoto` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentPath` on the `FeedbackItem` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentUrl` on the `FeedbackItem` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImagePath` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "afterPhoto",
DROP COLUMN "beforePhoto";

-- AlterTable
ALTER TABLE "FeedbackItem" DROP COLUMN "attachmentPath",
DROP COLUMN "attachmentUrl";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImage",
DROP COLUMN "profileImagePath";
