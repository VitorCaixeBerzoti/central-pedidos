-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "empresaId" INTEGER;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
