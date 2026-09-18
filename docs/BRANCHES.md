# Branches da entrega Órbita

O trabalho foi separado em quatro branches por assunto. Elas são encadeadas: cada uma parte da anterior e acrescenta seu próprio commit. Isso preserva as dependências entre banco, API, interface e testes.

A branch **`feat/marketplace-orbita`** reúne a entrega completa e é o ponto indicado para abrir o site e continuar o desenvolvimento.

| Ordem | Branch                       | Commit da entrega  | O que foi acrescentado                                                                                                                                                                                                                                |
| ----- | ---------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `feat/marketplace-backend`   | `f01bc5e`          | Banco e migration, contas e sessões com vários perfis, catálogo, lojas, carrinho, checkout por vendedor, estoque, cancelamento/estorno, upload e testes de integração da API. Inclui compatibilidade com a API anterior e correções nas dependências. |
| 2     | `feat/marketplace-frontend`  | `0919a60`          | Interface React com identidade Órbita, catálogo e filtros, produto, autenticação, troca de perfis, carrinho, checkout, compras e painel do vendedor. Inclui imagens/fontes locais, acessibilidade e layouts para desktop e celular.                   |
| 3     | `test/marketplace-validacao` | `912d420`          | Playwright, axe, bancos isolados para testes de navegador, GitHub Actions, Prettier e comandos de desenvolvimento/build/testes na raiz.                                                                                                               |
| 4     | `docs/marketplace-estudo`    | Ponta desta branch | README, uso das contas demonstrativas, arquitetura, créditos, registro de validação, plano de estudo e este mapa de branches.                                                                                                                         |

```mermaid
flowchart TD
  A[95743bc: histórico de status existente] --> B[feat/marketplace-backend]
  B --> C[feat/marketplace-frontend]
  C --> D[test/marketplace-validacao]
  D --> E[docs/marketplace-estudo]
  E --- F[feat/marketplace-orbita: entrega completa]
```

## Consultar o que mudou

```powershell
git log --oneline --decorate -5 feat/marketplace-orbita
git show --stat feat/marketplace-backend
git show --stat feat/marketplace-frontend
git show --stat test/marketplace-validacao
git show --stat docs/marketplace-estudo
```

Cada mensagem de commit inclui uma descrição mais detalhada do respectivo bloco. As descrições das branches também foram registradas na configuração local do Git; este documento permite consultá-las junto com o projeto.

Para usar a versão completa:

```powershell
git switch feat/marketplace-orbita
npm run dev
```

## Organização posterior

Depois da entrega inicial, foram criadas branches locais encadeadas para manter cada alteração em um commit próprio:

| Branch | Conteúdo |
| --- | --- |
| `feat/docker-compose` | Imagem da aplicação e Compose com PostgreSQL. |
| `chore/limpeza-projeto` | Remoção de guias de agentes duplicados e do script de download que já não era necessário. |
| `docs/resumo-projeto` | README mais curto, resumo das tecnologias e atualização deste mapa. |

`feat/marketplace-orbita` aponta para o conjunto completo, incluindo esses três commits. As branches anteriores conservam seus pontos originais. Os arquivos locais de skills que já estavam sem rastreamento não entraram nos commits. As novas branches são locais até que sejam publicadas explicitamente.
