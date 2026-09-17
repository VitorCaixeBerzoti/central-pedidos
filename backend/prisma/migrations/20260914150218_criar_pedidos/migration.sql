-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "frete" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(12,2) NOT NULL,
    "pedidoId" INTEGER NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_pedido_id_key" ON "Pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
