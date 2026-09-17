import { Router } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { HttpError } from "./core.js"
import { produtoInclude } from "./orders.service.js"

export const catalogRouter = Router()
catalogRouter.get("/categorias", async (_req, res) => {
  res.json(await prisma.categoria.findMany({ orderBy: { nome: "asc" } }))
})
catalogRouter.get("/produtos", async (req, res) => {
  const q = z
    .object({
      busca: z.string().trim().max(120).default(""),
      categoria: z.string().max(50).optional(),
      minimo: z.coerce.number().int().min(0).optional(),
      maximo: z.coerce.number().int().min(0).optional(),
      ordem: z.enum(["destaques", "recentes", "menor-preco", "maior-preco"]).default("destaques"),
      pagina: z.coerce.number().int().min(1).max(10000).default(1),
      limite: z.coerce.number().int().min(1).max(48).default(12),
      loja: z.coerce.number().int().positive().optional(),
    })
    .parse(req.query)
  const where = {
    ativo: true,
    ...(q.busca ? { nome: { contains: q.busca, mode: "insensitive" as const } } : {}),
    ...(q.categoria ? { categoriaId: q.categoria } : {}),
    ...(q.loja ? { empresaId: q.loja } : {}),
    precoCentavos: { gte: q.minimo, lte: q.maximo },
  }
  const orderBy =
    q.ordem === "menor-preco"
      ? [{ precoCentavos: "asc" as const }]
      : q.ordem === "maior-preco"
        ? [{ precoCentavos: "desc" as const }]
        : q.ordem === "recentes"
          ? [{ criadoEm: "desc" as const }]
          : [{ destaque: "desc" as const }, { criadoEm: "desc" as const }]
  const [produtos, total] = await prisma.$transaction(
    [
      prisma.produto.findMany({
        where,
        include: produtoInclude,
        orderBy: [...orderBy, { id: "asc" }],
        skip: (q.pagina - 1) * q.limite,
        take: q.limite,
      }),
      prisma.produto.count({ where }),
    ],
    { isolationLevel: "RepeatableRead" },
  )
  res.json({ produtos, total, paginas: Math.ceil(total / q.limite), pagina: q.pagina })
})
catalogRouter.get("/produtos/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id)
  const produto = await prisma.produto.findFirst({
    where: { id, ativo: true },
    include: produtoInclude,
  })
  if (!produto) throw new HttpError(404, "Este anúncio não está disponível.")
  res.json(produto)
})
