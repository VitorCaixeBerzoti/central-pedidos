import express, { type ErrorRequestHandler } from "express"
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { ZodError } from "zod"
import { Prisma } from "./generated/prisma/client.js"
import { pedidoRouter } from "./routes/pedido.routes.js"
import { authRouter } from "./routes/auth.routes.js"
import { autenticar } from "./middlewares/auth.middleware.js"
import { HttpError } from "./marketplace/core.js"
import { carregarSessao, protegerMutacoes } from "./marketplace/session.js"
import { sessionRouter } from "./marketplace/auth.routes.js"
import { catalogRouter } from "./marketplace/catalog.routes.js"
import { buyerRouter } from "./marketplace/cart.routes.js"
import { sellerRouter, uploadsDir } from "./marketplace/seller.routes.js"

export const app = express()
app.disable("x-powered-by")
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "blob:"],
        "upgrade-insecure-requests": process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    strictTransportSecurity: process.env.NODE_ENV === "production" ? undefined : false,
  }),
)
app.use(express.json({ limit: "100kb" }))
app.get("/health", (_req, res) => res.json({ status: "ok", mensagem: "Órbita disponível." }))
app.use(
  "/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    legacyHeaders: false,
    message: { mensagem: "Muitas tentativas. Aguarde alguns minutos." },
  }),
  authRouter,
)
app.use("/pedidos", autenticar, pedidoRouter)
app.use("/api", protegerMutacoes, carregarSessao, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store")
  next()
})
app.use("/api/sessao", sessionRouter)
app.use("/api", catalogRouter)
app.use("/api/comprador", buyerRouter)
app.use("/api/vendedor", sellerRouter)
app.use("/api", (_req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }))
app.use("/uploads", express.static(uploadsDir, { maxAge: "7d", immutable: true }))
const frontendDir = fileURLToPath(new URL("../../frontend/dist/", import.meta.url))
if (existsSync(frontendDir)) {
  app.use(express.static(frontendDir, { index: false }))
  app.get(/^(?!\/(?:api|auth|pedidos|uploads)(?:\/|$)).*/, (_req, res) =>
    res.sendFile(`${frontendDir}/index.html`),
  )
}
const erros: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ mensagem: error.message })
    return
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      mensagem: error.issues[0]?.message ?? "Dados inválidos.",
      erros: error.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })),
    })
    return
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ mensagem: "Este cadastro já existe. Confira os dados." })
      return
    }
    if (error.code === "P2025") {
      res.status(404).json({ mensagem: "Registro não encontrado ou indisponível." })
      return
    }
    if (error.code === "P2034") {
      res.status(409).json({ mensagem: "Outra operação ocorreu ao mesmo tempo. Tente novamente." })
      return
    }
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ mensagem: "Arquivo ou requisição acima do tamanho permitido." })
    return
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ mensagem: "JSON inválido." })
    return
  }
  console.error("Falha interna:", error instanceof Error ? error.name : "desconhecida")
  res.status(500).json({ mensagem: "Não foi possível concluir. Tente novamente em instantes." })
}
app.use(erros)
