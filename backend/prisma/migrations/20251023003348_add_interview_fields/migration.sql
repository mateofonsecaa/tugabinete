/*
  Warnings:

  - You are about to drop the column `allergies` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `familyHistory` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `hormonalChange` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `keloidTendency` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `medications` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `skinReaction` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `sleepHours` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `stressLevel` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `sunExposure` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `waterIntake` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "allergies",
DROP COLUMN "familyHistory",
DROP COLUMN "hormonalChange",
DROP COLUMN "keloidTendency",
DROP COLUMN "medications",
DROP COLUMN "skinReaction",
DROP COLUMN "sleepHours",
DROP COLUMN "stressLevel",
DROP COLUMN "sunExposure",
DROP COLUMN "waterIntake",
ADD COLUMN     "allergy" TEXT,
ADD COLUMN     "allergyExtra" TEXT,
ADD COLUMN     "celiacExtra" TEXT,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "familyExtra" TEXT,
ADD COLUMN     "hormonal" TEXT,
ADD COLUMN     "hormonalExtra" TEXT,
ADD COLUMN     "hormonesExtra" TEXT,
ADD COLUMN     "illnessExtra" TEXT,
ADD COLUMN     "keloid" TEXT,
ADD COLUMN     "medication" TEXT,
ADD COLUMN     "medicationExtra" TEXT,
ADD COLUMN     "oncologyExtra" TEXT,
ADD COLUMN     "pregnancyExtra" TEXT,
ADD COLUMN     "skin" TEXT,
ADD COLUMN     "sleep" TEXT,
ADD COLUMN     "sportExtra" TEXT,
ADD COLUMN     "stress" TEXT,
ADD COLUMN     "sun" TEXT,
ADD COLUMN     "surgeryExtra" TEXT,
ADD COLUMN     "water" TEXT;
