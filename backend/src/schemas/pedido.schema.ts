import { z } from "zod"

export const pedidoSchema = z.object({
    pedido_id: z.string().trim().min(1),
    frete: z.number().nonnegative().default(0),
    desconto: z.number().nonnegative().default(0),
    
    itens: z.array(
        z.object({
            sku: z.string().trim().min(1),
            quantidade: z.number().int().positive(),
            valor_unitario: z.number().nonnegative(),
        })
    ).min(1)
})

export const atualizarStatusSchema = z.object({
    status: z.enum([
        "RECEBIDO",
        "EM_PROCESSAMENTO",
        "CONCLUIDO",
        "CANCELADO"
    ])
})

type StatusPedido = z.infer<typeof atualizarStatusSchema>["status"]

export const transicoesPermitidas: Record<StatusPedido, StatusPedido[]> = {
    RECEBIDO: ["EM_PROCESSAMENTO", "CANCELADO"],
    EM_PROCESSAMENTO: ["CONCLUIDO", "CANCELADO"],
    CONCLUIDO: [],
    CANCELADO: []
}

export const listarPedidosSchema = z.object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(10),
    status: atualizarStatusSchema.shape.status.optional()
})