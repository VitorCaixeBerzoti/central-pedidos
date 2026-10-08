# Órbita — marketplace

Marketplace com catálogo, contas de comprador e vendedor, carrinho, pedidos e painel de vendas. Pagamento e entrega são simulados.

## Iniciar

Com o ambiente já preparado e o PostgreSQL ligado, abra o PowerShell na pasta do projeto e execute:

```powershell
npm.cmd run dev
```

Abra <http://localhost:5173>. O comando inicia a interface com atualização automática e a API na porta 3000. Mantenha o terminal aberto; `Ctrl+C` encerra os dois processos. As portas 3000 e 5173 precisam estar livres.

No Prompt de Comando (CMD), também pode usar `npm run dev`. No PowerShell, `npm.cmd run dev` evita o bloqueio de scripts do Windows, sem mudar configurações de segurança.

Para executar a versão compilada em <http://localhost:3000>, pare o modo de desenvolvimento e execute:

```powershell
npm.cmd run build
npm.cmd start
```

## Primeira instalação

Instale Node.js 24 e PostgreSQL 15 ou superior e crie um banco PostgreSQL local. Na pasta do projeto, copie o exemplo de configuração somente se `backend/.env` ainda não existir:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Configure `DATABASE_URL` em `backend/.env` com o usuário, senha e nome do banco local e substitua `JWT_SECRET` por um segredo aleatório de pelo menos 32 caracteres. Depois execute:

```powershell
npm.cmd run setup
npm.cmd run dev
```

O `setup` instala as dependências da raiz, do backend e do frontend, gera o Prisma Client, aplica as migrations, prepara os dados de demonstração e compila o sistema. Os dados de demonstração não sobrescrevem senhas, estoque ou anúncios já existentes.

Se estiver reaproveitando um banco histórico com `Pedido.empresaId` nulo, vincule esses pedidos à empresa correta antes de executar o `setup`. Bancos novos não precisam desse ajuste.

## Contas de demonstração

Senha inicial para todas: **`OrbitaDemo2026!`**. Também é possível cadastrar contas pela interface.

| Email | Perfil | Loja |
| --- | --- | --- |
| explorador@orbita.demo | Comprador | — |
| nova@orbita.demo | Vendedor | Nova Studio |
| forma@orbita.demo | Vendedor | Forma & Casa |
| movimento@orbita.demo | Vendedor | Movimento |

## Docker Compose

Com o Docker em execução, use esta opção para preparar e iniciar o sistema com seu próprio banco:

```powershell
docker compose up --build -d
```

Abra <http://localhost:3000>. Para acompanhar os logs, execute `docker compose logs -f app`; para parar, `docker compose down`. O banco e as fotos enviadas permanecem nos volumes Docker.

[Créditos das imagens, fontes e ícones](CREDITOS.md).
