import { randomBytes } from "node:crypto"
import { parseCookie, stringifySetCookie } from "cookie"
import type { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma.js"
import { hash, HttpError } from "./core.js"

export const contaPublica = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  empresaId: true,
  empresa: { select: { id: true, nome: true, descricao: true } },
} as const
const duracao = 30 * 24 * 60 * 60
const cookieName = "orbita_session"
const opcoes = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export async function carregarSessao(req: Request, res: Response, next: NextFunction) {
  const token = parseCookie(req.headers.cookie ?? "")[cookieName]
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const sessao = await prisma.sessaoNavegador.findUnique({
      where: { tokenHash: hash(token) },
      include: { perfis: { include: { conta: { select: contaPublica } } } },
    })
    if (sessao && sessao.expiraEm > new Date()) {
      res.locals.sessao = sessao
      res.locals.conta =
        sessao.perfis.find((p) => p.contaId === sessao.contaAtivaId)?.conta ??
        sessao.perfis[0]?.conta ??
        null
      if (res.locals.conta && sessao.contaAtivaId !== res.locals.conta.id) {
        await prisma.sessaoNavegador.update({
          where: { id: sessao.id },
          data: { contaAtivaId: res.locals.conta.id },
        })
        sessao.contaAtivaId = res.locals.conta.id
      }
    }
  }
  next()
}
export function exigirConta(papel?: "COMPRADOR" | "VENDEDOR") {
  return (req: Request, res: Response, next: NextFunction) => {
    const conta = res.locals.conta
    if (!conta) throw new HttpError(401, "Entre em uma conta para continuar.")
    if (papel && conta.papel !== papel)
      throw new HttpError(
        403,
        `Troque para uma conta de ${papel === "COMPRADOR" ? "comprador" : "vendedor"}.`,
      )
    if (req.method !== "GET" && req.get("X-Account-Id") !== conta.id)
      throw new HttpError(409, "O perfil ativo mudou. Atualize a página antes de continuar.")
    next()
  }
}
export async function conectarConta(res: Response, contaId: string) {
  const token = randomBytes(32).toString("hex")
  const expiraEm = new Date(Date.now() + duracao * 1000)
  const anterior = res.locals.sessao
  if (anterior) {
    if (
      anterior.perfis.length >= 5 &&
      !anterior.perfis.some((p: { contaId: string }) => p.contaId === contaId)
    )
      throw new HttpError(400, "Remova um perfil antes de conectar mais de cinco contas.")
    await prisma.sessaoNavegador.update({
      where: { id: anterior.id },
      data: {
        tokenHash: hash(token),
        contaAtivaId: contaId,
        expiraEm,
        perfis: {
          upsert: {
            where: { sessaoId_contaId: { sessaoId: anterior.id, contaId } },
            create: { contaId },
            update: {},
          },
        },
      },
    })
  } else {
    await prisma.sessaoNavegador.create({
      data: {
        tokenHash: hash(token),
        contaAtivaId: contaId,
        expiraEm,
        perfis: { create: { contaId } },
      },
    })
  }
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({ name: cookieName, value: token, ...opcoes, maxAge: duracao }),
  )
}
export function limparCookie(res: Response) {
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({ name: cookieName, value: "", ...opcoes, maxAge: 0 }),
  )
}
export function protegerMutacoes(req: Request, _res: Response, next: NextFunction) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.get("X-Orbita-Request") !== "1") throw new HttpError(403, "Requisição não autorizada.")
    const origin = req.get("Origin")
    const allowed = (
      process.env.APP_ORIGIN ??
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )
      .split(",")
      .map((origin) => origin.trim())
    if (origin && !allowed.includes(origin)) throw new HttpError(403, "Origem não autorizada.")
  }
  next()
}
