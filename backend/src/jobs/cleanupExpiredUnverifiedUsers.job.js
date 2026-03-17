import cron from "node-cron";
import prisma from "../config/prisma.js";

async function cleanupExpiredUnverifiedUsers() {
  const now = new Date();

  try {
    const expiredTokens = await prisma.verificationToken.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            isVerified: true,
          },
        },
      },
    });

    if (expiredTokens.length === 0) {
      console.log("🧹 Cleanup: no hay tokens vencidos para limpiar");
      return;
    }

    const userIdsToDelete = [
      ...new Set(
        expiredTokens
          .filter((item) => item.user && item.user.isVerified === false)
          .map((item) => item.userId)
      ),
    ];

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: {
          expiresAt: {
            lte: now,
          },
        },
      }),
      prisma.user.deleteMany({
        where: {
          id: {
            in: userIdsToDelete.length ? userIdsToDelete : [-1],
          },
          isVerified: false,
        },
      }),
    ]);

    console.log(
      `🧹 Cleanup OK: tokens vencidos borrados=${expiredTokens.length}, usuarios no verificados borrados=${userIdsToDelete.length}`
    );
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  }
}

export function startCleanupExpiredUnverifiedUsersJob() {
  const task = cron.schedule(
    "*/30 * * * *",
    async () => {
      await cleanupExpiredUnverifiedUsers();
    },
    {
      name: "cleanup-expired-unverified-users",
      timezone: "America/Argentina/Cordoba",
      noOverlap: true,
    }
  );

  console.log("🕒 Cron de limpieza iniciado: cada hora");

  cleanupExpiredUnverifiedUsers().catch((err) => {
    console.error("❌ Initial cleanup error:", err);
  });

  return task;
}