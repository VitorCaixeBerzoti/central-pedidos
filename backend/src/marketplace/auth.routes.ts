import { Router } from "express"
import { rateLimit } from "express-rate-limit"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { cadastroSchema, HttpError, senhaSchema } from "./core.js"
import { conectarConta, contaPublica, exigirConta, limparCookie } from "./session.js"

export const sessionRouter = Router()
const limite = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensagem: "Muitas tentativas. Aguarde alguns minutos." },
})
sessionRouter.get("/", (_req, res) => {
  res.json({
    conta: res.locals.conta ?? null,
    perfis: res.locals.sessao?.perfis.map((p: { conta: unknown }) => p.conta) ?? [],
  })
})
sessionRouter.post("/cadastro", limite, async (req, res) => {
  const dados = cadastroSchema.parse(req.body)
  if (res.locals.sessao?.perfis.length >= 5)
    throw new HttpError(400, "Remova um perfil antes de cadastrar outra conta.")
  const senhaHash = await bcrypt.hash(dados.senha, 12)
  const conta = await prisma.conta.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      papel: dados.papel,
      ...(dados.papel === "VENDEDOR" ? { empresa: { create: { nome: dados.loja! } } } : {}),
    },
    select: contaPublica,
  })
  await conectarConta(res, conta.id)
  res.status(201).json({ conta })
})
// A comparação com um hash substituto evita um atalho de tempo para emails inexistentes.
const hashSubstituto = bcrypt.hashSync("conta-inexistente-orbita", 12)
sessionRouter.post("/login", limite, async (req, res) => {
  const dados = z
    .object({ email: z.email().trim().toLowerCase().max(254), senha: z.string().min(1).max(100) })
    .parse(req.body)
  const conta = await prisma.conta.findUnique({ where: { email: dados.email } })
  const confere = await bcrypt.compare(dados.senha, conta?.senhaHash ?? hashSubstituto)
  if (!conta || !confere) throw new HttpError(401, "Email ou senha incorretos.")
  await conectarConta(res, conta.id)
  res.json({ mensagem: "Conta conectada." })
})
sessionRouter.post("/trocar", exigirConta(), async (req, res) => {
  const { contaId } = z.object({ contaId: z.uuid() }).parse(req.body)
  const sessao = res.locals.sessao
  if (!sessao.perfis.some((p: { contaId: string }) => p.contaId === contaId))
    throw new HttpError(403, "Conecte essa conta antes de trocar de perfil.")
  await prisma.sessaoNavegador.update({ where: { id: sessao.id }, data: { contaAtivaId: contaId } })
  res.json({ mensagem: "Perfil alterado." })
})
sessionRouter.delete("/perfis/:id", exigirConta(), async (req, res) => {
  const id = z.uuid().parse(req.params.id)
  const sessao = res.locals.sessao
  const restantes = sessao.perfis.filter((p: { contaId: string }) => p.contaId !== id)
  await prisma.$transaction(async (tx) => {
    await tx.perfilConectado.deleteMany({ where: { sessaoId: sessao.id, contaId: id } })
    if (!restantes.length) await tx.sessaoNavegador.delete({ where: { id: sessao.id } })
    else if (sessao.contaAtivaId === id)
      await tx.sessaoNavegador.update({
        where: { id: sessao.id },
        data: { contaAtivaId: restantes[0].contaId },
      })
  })
  if (!restantes.length) limparCookie(res)
  res.json({ mensagem: "Perfil removido deste navegador." })
})
sessionRouter.delete("/", async (_req, res) => {
  if (res.locals.sessao)
    await prisma.sessaoNavegador.deleteMany({ where: { id: res.locals.sessao.id } })
  limparCookie(res)
  res.json({ mensagem: "Todas as contas foram desconectadas deste navegador." })
})
sessionRouter.patch("/senha", limite, exigirConta(), async (req, res) => {
  const dados = z
    .object({ senhaAtual: z.string().min(1).max(100), novaSenha: senhaSchema })
    .parse(req.body)
  const conta = await prisma.conta.findUniqueOrThrow({ where: { id: res.locals.conta.id } })
  if (!(await bcrypt.compare(dados.senhaAtual, conta.senhaHash)))
    throw new HttpError(401, "A senha atual está incorreta.")
  const senhaHash = await bcrypt.hash(dados.novaSenha, 12)
  await prisma.$transaction(async (tx) => {
    await tx.conta.update({
      where: { id: conta.id, senhaHash: conta.senhaHash },
      data: { senhaHash },
    })
    await tx.perfilConectado.deleteMany({
      where: { contaId: conta.id, sessaoId: { not: res.locals.sessao.id } },
    })
  })
  await conectarConta(res, conta.id)
  res.json({ mensagem: "Senha alterada. Esta conta foi desconectada dos outros navegadores." })
})
