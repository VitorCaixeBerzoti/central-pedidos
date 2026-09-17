import "dotenv/config"
import { before, after, test } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import pg from "pg"
import request from "supertest"
import type { Express } from "express"
import type { PrismaClient } from "../src/generated/prisma/client.js"

// Cada execução cria seu próprio banco vazio. Nunca usa nem limpa o banco de desenvolvimento.
const nomeBanco = `orbita_test_${randomUUID().replaceAll("-", "")}`
const originalUrl = process.env.DATABASE_URL!
const admin = new pg.Pool({ connectionString: originalUrl })
let app: Express
let prisma: PrismaClient
let criado = false
before(async () => {
  await admin.query(`CREATE DATABASE "${nomeBanco}"`)
  criado = true
  const testUrl = new URL(originalUrl)
  testUrl.pathname = `/${nomeBanco}`
  process.env.DATABASE_URL = testUrl.toString()
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: process.env,
    stdio: "pipe",
  })
  ;({ app } = await import("../src/app.js"))
  ;({ prisma } = await import("../src/lib/prisma.js"))
  await prisma.categoria.create({ data: { id: "teste", nome: "Categoria de teste" } })
})
after(async () => {
  await prisma?.$disconnect()
  if (criado && /^orbita_test_[a-f0-9]{32}$/.test(nomeBanco))
    await admin.query(`DROP DATABASE "${nomeBanco}" WITH (FORCE)`)
  await admin.end()
})
type Client = {
  agent: ReturnType<typeof request.agent>
  conta: { id: string; empresaId: number | null }
  cookie: string
}
const senha = "SenhaDeTeste2026!"
async function account(
  papel: "COMPRADOR" | "VENDEDOR",
  agent = request.agent(app),
): Promise<Client> {
  const email = `${randomUUID()}@example.test`
  const result = await agent
    .post("/api/sessao/cadastro")
    .set("X-Orbita-Request", "1")
    .send({
      nome: "Conta teste",
      email,
      senha,
      papel,
      ...(papel === "VENDEDOR" ? { loja: "Loja teste" } : {}),
    })
    .expect(201)
  return {
    agent,
    conta: result.body.conta,
    cookie: String(result.headers["set-cookie"][0]).split(";")[0]!,
  }
}
function mutation(client: Client, method: "post" | "put" | "patch" | "delete", path: string) {
  return client.agent[method](path)
    .set("X-Orbita-Request", "1")
    .set("X-Account-Id", client.conta.id)
}
async function product(seller: Client, estoque = 10, precoCentavos = 1299) {
  const result = await mutation(seller, "post", "/api/vendedor/produtos")
    .send({
      nome: "Produto para testar",
      descricao: "Um produto criado exclusivamente para testes automatizados.",
      precoCentavos,
      estoque,
      imagem: "/images/headphones.jpg",
      categoriaId: "teste",
      ativo: true,
    })
    .expect(201)
  return result.body
}
async function cart(buyer: Client, id: string, quantidade = 1) {
  return (
    await mutation(buyer, "put", `/api/comprador/carrinho/${id}`).send({ quantidade }).expect(200)
  ).body
}
const endereco = {
  destinatario: "Pessoa Fictícia",
  cep: "01001000",
  rua: "Rua de Teste",
  numero: "123",
  complemento: "",
  cidade: "São Paulo",
  estado: "SP",
}
function checkout(buyer: Client, cotacao: string, chave = randomUUID()) {
  return mutation(buyer, "post", "/api/comprador/checkout").send({ cotacao, chave, endereco })
}

