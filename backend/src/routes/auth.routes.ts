import { Router } from "express"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma.js"
import { Prisma } from "../generated/prisma/client.js"
import { cadastroSchema } from "../schemas/auth.schema.js"

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