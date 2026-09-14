import express from "express";
import { z } from "zod";

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

app.post("/pedidos", (req, res) => {
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

    res.status(200).json({
        mensagem: "pedido validado com sucesso",
        pedido: validacao.data,
        subtotal: Number(subtotal.toFixed(2)),
        valor_total: Number(valorTotal.toFixed(2))
    });;
});

app.listen(3000, () => {
    console.log("API disponivel em http://localhost:3000");
});