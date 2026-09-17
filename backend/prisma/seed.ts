import bcrypt from "bcryptjs"
import { prisma } from "../src/lib/prisma.js"

// Somente demonstração: o seed não atualiza senhas, estoque ou anúncios existentes.
if (process.env.NODE_ENV === "production")
  throw new Error("O catálogo de demonstração só pode ser criado em desenvolvimento.")
const senhaHash = await bcrypt.hash("OrbitaDemo2026!", 12)
try {
  const categorias = [
    ["tecnologia", "Tecnologia"],
    ["casa", "Casa & design"],
    ["estilo", "Estilo"],
    ["bem-estar", "Bem-estar"],
    ["livros", "Livros & ideias"],
  ]
  for (const [id, nome] of categorias)
    await prisma.categoria.upsert({
      where: { id: id! },
      create: { id: id!, nome: nome! },
      update: {},
    })
  const lojas = []
  for (const [email, nome, loja, descricao] of [
    [
      "nova@orbita.demo",
      "Marina Costa",
      "Nova Studio",
      "Tecnologia e objetos que tornam o cotidiano mais interessante.",
    ],
    [
      "forma@orbita.demo",
      "Rafael Lima",
      "Forma & Casa",
      "Design para espaços que contam a sua história.",
    ],
    [
      "movimento@orbita.demo",
      "Luiza Santos",
      "Movimento",
      "Estilo e novas ideias para acompanhar o seu ritmo.",
    ],
  ]) {
    const conta = await prisma.conta.upsert({
      where: { email: email! },
      create: {
        email: email!,
        nome: nome!,
        senhaHash,
        papel: "VENDEDOR",
        empresa: { create: { nome: loja!, descricao: descricao! } },
      },
      update: {},
    })
    lojas.push(conta.empresaId!)
  }
  await prisma.conta.upsert({
    where: { email: "explorador@orbita.demo" },
    create: {
      email: "explorador@orbita.demo",
      nome: "Alex Ribeiro",
      senhaHash,
      papel: "COMPRADOR",
    },
    update: {},
  })
  const produtos = [
    [
      "Headphone Studio Wireless",
      "Som que encontra o seu espaço. Fone sem fio com almofadas confortáveis, design envolvente e acabamento preto. Um companheiro para trabalhar, descobrir novas músicas e desacelerar. Produto ilustrativo do catálogo de demonstração.",
      34990,
      "headphones",
      "tecnologia",
      0,
      true,
    ],
    [
      "Câmera Mirrorless Explore",
      "Guarde as descobertas do caminho. Uma câmera compacta de acabamento preto, pensada para quem gosta de explorar a fotografia. Inclui corpo e lente ilustrados na imagem. Produto de demonstração, sem especificações comerciais de fabricante.",
      289900,
      "camera",
      "tecnologia",
      0,
      true,
    ],
    [
      "Relógio Essential Classic",
      "Um detalhe que faz a diferença. Mostrador minimalista e pulseira de acabamento elegante para acompanhar o seu dia. Confira a imagem do anúncio. Este é um produto ilustrativo do marketplace.",
      18990,
      "watch",
      "estilo",
      2,
      true,
    ],
    [
      "Tênis Urban Vermelho",
      "Cor e movimento em cada passo. Tênis de estilo esportivo com acabamento vermelho marcante. Nesta versão de demonstração, o anúncio representa um único modelo e tamanho, sem seleção de variações.",
      27990,
      "sneakers",
      "estilo",
      2,
      true,
    ],
    [
      "Luminária de Mesa Arco",
      "Uma luz nova para o seu canto favorito. Luminária de mesa para compor espaços de leitura e trabalho com personalidade. A imagem é ilustrativa; produto e entrega fazem parte da demonstração.",
      15990,
      "lamp",
      "casa",
      1,
      true,
    ],
    [
      "Mochila Everyday Explorer",
      "Tudo o que acompanha o seu próximo destino. Mochila versátil para organizar os essenciais da rotina, do trabalho aos passeios. Um produto ilustrativo da coleção Movimento.",
      21990,
      "backpack",
      "estilo",
      2,
      true,
    ],
    [
      "Teclado Creative Desk",
      "Seu espaço de trabalho com mais personalidade. Um teclado pensado para compor uma mesa prática e expressiva. Modelo ilustrativo; a demonstração não representa especificações de um fabricante.",
      29990,
      "keyboard",
      "tecnologia",
      0,
      false,
    ],
    [
      "Cadeira Design Contemporâneo",
      "Formas que acolhem. Uma cadeira para renovar o ambiente com um toque de design e conforto visual. Um anúncio ilustrativo da Forma & Casa para explorar a experiência de compra.",
      64990,
      "chair",
      "casa",
      1,
      false,
    ],
    [
      "Kit Ritual de Cuidado",
      "Um momento só seu. Seleção ilustrativa de cuidados pessoais para inspirar uma rotina mais leve. Não representa uma recomendação de uso ou uma composição específica.",
      12990,
      "skincare",
      "bem-estar",
      2,
      false,
    ],
    [
      "Livro — Histórias para Descobrir",
      "Uma pausa para outras ideias. Livro ilustrativo da nossa seleção de leitura, ideal para conhecer o fluxo de compra e entrega do marketplace. O título e o conteúdo são demonstrativos.",
      5990,
      "books",
      "livros",
      2,
      false,
    ],
    [
      "Caixa de Som Compacta",
      "Sua trilha sonora ocupa novos espaços. Uma caixa de som de formato compacto para acompanhar momentos em casa. Produto ilustrativo, sem promessa de potência ou conectividade de fabricante.",
      24990,
      "speaker",
      "tecnologia",
      0,
      false,
    ],
    [
      "Vaso Botânico Decorativo",
      "Um pouco de verde muda tudo. Vaso com planta para inspirar uma composição mais acolhedora. Imagem ilustrativa de uma peça decorativa do catálogo de demonstração.",
      7990,
      "plant",
      "casa",
      1,
      false,
    ],
  ] as const
  for (let i = 0; i < produtos.length; i++) {
    const [nome, descricao, precoCentavos, imagem, categoriaId, loja, destaque] = produtos[i]!
    const id = `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
    await prisma.produto.upsert({
      where: { id },
      create: {
        id,
        nome,
        descricao,
        precoCentavos,
        imagem: `/images/${imagem}.jpg`,
        categoriaId,
        empresaId: lojas[loja]!,
        estoque: 25,
        destaque,
      },
      update: {},
    })
  }
  console.log(
    "Catálogo pronto: 12 produtos, 5 categorias e 3 lojas. Contas de demonstração documentadas no README.",
  )
} finally {
  await prisma.$disconnect()
}
