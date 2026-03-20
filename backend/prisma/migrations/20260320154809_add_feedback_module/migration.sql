-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('IDEA_NUEVA', 'MEJORA_VISUAL', 'ERROR_PROBLEMA', 'NUEVA_FUNCION', 'EXPERIENCIA_DE_USO', 'OTRA');

-- CreateEnum
CREATE TYPE "FeedbackVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'PLANNED', 'DONE', 'REJECTED');

-- CreateTable
CREATE TABLE "FeedbackItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionHash" TEXT NOT NULL,
    "visibility" "FeedbackVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "contactAllowed" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "attachmentPath" TEXT,
    "attachmentMime" TEXT,
    "attachmentSize" INTEGER,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackVote" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackItem_userId_createdAt_idx" ON "FeedbackItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackItem_descriptionHash_idx" ON "FeedbackItem"("descriptionHash");

-- CreateIndex
CREATE INDEX "FeedbackItem_visibility_createdAt_idx" ON "FeedbackItem"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackItem_visibility_votesCount_idx" ON "FeedbackItem"("visibility", "votesCount");

-- CreateIndex
CREATE INDEX "FeedbackVote_userId_createdAt_idx" ON "FeedbackVote"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackVote_feedbackId_userId_key" ON "FeedbackVote"("feedbackId", "userId");

-- AddForeignKey
ALTER TABLE "FeedbackItem" ADD CONSTRAINT "FeedbackItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
