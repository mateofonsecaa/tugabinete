import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { beforePhotoFileId: { not: null } },
        { afterPhotoFileId: { not: null } },
      ],
    },
    select: {
      id: true,
      beforePhotoFileId: true,
      afterPhotoFileId: true,
      photos: {
        select: { fileId: true },
      },
    },
  });

  let inserted = 0;

  for (const appointment of appointments) {
    const existing = new Set((appointment.photos || []).map((p) => p.fileId));
    const rows = [];

    if (appointment.beforePhotoFileId && !existing.has(appointment.beforePhotoFileId)) {
      rows.push({
        appointmentId: appointment.id,
        fileId: appointment.beforePhotoFileId,
        label: 'Antes',
        position: 0,
      });
    }

    if (appointment.afterPhotoFileId && !existing.has(appointment.afterPhotoFileId)) {
      rows.push({
        appointmentId: appointment.id,
        fileId: appointment.afterPhotoFileId,
        label: 'Después',
        position: rows.length ? 1 : 0,
      });
    }

    if (!rows.length) continue;

    await prisma.appointmentPhoto.createMany({
      data: rows,
      skipDuplicates: true,
    });

    inserted += rows.length;
  }

  console.log(`AppointmentPhoto creadas: ${inserted}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
