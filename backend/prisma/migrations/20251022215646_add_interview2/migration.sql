-- CreateTable
CREATE TABLE "Interview2" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "skinType" TEXT,
    "concerns" TEXT,
    "cleanser" TEXT,
    "toner" TEXT,
    "serum" TEXT,
    "moisturizerDay" TEXT,
    "moisturizerNight" TEXT,
    "eyeCream" TEXT,
    "sunscreen" TEXT,
    "routineFrequency" TEXT,
    "adverseReaction" TEXT,
    "adverseDetails" TEXT,
    "expectedResults" TEXT,
    "treatmentFrequency" TEXT,
    "routineTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview2_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Interview2" ADD CONSTRAINT "Interview2_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
