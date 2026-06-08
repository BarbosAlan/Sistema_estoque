# Status de desenvolvimento

> Atualize este arquivo sempre que concluir ou iniciar uma funcionalidade.
> O Claude Code lê este arquivo para entender o que já existe antes de implementar algo.

---

## Legenda
- ✅ Concluído
- 🚧 Em andamento
- ⬜ Não iniciado

---

## Infraestrutura

> Trigger de criação automática de profile adicionado em 20260601000000_add_create_profile_trigger.sql



| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Estrutura de pastas               | ✅     |       |
| Configuração do monorepo (pnpm)   | ✅     | pnpm workspaces + Turborepo |
| Configuração Supabase local       | ✅     | supabase link + db push |
| Deploy Vercel configurado         | ✅     | vercel.com/barbosalans-projects/sistema-estoque-web |
| Variáveis de ambiente             | ✅     | .env.example criado, env.ts tipado |

## Backend / Banco de dados

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Migration: users/profiles         | ✅     | 20240101000000_initial_schema.sql |
| Migration: categories             | ✅     | 20240101000000_initial_schema.sql |
| Migration: products               | ✅     | 20240101000000_initial_schema.sql |
| Migration: movements              | ✅     | 20240101000000_initial_schema.sql |
| Migration: alerts                 | ✅     | 20240101000000_initial_schema.sql |
| RLS policies                      | ✅     | 20240101000000_initial_schema.sql |
| Seed com dados iniciais           | ✅     | 8 categorias inseridas via REST API |
| Edge Function: check-low-stock    | ✅     | Vercel Cron Job — /api/cron/check-low-stock, roda diariamente às 8h UTC |

## Web — Autenticação

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Tela de login                     | ✅     | LoginForm + página /login |
| Recuperação de senha              | ✅     | RecuperarSenhaForm + página /recuperar-senha |
| Middleware de proteção de rotas   | ✅     | src/middleware.ts + auth-middleware.ts |

## Web — Produtos

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Listagem de produtos              | ✅     | ProdutosTable com filtros de busca, categoria e status |
| Cadastro de produto               | ✅     | ProdutoFormModal via Dialog |
| Edição de produto                 | ✅     | Mesmo modal, pré-preenchido |
| Inativar produto                  | ✅     | DELETE /api/products/[id] define status='inativo' |

## Web — Movimentações

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Registrar entrada                 | ✅     | MovimentacaoFormModal com tipo pré-selecionado |
| Registrar saída                   | ✅     | Valida estoque suficiente antes de registrar |
| Histórico com filtros             | ✅     | Filtros por tipo, produto, data inicial/final |

## Web — Usuários

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Listar usuários                   | ✅     | GET /api/users, junta profiles + auth.users para e-mail |
| Criar usuário                     | ✅     | POST /api/users, cria auth + profile atomicamente |
| Editar usuário (nome/perfil)      | ✅     | PATCH /api/users/[id] |
| Desativar / Reativar              | ✅     | Não deleta, apenas ativo=false |

## Web — Dashboard e Relatórios

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Dashboard com métricas            | ✅     | Cards + últimas movs + produtos críticos com barra de estoque |
| Alertas de estoque baixo          | ✅     | Dinâmico: zerados + abaixo do mínimo, botão de entrada direto |
| Relatório de estoque atual        | ✅     | Tabela com filtros + cards de resumo |
| Exportação PDF                    | ✅     | jsPDF + autotable, cabeçalho vermelho, células críticas em vermelho |
| Exportação Excel                  | ✅     | SheetJS, coluna extra "Situação estoque" |

## Mobile

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Autenticação                      | ✅     | Login com e-mail ou username |
| Tela inicial (resumo)             | ✅     | Cards de stats + últimas movimentações |
| Consulta de produtos              | ✅     | Lista com busca em tempo real e indicador de estoque |
| Registrar saída                   | ✅     | Busca produto, valida estoque, chama registrar_movimento RPC |
| Alertas push                      | ✅     | Expo push tokens salvos no Supabase; cron dispara notificação para admin/estoquista ao criar novo alerta |
| Build de produção (EAS)           | ✅     | eas.json criado com perfis dev/preview/production; rodar `eas init` para vincular projectId |

## Qualidade

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Testes automatizados              | ✅     | Vitest — 19 testes shared (validators), 12 web (alertas + Sidebar); `pnpm test` ou `turbo test` |

## Evoluções

| Item                              | Status | Notas |
|-----------------------------------|--------|-------|
| Tela de alertas no mobile         | ✅     | Aba "Alertas" — produtos zerados e com estoque baixo, pull-to-refresh |
| Edição de perfil (web)            | ✅     | Página /perfil — altera nome e senha; link no menu do header |
| Paginação nas tabelas             | ✅     | Produtos e Movimentações — 20 por página, server-side; busca de produto em movimentações migrada para servidor |
| Testes de componentes React       | ✅     | @testing-library/react + jsdom; 7 testes no SidebarContent (permissões por perfil) |
| Dashboard redesenhado             | ✅     | KPI cards, gráfico 3 linhas (Recharts), tabela de produtos críticos, ações rápidas 2×2 |
| Páginas da sidebar                | ✅     | Categorias, Entradas, Saídas, Transferências, Fornecedores, Configurações |
| Migration valor_unitario          | ✅     | 20260608000000_add_valor_unitario.sql — campo no form de produto e KPI "Valor de Estoque" |
| Migration fornecedores            | ✅     | 20260608120000_add_fornecedores.sql — tabela com RLS |
| Toast notifications               | ✅     | Sonner — sucesso/erro em produtos, categorias, fornecedores e movimentações |
