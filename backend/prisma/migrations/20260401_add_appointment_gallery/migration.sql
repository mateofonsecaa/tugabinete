CREATE TABLE "AppointmentPhoto" (
  "id" SERIAL NOT NULL,
  "appointmentId" INTEGER NOT NULL,
  "fileId" TEXT NOT NULL,
  "label" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AppointmentPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentPhoto_fileId_key" ON "AppointmentPhoto"("fileId");
CREATE INDEX "AppointmentPhoto_appointmentId_position_idx" ON "AppointmentPhoto"("appointmentId", "position");

ALTER TABLE "AppointmentPhoto"
  ADD CONSTRAINT "AppointmentPhoto_appointmentId_fkey"
  FOREIGN KEY ("appointmentId")
  REFERENCES "Appointment"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "AppointmentPhoto"
  ADD CONSTRAINT "AppointmentPhoto_fileId_fkey"
  FOREIGN KEY ("fileId")
  REFERENCES "StoredFile"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;