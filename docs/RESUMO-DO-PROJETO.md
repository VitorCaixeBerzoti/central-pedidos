# Resumo do projeto Órbita

## O que foi construído

Órbita é um marketplace de demonstração em português. O catálogo tem 12 produtos de três lojas e cinco categorias. Compradores podem buscar produtos, manter carrinho, finalizar compras simuladas e acompanhar pedidos. Vendedores podem publicar produtos, enviar fotos, ajustar estoque e atualizar pedidos. A API anterior da Central de Pedidos permanece disponível.

O pagamento, o frete de R$ 15 por loja e a entrega são simulações. Nenhuma cobrança ou envio real é realizado.

## Tecnologias usadas

| Área | Ferramentas e função |
| --- | --- |
| Interface | React 19, TypeScript, Vite 8 e React Router 7 para páginas e navegação. |
| Dados da interface | TanStack Query para consultas, cache e atualização após operações. |
| Visual | CSS responsivo, ícones Lucide e fontes DM Sans e Space Grotesk locais via Fontsource. |
| Servidor | Node.js 24, Express 5, Zod para validação, Helmet, limite de requisições e cookies. |
| Identidade | bcrypt para senhas, sessões de marketplace por cookie e JWT para as rotas antigas. |
| Banco | PostgreSQL 17 no Compose, Prisma 7 com adapter PostgreSQL, schema e migrations. |
| Fotos | Sharp para validar e converter uploads em WebP; imagens do catálogo servidas localmente. |
| Ambiente | Dockerfile e Docker Compose para aplicação, PostgreSQL, volumes de banco e uploads. |
| Qualidade | TypeScript, Prettier, Node Test Runner, Supertest, Playwright, axe-core e GitHub Actions. |

## Organização das pastas

```text
frontend/
  public/                 imagens, favicon e outros arquivos servidos diretamente
  src/components/         componentes compartilhados
  src/pages/              telas do catálogo, compra, conta e vendedor
  src/lib/                cliente HTTP e sessão no navegador
  src/styles.css          estilos e adaptação para celular
backend/
  prisma/schema.prisma    modelos do banco
  prisma/migrations/      evolução obrigatória do banco
  prisma/seed.ts          catálogo e contas de demonstração
  src/app.ts              rotas, segurança e arquivos do site compilado
  src/marketplace/        regras do marketplace
  src/routes/             rotas antigas da Central de Pedidos
  storage/uploads/        fotos enviadas pelos usuários, ignoradas pelo Git
  tests/                  testes de integração da API
tests/                    testes de navegador
scripts/e2e-server.mjs    servidor e banco isolados para esses testes
docs/                     arquitetura, estudo, créditos e histórico da entrega
compose.yaml              serviços e volumes Docker
Dockerfile                imagem da aplicação
```

`node_modules`, `frontend/dist`, `backend/src/generated/prisma`, relatórios de testes e uploads locais são gerados ou armazenados durante o uso. Não precisam ser versionados. Os arquivos `package-lock.json`, as migrations e as imagens em `frontend/public/images` são necessários para reproduzir o projeto e permanecem no repositório.

## Como a aplicação inicia

Com `docker compose up --build -d`, o Compose inicia PostgreSQL, espera o banco ficar saudável, aplica migrations, executa o seed e inicia o servidor. O backend entrega a API, os uploads e o frontend compilado em <http://localhost:3000>. O banco e os uploads ficam em volumes separados e permanecem após `docker compose down`.

Sem Docker, `npm run setup` instala dependências, gera o Prisma Client, aplica migrations e executa o seed. `npm run dev` abre frontend em `localhost:5173` e API em `localhost:3000`. É necessário configurar `backend/.env` e um PostgreSQL local.

## Regras principais

- Contas de comprador e vendedor são independentes. Até cinco perfis podem ficar conectados no mesmo navegador.
- O checkout divide uma compra em pedidos por loja e calcula preços no servidor. Estoque, compra, pedidos e histórico são gravados em uma transação.
- Uma chave de confirmação impede duplicação da compra. Cancelamentos permitidos devolvem estoque e registram estorno simulado uma só vez.
- Sessões do marketplace usam cookie `HttpOnly`; o banco guarda apenas o hash do identificador da sessão. As rotas antigas continuam com JWT.
- As alterações conferem o perfil esperado, e o backend valida entrada, origem e permissões.

Para detalhes das decisões técnicas, leia [Arquitetura](ARQUITETURA.md). Para exercícios guiados, leia [Plano de estudo](PLANO-DE-ESTUDO.md). As origens das fotos estão em [Créditos](CREDITOS.md).

## Limites atuais

A aplicação é uma demonstração local. Fotos enviadas ficam no armazenamento local e o limitador de tentativas fica na memória do servidor. Uma operação pública precisaria de HTTPS, segredos próprios, persistência e backup adequados, além de integrações reais de pagamento e entrega.
