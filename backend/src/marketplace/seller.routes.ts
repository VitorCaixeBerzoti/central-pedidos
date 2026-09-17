import { Router, raw } from "express"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { centavos, HttpError, produtoSchema } from "./core.js"
import { mudarStatus, pedidoDto, pedidoInclude, produtoInclude } from "./orders.service.js"
import { exigirConta } from "./session.js"

export const uploadsDir = fileURLToPath(new URL("../../storage/uploads/", import.meta.url))
export const sellerRouter = Router()
sellerRouter.use(exigirConta("VENDEDOR"))
sellerRouter.get("/resumo", async (_req, res) => {
  const empresaId = res.locals.conta.empresaId
  const [produtos, estoqueBaixo, grupos] = await prisma.$transaction(
    [
      prisma.produto.count({ where: { empresaId, ativo: true } }),
      prisma.produto.count({ where: { empresaId, ativo: true, estoque: { lte: 5 } } }),
      prisma.pedido.groupBy({
        by: ["status"],
        where: { empresaId, compraId: { not: null } },
        _count: true,
        _sum: { valor_total: true },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  )
  res.json({
    produtos,
    estoqueBaixo,
    pedidos: grupos.reduce((s, g) => s + g._count, 0),
    vendasCentavos: grupos
      .filter((g) => g.status !== "CANCELADO")
      .reduce((s, g) => s + centavos(g._sum.valor_total!), 0),
    preparar: grupos
      .filter((g) => ["PAGO", "PREPARANDO"].includes(g.status))
      .reduce((s, g) => s + g._count, 0),
    porStatus: grupos.map((g) => ({ status: g.status, quantidade: g._count })),
  })
})
sellerRouter.get("/produtos", async (_req, res) => {
  res.json(
    await prisma.produto.findMany({
      where: { empresaId: res.locals.conta.empresaId },
      include: produtoInclude,
      orderBy: { criadoEm: "desc" },
    }),
  )
})
sellerRouter.post("/produtos", async (req, res) => {
  const dados = produtoSchema.parse(req.body)
  if (!(await prisma.categoria.findUnique({ where: { id: dados.categoriaId } })))
    throw new HttpError(400, "Categoria inválida.")
  res.status(201).json(
    await prisma.produto.create({
      data: { ...dados, empresaId: res.locals.conta.empresaId },
      include: produtoInclude,
    }),
  )
})
sellerRouter.put("/produtos/:id", async (req, res) => {
  const { atualizadoEm, ...dados } = produtoSchema
    .extend({ atualizadoEm: z.iso.datetime() })
    .parse(req.body)
  const id = z.uuid().parse(req.params.id)
  if (!(await prisma.categoria.findUnique({ where: { id: dados.categoriaId } })))
    throw new HttpError(400, "Categoria inválida.")
  const resultado = await prisma.produto.updateMany({
    where: { id, empresaId: res.locals.conta.empresaId, atualizadoEm: new Date(atualizadoEm) },
    data: dados,
  })
  if (!resultado.count) {
    if (!(await prisma.produto.findFirst({ where: { id, empresaId: res.locals.conta.empresaId } })))
      throw new HttpError(404, "Produto não encontrado.")
    throw new HttpError(
      409,
      "Este produto mudou desde que você abriu a edição. Feche o formulário e atualize a página para revisar preço e estoque.",
    )
  }
  res.json(await prisma.produto.findUniqueOrThrow({ where: { id }, include: produtoInclude }))
})
sellerRouter.post(
  "/imagens",
  raw({ type: "application/octet-stream", limit: "5mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length)
      throw new HttpError(400, "Envie uma imagem JPG, PNG ou WebP.")
    let imagem: Buffer
    try {
      const pipeline = sharp(req.body, { limitInputPixels: 25000000 })
      const meta = await pipeline.metadata()
      if (!["jpeg", "png", "webp"].includes(meta.format ?? "")) throw new Error("Formato inválido")
      imagem = await pipeline
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()
    } catch {
      throw new HttpError(400, "Imagem inválida. Use JPG, PNG ou WebP de até 5 MB.")
    }
    await mkdir(uploadsDir, { recursive: true })
    const nome = `${randomUUID()}.webp`
    await writeFile(`${uploadsDir}/${nome}`, imagem)
    res.status(201).json({ imagem: `/uploads/${nome}` })
  },
)
sellerRouter.get("/pedidos", async (_req, res) => {
  res.json(
    (
      await prisma.pedido.findMany({
        where: { empresaId: res.locals.conta.empresaId, compraId: { not: null } },
        include: pedidoInclude,
        orderBy: { criado_em: "desc" },
        take: 100,
      })
    ).map(pedidoDto),
  )
})
sellerRouter.patch("/pedidos/:id/status", async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["PREPARANDO", "ENVIADO", "ENTREGUE", "CANCELADO"]) })
    .parse(req.body)
  await mudarStatus(
    z.coerce.number().int().positive().parse(req.params.id),
    res.locals.conta,
    status,
  )
  res.json({ mensagem: "Pedido atualizado." })
})
sellerRouter.patch("/loja", async (req, res) => {
  const dados = z
    .object({ nome: z.string().trim().min(2).max(100), descricao: z.string().trim().max(500) })
    .parse(req.body)
  res.json(
    await prisma.empresa.update({
      where: { id: res.locals.conta.empresaId },
      data: dados,
      select: { id: true, nome: true, descricao: true },
    }),
  )
})
