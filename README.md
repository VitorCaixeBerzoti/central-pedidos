# Órbita — marketplace

Um marketplace de demonstração que evolui a Central de Pedidos: catálogo público, várias lojas, contas de comprador e vendedor, carrinho com vários vendedores e acompanhamento de pedidos. Interface com identidade própria, em português, adaptada a desktop e celular.

A entrega está organizada em branches por assunto. Consulte o [mapa de branches e commits](docs/BRANCHES.md). A versão completa está em `feat/marketplace-orbita`.

## Abrir no computador

Com as dependências e o banco já preparados, execute **na raiz**:

```powershell
npm run dev
```

- Site: <http://localhost:5173>
- API: <http://localhost:3000/health>
- O comando inicia os dois processos. `Ctrl+C` encerra ambos.

### Contas de demonstração

Estas são contas fictícias criadas pelo seed. A senha inicial de todas é **`OrbitaDemo2026!`**.

| Email                  | Perfil    | Loja         |
| ---------------------- | --------- | ------------ |
| explorador@orbita.demo | Comprador | —            |
| nova@orbita.demo       | Vendedor  | Nova Studio  |
| forma@orbita.demo      | Vendedor  | Forma & Casa |
| movimento@orbita.demo  | Vendedor  | Movimento    |

Também é possível criar contas pela interface. Para experimentar a troca de perfis, entre em uma conta, abra o menu do perfil e clique em **Adicionar outro perfil**. Após autenticar a segunda conta, ambas ficam disponíveis no menu. As contas antigas da API JWT continuam separadas das novas contas do marketplace.

## Preparar uma instalação nova

Requisitos: Node.js 24, npm e PostgreSQL 15 ou superior. O PostgreSQL precisa estar acessível e o banco de desenvolvimento deve existir.

1. Crie `backend/.env` a partir de `backend/.env.example` e configure a conexão e o segredo JWT. Preserve um `.env` que já exista.
2. Na raiz, execute:

```powershell
npm ci
npm run setup
npm run dev
```

O setup instala as dependências de cada pasta, gera o Prisma Client, aplica migrations pendentes e cria o catálogo de demonstração. O seed adiciona dados ausentes; não sobrescreve senhas, anúncios ou estoque já existentes. As imagens e fontes necessárias estão no projeto, sem dependência de uma CDN durante a navegação.

**Banco antigo:** as migrations anteriores à Órbita foram preservadas. Se você estiver atualizando uma instalação histórica com `Pedido.empresaId` nulo, faça o vínculo correto desses registros antes da migration de obrigatoriedade de empresa. O projeto original fez esse ajuste manualmente; não se deve atribuir uma empresa arbitrária em outro ambiente. Em um banco vazio, a sequência completa é testada automaticamente.

## O que funciona

- Catálogo com cinco categorias, busca por nome, preço mínimo/máximo, ordenação e paginação.
- Página de produto com imagem, descrição, preço, estoque e loja responsável.
- Contas independentes de comprador/vendedor; cadastro livre de loja.
- Até cinco perfis conectados no mesmo navegador, troca por clique, remoção individual e saída de todos naquele navegador.
- Sessão por cookie `HttpOnly`, duração de 30 dias, hash do identificador no banco e `Secure` em produção. Nenhuma senha ou token é guardado no `localStorage`.
- Carrinho persistido por comprador, visualmente agrupado por loja.
- Um frete fixo de R$ 15 por loja, independentemente da quantidade de itens.
- Checkout com endereço fictício, pagamento automaticamente aprovado na simulação e um pedido por vendedor.
- Baixa de estoque, criação da compra, pedidos e histórico em uma única transação. Uma repetição com a mesma chave não cria outra compra.
- Pedidos nos estados pago, preparando, enviado, entregue e cancelado.
- Cancelamento de cada pedido antes do envio, devolução do estoque e registro único de estorno simulado, incluindo o frete daquele vendedor.
- Painel de vendas, anúncios, estoque baixo e etapas dos pedidos.
- Criação/edição de produtos, upload de foto, ajuste de estoque e pausa de anúncios. Edições antigas são recusadas se o produto mudou enquanto o formulário estava aberto.
- Alteração de senha confirmando a senha atual, com desconexão dessa conta nos outros navegadores.
- Estados de carregamento/erro/vazio, navegação por teclado, modais com foco, respeito a movimento reduzido e verificação automatizada de acessibilidade nas telas testadas.

Pagamento, frete e entrega são **simulados**. Não há cobrança, envio de encomenda ou integração com transportadora. A demonstração não solicita cartão ou CPF.

## Tecnologias e organização

