# Verificação da entrega

Validação local realizada em 17/09/2026, na branch `feat/marketplace-orbita`.

## Verificações concluídas

| Verificação                             | Resultado                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Schema Prisma                           | Válido                                                                                                         |
| Geração do Prisma Client                | Concluída, mantendo a versão 7.10.0                                                                            |
| Migrations em banco vazio               | Sequência completa aplicada nos bancos isolados de teste                                                       |
| Checagem TypeScript do backend          | Sem erros                                                                                                      |
| Checagem TypeScript e build do frontend | Concluídos                                                                                                     |
| Integração da API                       | 5 cenários passaram                                                                                            |
| Navegador Chromium                      | 3 fluxos passaram                                                                                              |
| Acessibilidade automatizada             | Sem violações nas verificações axe executadas na página inicial desktop/celular, carrinho e painel do vendedor |
| Formatação                              | Arquivos incluídos no comando `format:check` aprovados                                                         |
| Auditoria npm                           | Zero vulnerabilidades conhecidas reportadas após correção das dependências indiretas                           |
| Ambiente local                          | Site, health check e catálogo responderam HTTP 200; catálogo com 12 produtos                                   |

## Regras exercitadas pelos testes da API

- Conectar e alternar contas previamente autenticadas, persistência do cookie e remoção de perfis.
- Bloquear origem estranha, perfil esperado diferente e operações incompatíveis com o papel.
- Dividir compra entre vendedores, cobrar frete por loja e preservar totais em centavos.
- Repetir checkout com a mesma chave sem duplicar compra ou baixa de estoque.
- Restringir consultas e alterações ao comprador e vendedor responsáveis.
- Cancelar uma vez ou repetir cancelamento sem devolver estoque duas vezes.
- Registrar um único estorno e manter os pedidos de outros vendedores ativos.
- Impedir saltos de status e cancelamento após envio.
- Disputar a última unidade com dois compradores e aprovar somente uma compra.
- Recusar edição antiga que sobrescreveria estoque alterado por uma venda.
- Recusar cotação com preço antigo e desfazer toda a compra quando um dos produtos fica indisponível.
- Confirmar senha atual antes da mudança e revogar o acesso da conta em outro navegador.

## Fluxos exercitados no navegador

1. Explorar catálogo, buscar, filtrar por categoria/preço, ordenar, usar navegação móvel e verificar acessibilidade.
2. Cadastrar comprador, adicionar produtos de duas lojas, concluir compra, cancelar uma parte, conectar vendedor, avançar o outro pedido até entregue, recarregar e trocar de volta para o comprador.
3. Conectar vendedor, enviar foto real pelo formulário, publicar produto, editar estoque, pausar o anúncio e confirmar sua ausência na busca pública.

Capturas locais estão em `artifacts/`. O relatório completo é gerado em `playwright-report/` a cada execução. Os testes automatizados não constituem certificação de acessibilidade, teste de carga ou auditoria completa de segurança. O workflow remoto foi preparado, mas não foi executado no GitHub nesta entrega.
