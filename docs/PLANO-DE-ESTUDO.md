# Estude construindo sobre a Órbita

O site foi implementado primeiro, como você pediu. Este roteiro usa as funcionalidades prontas para estudar interface e backend juntos. Avance quando conseguir explicar e modificar o assunto; não há um prazo obrigatório.

Para cada etapa, siga este ciclo: use a funcionalidade no site, localize o código, explique o caminho dos dados em voz alta, faça o exercício e confira o resultado. Anote o que você precisou consultar. Essas anotações mostram onde vale aprofundar.

## Antes de começar: conheça o produto

Leia o [README](../README.md) e abra o projeto com `npm run dev`. Use a conta compradora e uma conta vendedora. Compre de duas lojas, cancele um dos pedidos e acompanhe o outro até a entrega. Publique um anúncio com uma foto e altere o estoque.

**Sua primeira entrega:** descreva, com suas palavras, a diferença entre uma conta, uma loja, um produto, um carrinho, uma compra e um pedido. Depois compare com [a arquitetura](ARQUITETURA.md).

## 1. Leia a interface como uma árvore

**Objetivo:** entender como uma URL vira uma página composta por partes reutilizáveis.

Leia nesta ordem:

1. [Entrada da aplicação](../frontend/src/main.tsx): providers, rotas e carregamento sob demanda.
2. [Layout](../frontend/src/components/Layout.tsx): cabeçalho, navegação, rodapé e página atual.
3. [Página inicial](../frontend/src/pages/Home.tsx): seções e lista de produtos.
4. [Componentes básicos](../frontend/src/components/ui.tsx): `ProductCard`, botão, modal, estado vazio e carregamento.

Conceitos para estudar: função, import/export, JSX, propriedades de componentes, renderização de listas, `key`, renderização condicional e composição.

**Exercício:** acrescente um selo “Últimas unidades” ao cartão quando o estoque estiver entre 1 e 3. Explique por que estoque zero precisa de tratamento diferente. Faça uma captura da alteração em desktop e celular.

**Você entendeu quando:** consegue seguir de `main.tsx` até `ProductCard` e explicar de onde vem cada informação exibida.

