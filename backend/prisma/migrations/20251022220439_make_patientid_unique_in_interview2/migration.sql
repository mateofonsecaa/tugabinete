/*
  Warnings:

  - A unique constraint covering the columns `[patientId]` on the table `Interview2` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Interview2_patientId_key" ON "Interview2"("patientId");
