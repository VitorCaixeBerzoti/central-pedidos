-- CreateTable
CREATE TABLE "HistoricoStatusPedido" (
    "id" SERIAL NOT NULL,
    "status_anterior" "StatusPedido" NOT NULL,
    "status_novo" "StatusPedido" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedidoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "HistoricoStatusPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoricoStatusPedido_pedidoId_criado_em_idx" ON "HistoricoStatusPedido"("pedidoId", "criado_em");

-- CreateIndex
CREATE INDEX "HistoricoStatusPedido_usuarioId_idx" ON "HistoricoStatusPedido"("usuarioId");

-- AddForeignKey
ALTER TABLE "HistoricoStatusPedido" ADD CONSTRAINT "HistoricoStatusPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatusPedido" ADD CONSTRAINT "HistoricoStatusPedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
