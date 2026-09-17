-- CreateEnum
CREATE TYPE "PapelConta" AS ENUM ('COMPRADOR', 'VENDEDOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusPedido" ADD VALUE 'PAGO';
ALTER TYPE "StatusPedido" ADD VALUE 'PREPARANDO';
ALTER TYPE "StatusPedido" ADD VALUE 'ENVIADO';
ALTER TYPE "StatusPedido" ADD VALUE 'ENTREGUE';

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "descricao" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "HistoricoStatusPedido" ADD COLUMN     "contaId" TEXT,
ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ItemPedido" ADD COLUMN     "imagem" TEXT,
ADD COLUMN     "nome" TEXT,
ADD COLUMN     "produtoId" TEXT;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "compraId" TEXT;

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelConta" NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoNavegador" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "contaAtivaId" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoNavegador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilConectado" (
    "sessaoId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,

    CONSTRAINT "PerfilConectado_pkey" PRIMARY KEY ("sessaoId","contaId")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL,
    "imagem" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrinhoItem" (
    "contaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "CarrinhoItem_pkey" PRIMARY KEY ("contaId","produtoId")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "chaveIdempotencia" TEXT NOT NULL,
    "totalCentavos" INTEGER NOT NULL,
    "endereco" JSONB NOT NULL,
    "pagamento" TEXT NOT NULL DEFAULT 'APROVADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estorno" (
    "id" TEXT NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estorno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conta_email_key" ON "Conta"("email");

-- CreateIndex
CREATE INDEX "Conta_empresaId_idx" ON "Conta"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoNavegador_tokenHash_key" ON "SessaoNavegador"("tokenHash");

-- CreateIndex
CREATE INDEX "SessaoNavegador_expiraEm_idx" ON "SessaoNavegador"("expiraEm");

-- CreateIndex
CREATE INDEX "PerfilConectado_contaId_idx" ON "PerfilConectado"("contaId");

-- CreateIndex
CREATE INDEX "Produto_empresaId_ativo_idx" ON "Produto"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "Produto_categoriaId_ativo_idx" ON "Produto"("categoriaId", "ativo");

-- CreateIndex
CREATE INDEX "Produto_ativo_criadoEm_idx" ON "Produto"("ativo", "criadoEm");

-- CreateIndex
CREATE INDEX "CarrinhoItem_produtoId_idx" ON "CarrinhoItem"("produtoId");

-- CreateIndex
CREATE INDEX "Compra_contaId_criadoEm_idx" ON "Compra"("contaId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_contaId_chaveIdempotencia_key" ON "Compra"("contaId", "chaveIdempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "Estorno_pedidoId_key" ON "Estorno"("pedidoId");

-- CreateIndex
CREATE INDEX "Pedido_compraId_idx" ON "Pedido"("compraId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatusPedido" ADD CONSTRAINT "HistoricoStatusPedido_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilConectado" ADD CONSTRAINT "PerfilConectado_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoNavegador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilConectado" ADD CONSTRAINT "PerfilConectado_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estorno" ADD CONSTRAINT "Estorno_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariantes também protegidas no banco, inclusive fora da API.
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_valores_validos" CHECK ("estoque" >= 0 AND "precoCentavos" > 0);
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "Carrinho_quantidade_positiva" CHECK ("quantidade" > 0);
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_papel_empresa" CHECK (("papel" = 'VENDEDOR' AND "empresaId" IS NOT NULL) OR ("papel" = 'COMPRADOR' AND "empresaId" IS NULL));
ALTER TABLE "HistoricoStatusPedido" ADD CONSTRAINT "Historico_um_autor" CHECK (("usuarioId" IS NOT NULL)::int + ("contaId" IS NOT NULL)::int = 1);
