# Órbita — marketplace

Marketplace de demonstração em português, com catálogo, contas de comprador e vendedor, carrinho, pedidos e painel de vendas. Pagamento e entrega são simulados.

O [resumo do projeto](docs/RESUMO-DO-PROJETO.md) reúne funcionalidades, tecnologias, regras e o mapa das pastas.

## Abrir com Docker Compose

Na raiz do projeto, com Docker disponível:

```powershell
docker compose up --build -d
```

Abra <http://localhost:3000>. A API responde em <http://localhost:3000/health>. O Compose cria um banco PostgreSQL próprio, aplica as migrations e prepara os dados de demonstração. A porta 3000 precisa estar livre.

```powershell
docker compose logs -f app
docker compose down
```

O banco e as fotos enviadas permanecem em volumes Docker após `down`. `docker compose down -v` apaga os dados dessa demonstração.

## Contas de demonstração

Senha inicial para todas: **`OrbitaDemo2026!`**.

| Email | Perfil | Loja |
| --- | --- | --- |
| explorador@orbita.demo | Comprador | — |
| nova@orbita.demo | Vendedor | Nova Studio |
| forma@orbita.demo | Vendedor | Forma & Casa |
| movimento@orbita.demo | Vendedor | Movimento |

Também é possível cadastrar contas pela interface e alternar entre perfis conectados.

## Desenvolvimento sem Docker

Requisitos: Node.js 24, npm e PostgreSQL 15 ou superior. Crie `backend/.env` a partir de `backend/.env.example` e configure um banco local. Preserve o arquivo `.env` caso ele já exista.

```powershell
npm ci
npm run setup
npm run dev
```

O site abre em <http://localhost:5173> e a API em <http://localhost:3000/health>. `Ctrl+C` encerra ambos. `npm run setup` instala dependências, gera o Prisma Client, aplica migrations e cria os dados de demonstração. O seed não altera senhas, estoque ou anúncios já existentes.

Para atualizar um banco histórico que tenha `Pedido.empresaId` nulo, vincule os registros à empresa correta antes da migration que torna esse campo obrigatório. Em um banco novo, as migrations podem ser aplicadas diretamente.

## Verificação e documentação

```powershell
npm run build
npm run format:check
npx playwright install chromium
npm test
```

Os testes usam bancos temporários; o usuário PostgreSQL precisa da permissão `CREATEDB`. Após `npm run build`, `npm start` serve a API e o site juntos na porta 3000.

- [Resumo do projeto](docs/RESUMO-DO-PROJETO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Plano de estudo](docs/PLANO-DE-ESTUDO.md)
- [Créditos das imagens](docs/CREDITOS.md)
- [Histórico de validação](docs/VALIDACAO.md)
- [Branches da entrega](docs/BRANCHES.md)