| Parte              | Ferramentas                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| Interface          | React 19, TypeScript, Vite, React Router                                 |
| Dados na interface | TanStack Query, com consultas privadas vinculadas ao perfil              |
| Visual             | CSS responsivo, Lucide, fontes locais DM Sans e Space Grotesk            |
| API                | Express 5, Zod, bcrypt, cookies, Helmet e limitação de tentativas        |
| Persistência       | PostgreSQL, Prisma 7 e migrations                                        |
| Imagens            | Sharp: validação, orientação e conversão para WebP, até 5 MB             |
| Verificação        | Node Test Runner, Supertest, Playwright, axe-core, TypeScript e Prettier |

```text
frontend/src/
  components/       elementos de interface, autenticação e cartões de pedido
  pages/            catálogo, produto, carrinho, compras, vendedor e conta
  lib/              cliente HTTP, sessão e acesso ao carrinho
  styles.css        identidade visual e regras responsivas
backend/src/
  app.ts            montagem da API e tratamento de erros
  marketplace/      autenticação, catálogo, carrinho, lojas e transações
  routes/           API original, preservada
backend/prisma/
  schema.prisma     relações e modelos
  migrations/       evolução do banco, incluindo o histórico original
  seed.ts           dados fictícios da demonstração
backend/tests/      testes de integração em banco isolado
tests/              testes de navegador
docs/               arquitetura, decisões e plano de estudo
```

O frontend é uma SPA: é adequado ao objetivo de estudo e demonstração navegável. Renderização no servidor e otimizações específicas de indexação de catálogo são evoluções possíveis se o projeto virar uma operação pública.

## Build, testes e formatação

```powershell
npm run build
npm start
```

Depois do build, `npm start` serve API e site juntos em <http://localhost:3000>. Para produção, configure HTTPS, `NODE_ENV=production`, a origem pública em `APP_ORIGIN` e persistência para `backend/storage/uploads`. O seed recusa execução em produção.

```powershell
npx playwright install chromium
npm test
npm run format:check
```

Os testes criam bancos temporários próprios com prefixos `orbita_test_` e `orbita_e2e_`; não limpam nem alteram o banco de desenvolvimento. O usuário PostgreSQL usado nos testes precisa de permissão `CREATEDB`. A execução de navegador usa a porta 3101, prepara um catálogo isolado e remove o banco ao terminar. Fotos enviadas durante o teste ficam na pasta local de uploads, ignorada pelo Git. O relatório fica em `playwright-report`; capturas em `artifacts`.

O workflow `.github/workflows/ci.yml` executa formatação, build e testes com PostgreSQL em um serviço separado quando houver push ou pull request. Sua execução remota depende de publicar o repositório; a validação local não comprova uma execução no GitHub.

## Decisões que vale conhecer

- Valores novos são calculados em centavos inteiros. A conversão para os campos `Decimal` dos pedidos usa `Prisma.Decimal`, preservando o modelo existente.
- O servidor calcula todos os valores e valida o estoque novamente no checkout. Uma mudança de preço exige que o comprador confira uma nova cotação.
- Transações serializáveis têm repetição limitada para conflitos concorrentes. Cancelamento e estorno são atômicos e idempotentes.
- O perfil esperado acompanha cada alteração. Se outra aba trocar a conta ativa, uma requisição antiga é recusada em vez de agir pela conta errada.
- Dados privados ficam fora de cache HTTP; o cliente usa chaves de consulta por conta e limpa os dados privados ao trocar de perfil.
- As dependências indiretas `deepmerge-ts` e `mysql2` têm versões corrigidas fixadas em `overrides`, mantendo o Prisma 7.10.0. Validação, geração, migrations e testes foram executados com essas versões.
- O resumo legado em `/pedidos/resumo` foi adicionado, a consulta individual voltou a incluir os itens e o histórico tem a rota própria `/pedidos/:pedido_id/historico`.

## Limites desta entrega

A primeira versão usa um preço e estoque por anúncio, uma loja por conta vendedora e os 100 pedidos/compras mais recentes nas telas privadas. Variações de cor/tamanho, devoluções após envio, pagamentos reais, cálculo por transportadora, recuperação de senha por email e múltiplos funcionários por loja ficam para evoluções futuras. O frete é uma constante demonstrativa, não uma cotação de entrega.

O armazenamento de imagens é local e o limitador de tentativas usa memória do processo. Uma publicação com múltiplas instâncias exige adaptar esses dois pontos, além de definir operação, backups e monitoramento. Nenhum deploy público foi realizado.

As fotos são ilustrativas e os nomes comerciais dos anúncios são fictícios. Consulte [créditos das imagens](docs/CREDITOS.md), [arquitetura](docs/ARQUITETURA.md) e [plano de estudo](docs/PLANO-DE-ESTUDO.md).
