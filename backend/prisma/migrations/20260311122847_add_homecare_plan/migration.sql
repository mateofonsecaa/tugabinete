-- CreateTable
CREATE TABLE "HomeCarePlan" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Activa',
    "generalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" INTEGER NOT NULL,

    CONSTRAINT "HomeCarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeCarePlanItem" (
    "id" SERIAL NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "moment" TEXT,
    "action" TEXT NOT NULL,
    "product" TEXT,
    "frequency" TEXT,
    "instructions" TEXT,
    "duration" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planId" INTEGER NOT NULL,

    CONSTRAINT "HomeCarePlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeCarePlan_patientId_key" ON "HomeCarePlan"("patientId");

-- CreateIndex
CREATE INDEX "HomeCarePlanItem_planId_idx" ON "HomeCarePlanItem"("planId");

-- AddForeignKey
ALTER TABLE "HomeCarePlan" ADD CONSTRAINT "HomeCarePlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeCarePlanItem" ADD CONSTRAINT "HomeCarePlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "HomeCarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
