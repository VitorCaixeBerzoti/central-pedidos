import express from "express";
import { pedidoRouter } from "./routes/pedido.routes.js"
import { authRouter } from "./routes/auth.routes.js"

const app = express();

app.use(express.json());

app.use("/auth", authRouter)

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        mensagem: "Central de Pedidos funcionando!"
    });
});

app.use("/pedidos", pedidoRouter)

app.listen(3000, () => {
    console.log("API disponivel em http://localhost:3000");
});