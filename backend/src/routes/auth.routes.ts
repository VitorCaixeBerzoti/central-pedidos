import { Router } from "express"
import "dotenv/config"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma.js"
import { Prisma } from "../generated/prisma/client.js"
import { cadastroSchema, loginSchema } from "../schemas/auth.schema.js"

const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
    throw new Error("JWT_SECRET não configurado no .env")
}

export const authRouter = Router()

authRouter.post("/cadastro", async (req, res) => {
    const validacao = cadastroSchema.safeParse(req.body)

    if (!validacao.success) {
        res.status(400).json({
            mensagem: "Dados de cadastro inválidos.",
            erros: validacao.error.issues
        })
        return
    }

    const { nome_empresa, nome, email, senha } = validacao.data

    try {
        const senhaHash = await bcrypt.hash(senha, 12)

        const empresa = await prisma.empresa.create({
            data: {
                nome: nome_empresa,
                usuarios: {
                    create: {
                        nome,
                        email,
                        senha_hash: senhaHash
                    }
                }
            },
            select: {
                id: true,
                nome: true,
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                }
            }
        })

        res.status(201).json({
            mensagem: "Empresa e usuario cadastrados com sucesso.",
            empresa
        })
    } catch (erro) {
        if (
            erro instanceof Prisma.PrismaClientKnownRequestError &&
            erro.code === "P2002"
        ) {
            res.status(409).json({
                mensagem: "Já existe um usuario esse email."
            })
            return
        }

        console.error(erro)

        res.status(500).json({
            mensagem: "Não foi possivel realizar o cadastro."
        })
    }
})

authRouter.post("/login", async (req, res) => {
    const validacao = loginSchema.safeParse(req.body)

    if(!validacao.success) {
        res.status(400).json({
            mensagem: "Dados de login inválidos.",
            erros: validacao.error.issues
        })
        return
    }

    const { senha, email } = validacao.data

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        })

        if (!usuario) {
            res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            })
            return
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        )

        if (!senhaCorreta) {
            res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            })
            return
        }

        const token = jwt.sign(
            { empresaId: usuario.empresaId },
            jwtSecret,
            {
                subject: String(usuario.id),
                expiresIn: "1h",
                algorithm: "HS256"
            }
        )

        res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                empresaId: usuario.empresaId
            }
        })
    } catch (erro) {
        console.error(erro)

        res.status(500).json({
            mensagem: "Não foi possivel realizar o login."
        })
    }
})