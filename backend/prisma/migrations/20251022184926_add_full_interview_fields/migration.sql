/*
  Warnings:

  - Added the required column `updatedAt` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "alcohol" TEXT,
ADD COLUMN     "celiac" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "familyHistory" TEXT,
ADD COLUMN     "hormonalChange" TEXT,
ADD COLUMN     "hormones" TEXT,
ADD COLUMN     "illness" TEXT,
ADD COLUMN     "keloidTendency" TEXT,
ADD COLUMN     "lenses" TEXT,
ADD COLUMN     "oncology" TEXT,
ADD COLUMN     "pregnancy" TEXT,
ADD COLUMN     "screenTime" TEXT,
ADD COLUMN     "skinReaction" TEXT,
ADD COLUMN     "sleepHours" TEXT,
ADD COLUMN     "smoke" TEXT,
ADD COLUMN     "sport" TEXT,
ADD COLUMN     "stressLevel" TEXT,
ADD COLUMN     "sunExposure" TEXT,
ADD COLUMN     "surgery" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "waterIntake" TEXT;
