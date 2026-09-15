import express from "express";
import { Prisma } from "./generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(express.json());

const pedidoSchema = z.object({
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
});

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        mensagem: "Central de Pedidos funcionando!"
    });
});

app.post("/pedidos", async(req, res) => {
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

app.get("/pedidos", async (_req, res) => {
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

app.get("/pedidos/:pedido_id", async (req, res) => {
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

app.listen(3000, () => {
    console.log("API disponivel em http://localhost:3000");
});