test("perfis persistem, exigem autenticação própria e não atravessam papéis", async () => {
  const buyer = await account("COMPRADOR")
  const seller = await account("VENDEDOR", buyer.agent)
  const session = await seller.agent.get("/api/sessao").expect(200)
  assert.equal(session.body.perfis.length, 2)
  assert.equal(session.body.conta.id, seller.conta.id)
  await mutation(seller, "post", "/api/sessao/trocar").send({ contaId: randomUUID() }).expect(403)
  await mutation(seller, "post", "/api/sessao/trocar")
    .set("Origin", "https://malicioso.example")
    .send({ contaId: buyer.conta.id })
    .expect(403)
  await mutation(seller, "post", "/api/sessao/trocar")
    .set("X-Account-Id", buyer.conta.id)
    .send({ contaId: buyer.conta.id })
    .expect(409)
  await mutation(seller, "post", "/api/sessao/trocar").send({ contaId: buyer.conta.id }).expect(200)
  await buyer.agent.get("/api/vendedor/produtos").expect(403)
  assert.equal(
    (await request(app).get("/api/sessao").set("Cookie", seller.cookie)).body.conta.id,
    buyer.conta.id,
  )
  await mutation(buyer, "delete", `/api/sessao/perfis/${seller.conta.id}`).expect(200)
  await mutation(buyer, "post", "/api/sessao/trocar").send({ contaId: seller.conta.id }).expect(403)
  await mutation(buyer, "delete", "/api/sessao").expect(200)
  assert.equal(
    (await request(app).get("/api/sessao").set("Cookie", seller.cookie)).body.conta,
    null,
  )
})

test("checkout divide vendedores, cobra um frete por loja e é idempotente", async () => {
  const a = await account("VENDEDOR"),
    b = await account("VENDEDOR"),
    buyer = await account("COMPRADOR")
  const p1 = await product(a),
    p2 = await product(b, 10, 3599)
  await cart(buyer, p1.id, 2)
  const quote = await cart(buyer, p2.id)
  assert.equal(quote.freteCentavos, 3000)
  assert.equal(quote.totalCentavos, 9197)
  assert.equal((await prisma.produto.findUniqueOrThrow({ where: { id: p1.id } })).estoque, 10)
  const key = randomUUID()
  const first = await checkout(buyer, quote.cotacao, key).expect(201)
  const again = await checkout(buyer, quote.cotacao, key).expect(201)
  assert.equal(first.body.compraId, again.body.compraId)
  const compras = (await buyer.agent.get("/api/comprador/compras").expect(200)).body
  assert.equal(compras.length, 1)
  assert.equal(compras[0].pedidos.length, 2)
  assert.equal(
    compras[0].pedidos.reduce((s: number, p: { totalCentavos: number }) => s + p.totalCentavos, 0),
    9197,
  )
  assert.equal((await prisma.produto.findUniqueOrThrow({ where: { id: p1.id } })).estoque, 8)
  assert.equal((await buyer.agent.get("/api/comprador/carrinho")).body.quantidade, 0)
  const stranger = await account("COMPRADOR")
  assert.equal((await stranger.agent.get("/api/comprador/compras")).body.length, 0)
  const orderA = (await a.agent.get("/api/vendedor/pedidos")).body[0]
  const orderB = (await b.agent.get("/api/vendedor/pedidos")).body[0]
  assert.notEqual(orderA.id, orderB.id)
  await mutation(b, "patch", `/api/vendedor/pedidos/${orderA.id}/status`)
    .send({ status: "CANCELADO" })
    .expect(404)
  await mutation(stranger, "post", `/api/comprador/pedidos/${orderA.id}/cancelar`).expect(404)
  await mutation(b, "put", `/api/vendedor/produtos/${p1.id}`)
    .send({ ...p1, descricao: "Tentativa de alterar o produto de outra empresa." })
    .expect(404)
  await mutation(buyer, "post", `/api/comprador/pedidos/${orderA.id}/cancelar`).expect(200)
  await mutation(buyer, "post", `/api/comprador/pedidos/${orderA.id}/cancelar`).expect(200)
  assert.equal((await prisma.produto.findUniqueOrThrow({ where: { id: p1.id } })).estoque, 10)
  assert.equal(await prisma.estorno.count({ where: { pedidoId: orderA.id } }), 1)
  assert.equal(
    (await prisma.compra.findUniqueOrThrow({ where: { id: first.body.compraId } })).pagamento,
    "ESTORNADO_PARCIAL",
  )
  await mutation(b, "patch", `/api/vendedor/pedidos/${orderB.id}/status`)
    .send({ status: "ENVIADO" })
    .expect(409)
  await mutation(b, "patch", `/api/vendedor/pedidos/${orderB.id}/status`)
    .send({ status: "PREPARANDO" })
    .expect(200)
  await mutation(b, "patch", `/api/vendedor/pedidos/${orderB.id}/status`)
    .send({ status: "ENVIADO" })
    .expect(200)
  await mutation(buyer, "post", `/api/comprador/pedidos/${orderB.id}/cancelar`).expect(409)
  await mutation(b, "patch", `/api/vendedor/pedidos/${orderB.id}/status`)
    .send({ status: "ENTREGUE" })
    .expect(200)
})

