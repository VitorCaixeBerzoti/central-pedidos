import { randomUUID } from "node:crypto"
import { Prisma } from "../generated/prisma/client.js"
import { prisma } from "../lib/prisma.js"
import { centavos, FRETE_CENTAVOS, hash, HttpError, reais, serializable } from "./core.js"

export const produtoInclude = {
  categoria: true,
  empresa: { select: { id: true, nome: true, descricao: true } },
} as const
export const pedidoInclude = {
  itens: true,
  empresa: { select: { id: true, nome: true } },
  estorno: true,
  compra: { select: { id: true, endereco: true, criadoEm: true } },
  historico: {
    orderBy: { criado_em: "asc" as const },
    select: { id: true, status_anterior: true, status_novo: true, criado_em: true },
  },
} satisfies Prisma.PedidoInclude
export function pedidoDto(pedido: Prisma.PedidoGetPayload<{ include: typeof pedidoInclude }>) {
  return {
    id: pedido.id,
    codigo: pedido.pedido_id,
    status: pedido.status,
    criadoEm: pedido.criado_em,
    totalCentavos: centavos(pedido.valor_total),
    freteCentavos: centavos(pedido.frete),
    loja: pedido.empresa,
    compra: pedido.compra,
    estorno: pedido.estorno,
    historico: pedido.historico,
    itens: pedido.itens.map((item) => ({
      id: item.id,
      produtoId: item.produtoId,
      nome: item.nome ?? item.sku,
      imagem: item.imagem,
      quantidade: item.quantidade,
      precoCentavos: centavos(item.valor_unitario),
    })),
  }
}
export async function carregarCarrinho(contaId: string, db: Prisma.TransactionClient = prisma) {
  const itens = await db.carrinhoItem.findMany({
    where: { contaId },
    include: { produto: { include: produtoInclude } },
    orderBy: { produtoId: "asc" },
  })
  const grupos = new Map<
    number,
    {
      loja: { id: number; nome: string }
      freteCentavos: number
      subtotalCentavos: number
      itens: typeof itens
    }
  >()
  for (const item of itens) {
    const loja = item.produto.empresa
    if (!grupos.has(loja.id))
      grupos.set(loja.id, { loja, freteCentavos: FRETE_CENTAVOS, subtotalCentavos: 0, itens: [] })
    const grupo = grupos.get(loja.id)!
    grupo.itens.push(item)
    grupo.subtotalCentavos += item.quantidade * item.produto.precoCentavos
  }
  const lista = [...grupos.values()]
  const subtotalCentavos = lista.reduce((s, g) => s + g.subtotalCentavos, 0)
  const freteCentavos = lista.length * FRETE_CENTAVOS
  return {
    grupos: lista,
    quantidade: itens.reduce((s, i) => s + i.quantidade, 0),
    subtotalCentavos,
    freteCentavos,
    totalCentavos: subtotalCentavos + freteCentavos,
    cotacao: hash(
      JSON.stringify({
        itens: itens.map((i) => [
          i.produtoId,
          i.quantidade,
          i.produto.precoCentavos,
          i.produto.empresaId,
        ]),
        frete: FRETE_CENTAVOS,
      }),
    ),
  }
}
export async function finalizarCompra(
  contaId: string,
  dados: { chave: string; cotacao: string; endereco: Prisma.InputJsonValue },
) {
  try {
    return await serializable(async (tx) => {
      const existente = await tx.compra.findUnique({
        where: { contaId_chaveIdempotencia: { contaId, chaveIdempotencia: dados.chave } },
      })
      if (existente) return existente
      const carrinho = await carregarCarrinho(contaId, tx)
      if (!carrinho.quantidade) throw new HttpError(400, "Seu carrinho está vazio.")
      if (carrinho.cotacao !== dados.cotacao)
        throw new HttpError(
          409,
          "O carrinho ou os preços mudaram. Confira os valores e tente novamente.",
        )
      if (carrinho.totalCentavos > 2000000000)
        throw new HttpError(400, "O valor da compra ultrapassa o limite da demonstração.")
      // Todos os grupos são aprovados juntos. Qualquer falha desfaz a compra inteira.
      for (const grupo of carrinho.grupos) {
        for (const item of grupo.itens) {
          const resultado = await tx.produto.updateMany({
            where: { id: item.produtoId, ativo: true, estoque: { gte: item.quantidade } },
            data: { estoque: { decrement: item.quantidade } },
          })
          if (resultado.count !== 1)
            throw new HttpError(
              409,
              `Estoque insuficiente ou anúncio indisponível: ${item.produto.nome}. Atualize o carrinho.`,
            )
        }
      }
      const compra = await tx.compra.create({
        data: {
          contaId,
          chaveIdempotencia: dados.chave,
          totalCentavos: carrinho.totalCentavos,
          endereco: dados.endereco,
        },
      })
      for (const grupo of carrinho.grupos) {
        await tx.pedido.create({
          data: {
            pedido_id: `ORB-${randomUUID().slice(0, 8).toUpperCase()}`,
            empresaId: grupo.loja.id,
            compraId: compra.id,
            status: "PAGO",
            frete: reais(grupo.freteCentavos),
            valor_total: reais(grupo.subtotalCentavos + grupo.freteCentavos),
            itens: {
              create: grupo.itens.map((item) => ({
                sku: item.produtoId,
                produtoId: item.produtoId,
                nome: item.produto.nome,
                imagem: item.produto.imagem,
                quantidade: item.quantidade,
                valor_unitario: reais(item.produto.precoCentavos),
              })),
            },
            historico: { create: { status_anterior: "RECEBIDO", status_novo: "PAGO", contaId } },
          },
        })
      }
      await tx.carrinhoItem.deleteMany({ where: { contaId } })
      return compra
    })
  } catch (error) {
    // Uma repetição simultânea pode chegar ao índice único antes da transação enxergar a compra.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existente = await prisma.compra.findUnique({
        where: { contaId_chaveIdempotencia: { contaId, chaveIdempotencia: dados.chave } },
      })
      if (existente) return existente
    }
    throw error
  }
}
export async function mudarStatus(
  id: number,
  conta: { id: string; papel: string; empresaId: number | null },
  novoStatus: "PREPARANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO",
) {
  return serializable(async (tx) => {
    const pedido = await tx.pedido.findFirst({
      where: {
        id,
        compraId: { not: null },
        ...(conta.papel === "VENDEDOR"
          ? { empresaId: conta.empresaId! }
          : { compra: { contaId: conta.id } }),
      },
      include: { itens: true },
    })
    if (!pedido) throw new HttpError(404, "Pedido não encontrado.")
    if (pedido.status === novoStatus) return
    if (conta.papel === "COMPRADOR" && novoStatus !== "CANCELADO")
      throw new HttpError(403, "Somente o vendedor pode atualizar o envio.")
    const transicoes: Record<string, string[]> = {
      PAGO: ["PREPARANDO", "CANCELADO"],
      PREPARANDO: ["ENVIADO", "CANCELADO"],
      ENVIADO: ["ENTREGUE"],
      ENTREGUE: [],
      CANCELADO: [],
    }
    if (!transicoes[pedido.status]?.includes(novoStatus))
      throw new HttpError(409, "Esta mudança não é permitida no estado atual do pedido.")
    const resultado = await tx.pedido.updateMany({
      where: { id, status: pedido.status },
      data: { status: novoStatus },
    })
    if (resultado.count !== 1) throw new HttpError(409, "O pedido foi alterado. Atualize a página.")
    await tx.historicoStatusPedido.create({
      data: {
        pedidoId: id,
        contaId: conta.id,
        status_anterior: pedido.status,
        status_novo: novoStatus,
      },
    })
    if (novoStatus === "CANCELADO") {
      for (const item of pedido.itens)
        if (item.produtoId)
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { increment: item.quantidade } },
          })
      await tx.estorno.create({
        data: { pedidoId: id, valorCentavos: centavos(pedido.valor_total) },
      })
      const restantes = await tx.pedido.count({
        where: { compraId: pedido.compraId, status: { not: "CANCELADO" } },
      })
      await tx.compra.update({
        where: { id: pedido.compraId! },
        data: { pagamento: restantes ? "ESTORNADO_PARCIAL" : "ESTORNADO" },
      })
    }
  })
}
