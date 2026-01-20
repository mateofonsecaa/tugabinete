-- Drift fix: columnas/relaciones que YA existen en la DB pero Prisma no las ve en migrations

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "profession" TEXT;

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "userId" INTEGER;

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "userId" INTEGER;

ALTER TABLE "SimpleAppointment"
  ADD COLUMN IF NOT EXISTS "userId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Patient_userId_fkey') THEN
    ALTER TABLE "Patient"
      ADD CONSTRAINT "Patient_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_userId_fkey') THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SimpleAppointment_userId_fkey') THEN
    ALTER TABLE "SimpleAppointment"
      ADD CONSTRAINT "SimpleAppointment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