Use o [guia introdutório do React](https://react.dev/learn) para consultar componentes, propriedades e estado.

## 2. Aprenda o CSS que dá identidade ao projeto

**Objetivo:** alterar a aparência mantendo legibilidade e navegação em diferentes tamanhos.

Leia [styles.css](../frontend/src/styles.css). Comece por `:root`, `.container`, `.hero-grid`, `.product-grid` e pelas media queries no final. Depois observe `:focus-visible`, `.skip-link` e `prefers-reduced-motion`.

Conceitos: box model, variáveis CSS, Grid, Flexbox, largura máxima, unidades relativas, posicionamento, estados de interação, contraste e foco.

**Exercício:** crie uma segunda combinação de cores em uma branch de estudo. Preserve a leitura dos textos sobre fundos claros e escuros. Navegue usando Tab, Shift+Tab, Enter e Escape; abra e feche o seletor de perfis sem mouse.

**Você entendeu quando:** explica por que o catálogo usa quatro colunas em uma tela e duas em outra, e consegue encontrar o estilo responsável.

Para conferir os critérios de acessibilidade, consulte a [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Os testes automáticos ajudam, mas não substituem a avaliação da experiência com teclado e tecnologias assistivas.

## 3. Entenda TypeScript com os dados que você vê

**Objetivo:** reconhecer os contratos de dados e a diferença entre tipar e validar.

Leia [types.ts](../frontend/src/types.ts), [api.ts](../frontend/src/lib/api.ts) e [core.ts](../backend/src/marketplace/core.ts).

Conceitos: `interface`, união de valores, campos opcionais, `null`, generics, funções assíncronas, inferência e validação durante a execução.

**Exercício:** tente atribuir `"SEPARANDO"` a um valor do tipo `Status` e observe a checagem de tipos. Depois envie um status inválido à API por uma ferramenta de teste e observe o erro do Zod. Registre por que o backend precisa validar mesmo quando o frontend usa TypeScript.

**Você entendeu quando:** explica a diferença entre `api<Produto>()`, que informa um tipo ao compilador, e `produtoSchema.parse()`, que verifica dados recebidos durante a execução.

Referência: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).

## 4. Siga uma busca da tela ao banco

**Objetivo:** acompanhar uma requisição HTTP completa.

Leia [Explore.tsx](../frontend/src/pages/Explore.tsx), [api.ts](../frontend/src/lib/api.ts) e [catalog.routes.ts](../backend/src/marketplace/catalog.routes.ts).

Abra a aba Network das ferramentas do navegador. Busque “Headphone”, troque de categoria e altere a ordenação. Confira URL, parâmetros, status HTTP e resposta JSON.

Conceitos: método GET, query string, paginação, filtros, validação, consultas com Prisma e diferença entre erro de rede e resposta de erro.

**Exercício:** adicione um filtro “Somente produtos com estoque”, incluindo parâmetro da URL, checkbox, validação e filtro no banco. Confirme que voltar e avançar no navegador preserva a seleção.

**Você entendeu quando:** consegue desenhar o caminho de um clique até o SQL correspondente e explicar por que a URL guarda os filtros.

## 5. Diferencie estado da tela e dados do servidor

**Objetivo:** entender quando guardar uma informação em `useState` e quando consultá-la no servidor.

Leia [Product.tsx](../frontend/src/pages/Product.tsx), [session.tsx](../frontend/src/lib/session.tsx) e [Cart.tsx](../frontend/src/pages/Cart.tsx).

Conceitos: estado local, query, mutation, cache, chave de consulta, invalidação, estado pendente e mensagem de erro.

**Exercício:** acrescente uma mensagem na página de produto mostrando quantas unidades daquele produto já estão no carrinho da conta ativa. Troque de perfil e confira se a mensagem muda corretamente.

**Você entendeu quando:** explica por que a quantidade escolhida antes de adicionar é estado local, enquanto o carrinho pertence ao servidor; e por que uma consulta privada inclui o ID da conta.

Consulte a [visão geral do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) para organizar o estudo de consultas, cache e atualizações.

## 6. Leia o banco como um conjunto de relações

**Objetivo:** entender por que um marketplace precisa separar compra e pedido.

Leia [schema.prisma](../backend/prisma/schema.prisma) e a [migration do marketplace](../backend/prisma/migrations/20260917120808_marketplace_orbita/migration.sql). Compare com os diagramas da arquitetura.

Conceitos: chave primária, chave estrangeira, relação um-para-muitos, chave composta, índice, restrição única, snapshot e migration.

**Exercício:** desenhe o relacionamento entre `Conta`, `Empresa`, `Produto`, `CarrinhoItem`, `Compra`, `Pedido` e `ItemPedido`. Para uma compra com duas lojas, conte quantos registros são necessários em cada tabela.

**Você entendeu quando:** explica por que editar o preço de um anúncio não altera o preço de um item já comprado e por que o estoque pertence ao anúncio.

Em exercícios que mudarem o schema, crie uma migration nova. Preserve as migrations já aplicadas e use dados de demonstração para praticar.

## 7. Entenda login, sessão e troca de contas

**Objetivo:** explicar como o site lembra várias contas sem guardar as senhas no navegador.

Leia [session.ts do backend](../backend/src/marketplace/session.ts), [rotas de autenticação](../backend/src/marketplace/auth.routes.ts), [AuthModal.tsx](../frontend/src/components/AuthModal.tsx) e [session.tsx do frontend](../frontend/src/lib/session.tsx).

Conceitos: hash de senha, cookie `HttpOnly`, sessão persistente, expiração, autenticação, autorização, origem da requisição e revogação.

**Exercício de investigação:** conecte comprador e vendedor, troque entre eles e observe as chamadas `/api/sessao`. Abra duas abas e mude a conta ativa em uma. Explique como `X-Account-Id` evita que a outra aba execute uma alteração pela conta inesperada.

**Exercício de código:** adicione no menu uma identificação visual do papel de cada conta, sem exibir tokens ou informações internas da sessão.

**Você entendeu quando:** explica por que esconder o painel de vendedor na interface não é suficiente para proteger a API, e aponta onde o servidor verifica a loja responsável.

Use a [referência de sessões da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) para aprofundar cookies, expiração e encerramento de sessão.

## 8. Estude a parte mais importante do backend

**Objetivo:** entender como impedir estoque negativo, compras duplicadas e estornos repetidos.

Leia [orders.service.ts](../backend/src/marketplace/orders.service.ts), começando por `carregarCarrinho`, depois `finalizarCompra` e finalmente `mudarStatus`. Leia o helper `serializable` em [core.ts](../backend/src/marketplace/core.ts).

Conceitos: centavos inteiros, transação, isolamento serializável, concorrência, rollback, idempotência, atualização condicional e máquina de estados.

**Exercício no papel:** duas pessoas tentam comprar a última unidade. Escreva a sequência de operações que poderia dar errado sem transação e a sequência protegida pelo código atual.

**Exercício no projeto:** localize e execute o teste “duas compras concorrentes nunca vendem a mesma última unidade”. Explique cada asserção. Depois explique por que cancelar duas vezes devolve o estoque uma única vez.

**Você entendeu quando:** consegue justificar a ordem das operações e dizer o que acontece se o segundo vendedor ficar sem estoque no meio do checkout.

Consulte [isolamento de transações no PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html) para estudar o que cada nível garante e por que conflitos podem exigir uma nova tentativa.

## 9. Aprenda a verificar comportamento

**Objetivo:** usar testes para demonstrar regras reais do produto.

Leia [testes da API](../backend/tests/marketplace.test.ts) e [testes de navegador](../tests/marketplace.spec.ts). Observe a criação de bancos próprios para teste e a limpeza limitada a esses bancos.

Execute:

```powershell
npm test
npm run format:check
npm run build
```

**Exercício:** acrescente um teste de comportamento para o filtro de estoque criado na etapa 4. Crie um produto com estoque e outro sem, faça a busca e confirme o resultado. Se o exercício alterou somente textos ou espaçamentos, uma inspeção visual pode bastar.

**Você entendeu quando:** explica a diferença entre testar uma função, chamar a API com banco real e operar o site em um navegador, além do tipo de falha que cada abordagem encontra.

Referência: [boas práticas do Playwright](https://playwright.dev/docs/best-practices).

## 10. Faça uma evolução sua

Escolha uma única evolução depois de concluir as etapas anteriores:

| Evolução                | O que permite estudar               | Critério de conclusão                                                    |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Favoritos por comprador | Relações, API, cache e interação    | Cada conta vê somente seus favoritos, inclusive após trocar de perfil    |
| Paginação das compras   | Consultas, URL e navegação          | É possível consultar pedidos além dos 100 mais recentes                  |
| Estoque por variação    | Modelagem, migrations e formulários | Cor/tamanho têm estoque próprio e o checkout baixa a variação correta    |
| Histórico de preços     | Eventos e snapshots                 | O preço atual muda sem alterar compras antigas                           |
| Preparação de deploy    | Configuração, HTTPS e persistência  | Sessões e uploads sobrevivem a uma reinicialização no ambiente publicado |

Antes de programar, escreva o comportamento esperado, as tabelas e telas afetadas e um exemplo de erro que precisa ser tratado. Trabalhe em uma branch por assunto. Ao terminar, apresente a mudança e explique as escolhas sem depender de ler o código inteiro.

## Seu ponto de partida

Comece pela demonstração completa e pela etapa 1. Seu primeiro exercício é o selo de últimas unidades em `ProductCard`. É uma mudança pequena, visível e conectada aos dados reais do projeto. Depois siga o roteiro na ordem; sessão e transações fazem mais sentido quando você já consegue acompanhar as requisições.