test("duas compras concorrentes nunca vendem a mesma última unidade", async () => {
  const seller = await account("VENDEDOR"),
    a = await account("COMPRADOR"),
    b = await account("COMPRADOR")
  const p = await product(seller, 1)
  const qa = await cart(a, p.id),
    qb = await cart(b, p.id)
  const resultados = await Promise.all([checkout(a, qa.cotacao), checkout(b, qb.cotacao)])
  assert.deepEqual(resultados.map((r) => r.status).sort(), [201, 409])
  assert.equal((await prisma.produto.findUniqueOrThrow({ where: { id: p.id } })).estoque, 0)
  assert.equal(await prisma.itemPedido.count({ where: { produtoId: p.id } }), 1)
  // Uma edição aberta antes da venda não pode sobrescrever o estoque vendido.
  await mutation(seller, "put", `/api/vendedor/produtos/${p.id}`).send(p).expect(409)
})

test("preço alterado e falha em outro vendedor desfazem o checkout inteiro", async () => {
  const seller = await account("VENDEDOR"),
    buyer = await account("COMPRADOR")
  const p = await product(seller, 5)
  const quote = await cart(buyer, p.id)
  await prisma.produto.update({ where: { id: p.id }, data: { precoCentavos: 1500 } })
  await checkout(buyer, quote.cotacao).expect(409)
  assert.equal(await prisma.compra.count({ where: { contaId: buyer.conta.id } }), 0)
  const otherSeller = await account("VENDEDOR")
  const second = await product(otherSeller, 2)
  const newQuote = await cart(buyer, second.id)
  await prisma.produto.update({ where: { id: second.id }, data: { estoque: 0 } })
  await checkout(buyer, newQuote.cotacao).expect(409)
  assert.equal((await prisma.produto.findUniqueOrThrow({ where: { id: p.id } })).estoque, 5)
  assert.equal(await prisma.compra.count({ where: { contaId: buyer.conta.id } }), 0)
  assert.equal((await buyer.agent.get("/api/comprador/carrinho")).body.quantidade, 2)
})

test("trocar senha exige a atual e revoga sessões anteriores da conta", async () => {
  const buyer = await account("COMPRADOR")
  const email = (await buyer.agent.get("/api/sessao")).body.conta.email
  const outro = request.agent(app)
  const login = await outro
    .post("/api/sessao/login")
    .set("X-Orbita-Request", "1")
    .send({ email, senha })
    .expect(200)
  assert.match(String(login.headers["set-cookie"]), /HttpOnly/)
  assert.match(String(login.headers["set-cookie"]), /Max-Age=2592000/)
  await mutation(buyer, "patch", "/api/sessao/senha")
    .send({ senhaAtual: "errada", novaSenha: "NovaSenhaDeTeste2026!" })
    .expect(401)
  await mutation(buyer, "patch", "/api/sessao/senha")
    .send({ senhaAtual: senha, novaSenha: "NovaSenhaDeTeste2026!" })
    .expect(200)
  assert.equal((await outro.get("/api/sessao")).body.conta, null)
  assert.equal((await buyer.agent.get("/api/sessao")).body.conta.id, buyer.conta.id)
})
