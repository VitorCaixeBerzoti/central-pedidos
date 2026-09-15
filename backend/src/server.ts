import express from "express";
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
            console.error(erro);

            res.status(500).json({
                mensagem: "não foi possível salvar o pedido"
            })
        }
});

app.listen(3000, () => {
    console.log("API disponivel em http://localhost:3000");
});