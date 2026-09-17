import { z } from "zod"
import bcrypt from "bcryptjs"

export const cadastroSchema = z.object({
    nome_empresa: z.string().trim().min(2).max(120),
    nome: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    senha: z.string().min(12).refine(
        (senha) => !bcrypt.truncates(senha),
        {
            message: "A senha ultrapassa o limite de 72 bytes"
        }
    )
})

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    senha: z.string().min(1).max(72).refine(
        (senha) => !bcrypt.truncates(senha),
        {
            message: "A senha ultrapassa o limite de 72 bytes."
        }
    )
})