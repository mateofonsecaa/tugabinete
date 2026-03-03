/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "updatedAt",
ALTER COLUMN "notes" SET DATA TYPE TEXT;
