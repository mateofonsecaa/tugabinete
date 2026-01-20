/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - Made the column `profileImage` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "time" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ALTER COLUMN "profileImage" SET NOT NULL;

-- CreateTable
CREATE TABLE "Interview" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allergies" TEXT,
    "diseases" TEXT,
    "medications" TEXT,
    "observations" TEXT,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_patientId_key" ON "Interview"("patientId");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
