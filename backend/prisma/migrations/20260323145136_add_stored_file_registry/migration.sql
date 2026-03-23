/*
  Warnings:

  - A unique constraint covering the columns `[avatarFileId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "StoredFileStatus" AS ENUM ('UPLOAD_PENDING', 'ACTIVE', 'DELETE_PENDING', 'DELETED', 'UPLOAD_FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarFileId" TEXT;

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "visibility" "FileVisibility" NOT NULL,
    "purpose" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "StoredFileStatus" NOT NULL DEFAULT 'UPLOAD_PENDING',
    "deleteReason" TEXT,
    "deleteAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoredFile_ownerUserId_status_idx" ON "StoredFile"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "StoredFile_resourceType_resourceId_idx" ON "StoredFile"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "StoredFile_purpose_status_idx" ON "StoredFile"("purpose", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_bucket_objectPath_key" ON "StoredFile"("bucket", "objectPath");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarFileId_key" ON "User"("avatarFileId");
