/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,pedido_id]` on the table `Pedido` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Pedido_pedido_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_empresaId_pedido_id_key" ON "Pedido"("empresaId", "pedido_id");
