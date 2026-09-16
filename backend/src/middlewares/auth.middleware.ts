import "dotenv/config"
import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"

function carregarJwtSecret(): string {
    const segredo = process.env.JWT_SECRET

    if (!segredo) {
        throw new Error("JWT_SECRET não configurado no .env")
    }

    return segredo
}

const jwtSecret = carregarJwtSecret()

export function autenticar(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authorization = req.headers.authorization
    const partes = authorization?.trim().split(/\s+/)

    if (
        !partes ||
        partes.length !== 2 ||
        partes[0]?.toLowerCase() !== "bearer" ||
        !partes[1]
        ) {
            res.status(401).json({
                mensagem: "Envie o token no formato Bearer."
            })
            return
    }

    const token = partes[1]

    try {
        const dados = jwt.verify(token, jwtSecret, {
            algorithms: ["HS256"]
        })

        if (typeof dados === "string") {
            res.status(401).json({ mensagem: "token inválido" })
            return
        }

        const usuarioId = Number(dados.sub)

        if (
            !Number.isSafeInteger(usuarioId) ||
            usuarioId <= 0 ||
            !Number.isSafeInteger(dados.empresaId) ||
            dados.empresaId <= 0 ||
            typeof dados.exp !== "number"
        ) {
            res.status(401).json({ mensagem: "Token inválido" })
            return
        }

        res.locals.usuario = {
            id: usuarioId,
            empresaId: dados.empresaId
        }
    } catch {
        res.status(401).json({
            mensgame: "Token inválido ou expirado"})
    }

    next()
}