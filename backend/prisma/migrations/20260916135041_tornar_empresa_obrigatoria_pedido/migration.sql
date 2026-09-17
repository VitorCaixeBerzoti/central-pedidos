/*
  Warnings:

  - Made the column `empresaId` on table `Pedido` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_empresaId_fkey";

-- AlterTable
ALTER TABLE "Pedido" ALTER COLUMN "empresaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
