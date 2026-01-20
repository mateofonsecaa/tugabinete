/*
  Warnings:

  - You are about to drop the column `date` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `diseases` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the `Interview2` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Interview2" DROP CONSTRAINT "Interview2_patientId_fkey";

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "date",
DROP COLUMN "diseases",
DROP COLUMN "observations",
ADD COLUMN     "adverseDetails" TEXT,
ADD COLUMN     "adverseReaction" TEXT,
ADD COLUMN     "cleanser" TEXT,
ADD COLUMN     "concerns" TEXT,
ADD COLUMN     "expectedResults" TEXT,
ADD COLUMN     "eyeCream" TEXT,
ADD COLUMN     "moisturizerDay" TEXT,
ADD COLUMN     "moisturizerNight" TEXT,
ADD COLUMN     "routineFrequency" TEXT,
ADD COLUMN     "routineTime" TEXT,
ADD COLUMN     "serum" TEXT,
ADD COLUMN     "skinType" TEXT,
ADD COLUMN     "sunscreen" TEXT,
ADD COLUMN     "toner" TEXT,
ADD COLUMN     "treatmentFrequency" TEXT;

-- DropTable
DROP TABLE "public"."Interview2";
