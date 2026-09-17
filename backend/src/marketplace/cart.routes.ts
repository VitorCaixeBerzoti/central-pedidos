import { Router } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { enderecoSchema, HttpError } from "./core.js"
import {
  carregarCarrinho,
  finalizarCompra,
  mudarStatus,
  pedidoDto,
  pedidoInclude,
} from "./orders.service.js"
import { exigirConta } from "./session.js"

export const buyerRouter = Router()
buyerRouter.use(exigirConta("COMPRADOR"))
buyerRouter.get("/carrinho", async (_req, res) => {
  res.json(await carregarCarrinho(res.locals.conta.id))
})
buyerRouter.put("/carrinho/:id", async (req, res) => {
  const produtoId = z.uuid().parse(req.params.id)
  const { quantidade } = z.object({ quantidade: z.number().int().min(0).max(99) }).parse(req.body)
  const contaId = res.locals.conta.id
  if (!quantidade) {
    await prisma.carrinhoItem.deleteMany({ where: { contaId, produtoId } })
  } else {
    const produto = await prisma.produto.findFirst({ where: { id: produtoId, ativo: true } })
    if (!produto) throw new HttpError(404, "Produto indisponível.")
    if (produto.estoque < quantidade)
      throw new HttpError(409, `Há apenas ${produto.estoque} unidade(s) disponíveis.`)
    const linhas = await prisma.carrinhoItem.count({ where: { contaId } })
    if (
      linhas >= 50 &&
      !(await prisma.carrinhoItem.findUnique({
        where: { contaId_produtoId: { contaId, produtoId } },
      }))
    )
      throw new HttpError(400, "Limite de 50 anúncios por carrinho.")
    await prisma.carrinhoItem.upsert({
      where: { contaId_produtoId: { contaId, produtoId } },
      create: { contaId, produtoId, quantidade },
      update: { quantidade },
    })
  }
  res.json(await carregarCarrinho(contaId))
})
buyerRouter.post("/checkout", async (req, res) => {
  const dados = z
    .object({ chave: z.uuid(), cotacao: z.string().length(64), endereco: enderecoSchema })
    .parse(req.body)
  const compra = await finalizarCompra(res.locals.conta.id, dados)
  res.status(201).json({ compraId: compra.id })
})
buyerRouter.get("/compras", async (_req, res) => {
  const compras = await prisma.compra.findMany({
    where: { contaId: res.locals.conta.id },
    include: { pedidos: { include: pedidoInclude, orderBy: { id: "asc" } } },
    orderBy: { criadoEm: "desc" },
    take: 100,
  })
  res.json(
    compras.map((compra) => ({
      id: compra.id,
      totalCentavos: compra.totalCentavos,
      pagamento: compra.pagamento,
      criadoEm: compra.criadoEm,
      pedidos: compra.pedidos.map(pedidoDto),
    })),
  )
})
buyerRouter.post("/pedidos/:id/cancelar", async (req, res) => {
  await mudarStatus(
    z.coerce.number().int().positive().parse(req.params.id),
    res.locals.conta,
    "CANCELADO",
  )
  res.json({ mensagem: "Pedido cancelado e estorno simulado registrado." })
})
