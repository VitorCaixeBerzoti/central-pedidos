import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { Prisma } from "../generated/prisma/client.js"
import { pedidoSchema, atualizarStatusSchema, transicoesPermitidas } from "../schemas/pedido.schema.js"

export const pedidoRouter = Router()

pedidoRouter.post("/", async(req, res) => {
    const validacao = pedidoSchema.safeParse(req.body);

    if(!validacao.success) {
        res.status(400).json({
            mensagem: "pedido inválido",
            erros: validacao.error.issues
        });
        return;
    }

    const pedido = validacao.data;

    let subtotal = 0;

    pedido.itens.forEach((item) => {
        subtotal += item.quantidade * item.valor_unitario;
    })

    const valorTotal = subtotal + pedido.frete - pedido.desconto;

    try {
        const pedidoSalvo = await prisma.pedido.create({
            data: {
                pedido_id: pedido.pedido_id,
                frete: pedido.frete,
                desconto: pedido.desconto,
                valor_total: Number(valorTotal.toFixed(2)),
                itens: {
                    create: pedido.itens.map((item) => ({
                        sku: item.sku,
                        quantidade: item.quantidade,
                        valor_unitario: item.valor_unitario
                    }))
                }
            },
            include: {
                itens: true
            }
        })
        
        res.status(201).json({
            mensagem: "pedido cadastrado com sucesso",
            pedido: pedidoSalvo
        })
        } catch (erro) {
            if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
                res.status(409).json({ mensagem: "Ja existe um pedido com esse pedido_id." });
                return;
            }
            console.error(erro);

            res.status(500).json({
                mensagem: "não foi possível salvar o pedido"
            })
        }
});

pedidoRouter.get("/", async (_req, res) => {
    try {
        const pedidos = await prisma.pedido.findMany({
            include: { itens: true },
            orderBy: { id: "desc" }
        });
        res.status(200).json({ pedidos });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: "Nao foi possivel consultar os pedidos." });
    }
});

pedidoRouter.get("/:pedido_id", async (req, res) => {
    const { pedido_id } = req.params

    try {
        const pedido = await prisma.pedido.findUnique({
            where: {
                pedido_id: pedido_id
            },
            include: {
                itens: true
            }
        })

        if (!pedido) {
            res.status(404).json({
                mensagem: "Pedido não encontrado."
            })
            return
        }

        res.status(200).json({
            pedido: pedido
        })
    } catch (erro) {
        console.error(erro)

        res.status(500).json({
            mensagem: "Não foi possivel consultar o pedido."
        })
    }
})

pedidoRouter.patch("/:pedido_id/status", async (req, res) => {
    const { pedido_id } = req.params;
    const validacao = atualizarStatusSchema.safeParse(req.body)

    if(!validacao.success) {
        res.status(400).json({
            mensagem: "Status inválido.",
            erros: validacao.error.issues
        })
        return
    }

    const novoStatus = validacao.data.status

    try {
        const pedidoAtual = await prisma.pedido.findUnique({
            where: {pedido_id},
        })

        if (!pedidoAtual) {
            res.status(404).json({
                mensagem: "Pedido não encontrado."
            })
            return
        }

        if (pedidoAtual.status === novoStatus) {
            res.status(200).json({
                mensagem: "O pedido ja esta nesse status.",
                pedido: pedidoAtual
            })
            return
        }

        if (!transicoesPermitidas[pedidoAtual.status].includes(novoStatus)) {
            res.status(409).json({ mensagem: "Transicao de status nao permitida." });
            return;
        }

        const pedido = await prisma.pedido.update({
            where: {
                pedido_id,
                status: pedidoAtual.status
            },
            data: {
                status: novoStatus
            }
        })

        res.status(200).json({
            mensagem: "Status atualizado com sucesso.",
            pedido
        })
    } catch (erro) {
        if (
            erro instanceof Prisma.PrismaClientKnownRequestError &&
            erro.code === "P2025"
        ) {
            res.status(409).json({
                mensagem: "o pedido mudou ou foi removido durante a operação. Consulte novamente."
            })
            return
        }

        console.error(erro)

        res.status(500).json({
            mensagem: "Não foi possivel atualizar o status."
        })
    }
})
