import { createHash } from "node:crypto"
import { Prisma } from "../generated/prisma/client.js"
import { prisma } from "../lib/prisma.js"
import { z } from "zod"

export const FRETE_CENTAVOS = 1500
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export const senhaSchema = z
  .string()
  .min(12, "Use ao menos 12 caracteres.")
  .refine((s) => Buffer.byteLength(s, "utf8") <= 72, "A senha deve ter até 72 bytes.")
export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase().max(254),
    senha: senhaSchema,
    papel: z.enum(["COMPRADOR", "VENDEDOR"]),
    loja: z.string().trim().min(2).max(100).optional(),
  })
  .refine((d) => d.papel !== "VENDEDOR" || !!d.loja, {
    message: "Informe o nome da loja.",
    path: ["loja"],
  })
export const produtoSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  descricao: z.string().trim().min(20).max(4000),
  precoCentavos: z.number().int().min(1).max(99999999),
  estoque: z.number().int().min(0).max(100000),
  imagem: z
    .string()
    .regex(/^\/(?:images\/[a-z0-9-]+\.(?:jpg|webp|png)|uploads\/[a-f0-9-]+\.webp)$/),
  categoriaId: z.string().min(1).max(50),
  ativo: z.boolean().default(true),
})
export const enderecoSchema = z.object({
  destinatario: z.string().trim().min(2).max(100),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido."),
  rua: z.string().trim().min(3).max(150),
  numero: z.string().trim().min(1).max(20),
  complemento: z.string().trim().max(100).default(""),
  cidade: z.string().trim().min(2).max(100),
  estado: z.enum([
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ]),
})
export const hash = (value: string) => createHash("sha256").update(value).digest("hex")
export const reais = (centavos: number) => new Prisma.Decimal(centavos).div(100)
export const centavos = (valor: Prisma.Decimal) => valor.mul(100).toNumber()
export async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: "Serializable", timeout: 15000 })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        tentativa < 3
      )
        continue
      throw error
    }
  }
}
