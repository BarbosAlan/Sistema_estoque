# CLAUDE.md — Guia do Projeto para Claude Code

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Ele contém tudo que você precisa saber para trabalhar neste projeto sem se perder.

---

## O que é este projeto

Sistema interno de controle de estoque para uma empresa.
Controla entrada, saída e disponibilidade de materiais (escritório, limpeza, copa, utensílios).

**Monorepo** com três workspaces:
- `web/` — Next.js 14 (App Router), deploy na Vercel
- `mobile/` — Expo (React Native), distribuído internamente
- `packages/shared/` — tipos, validadores e constantes compartilhados entre web e mobile

**Backend:** Vercel Functions (em `web/src/app/api/`) + Supabase Edge Functions
**Banco:** Supabase (PostgreSQL gerenciado)
**Auth:** Supabase Auth com JWT + Row Level Security

---

## Regras absolutas — nunca quebre estas

1. **Nunca escreva lógica de negócio em componentes React.** Lógica vai em `services/` ou hooks em `hooks/`.
2. **Nunca acesse o Supabase diretamente de um componente.** Use sempre os services em `src/services/`.
3. **Nunca hardcode valores de ambiente.** Use sempre variáveis de `.env.local` via `src/lib/env.ts`.
4. **Nunca crie um tipo inline se ele já existe em `packages/shared/types/`.** Importe de lá.
5. **Todo endpoint de API deve validar o perfil do usuário** usando o middleware em `web/src/lib/auth-middleware.ts`.
6. **Migrações SQL são imutáveis.** Nunca edite um arquivo de migration já criado — crie uma nova.
7. **Histórico de movimentações nunca é deletado.** Correções são feitas com movimentações de ajuste.

---

## Perfis de usuário e permissões

| Perfil       | Pode fazer                                                      |
|--------------|-----------------------------------------------------------------|
| `admin`      | Tudo. Cadastro de usuários, relatórios, exclusões               |
| `estoquista` | Entradas, saídas, cadastro de produtos, visualizar alertas      |
| `funcionario`| Registrar saída para si mesmo, consultar estoque                |

O perfil está em `user.user_metadata.perfil` após o login.
O middleware de autenticação fica em `web/src/lib/auth-middleware.ts`.

---

## Onde cada coisa vai

```
web/src/
├── app/
│   ├── (auth)/          → Telas de login e recuperação de senha (sem layout de dashboard)
│   ├── (dashboard)/     → Todas as telas autenticadas (com sidebar e header)
│   └── api/             → Vercel Functions (endpoints REST)
│
├── components/
│   ├── ui/              → Componentes genéricos: Button, Input, Badge, Modal...
│   ├── layout/          → Sidebar, Header, PageWrapper
│   ├── forms/           → Formulários específicos: ProdutoForm, MovimentacaoForm...
│   ├── tables/          → Tabelas com filtros: ProdutosTable, MovimentacoesTable...
│   ├── charts/          → Gráficos do dashboard: ConsumoChart, EstoqueChart...
│   └── modals/          → Modais específicos: ConfirmarSaidaModal, AlertaModal...
│
├── hooks/               → useProducts, useMovements, useAlerts, useAuth...
├── services/            → productsService.ts, movementsService.ts, reportsService.ts...
├── store/               → Estado global com Zustand (alertas, usuário logado)
├── types/               → Re-exports de packages/shared/types + tipos exclusivos do web
├── utils/               → formatDate, formatQuantity, calcularStatus...
└── lib/
    ├── supabase.ts          → Cliente Supabase (browser)
    ├── supabase-server.ts   → Cliente Supabase (server components / API routes)
    ├── auth-middleware.ts   → Valida JWT e perfil em API routes
    └── env.ts               → Variáveis de ambiente tipadas e validadas
```

---

## Fluxo de dados padrão

```
Componente → hook (useXxx) → service (xxxService) → Supabase client → banco
```

Nunca pule etapas. Um componente nunca chama o Supabase diretamente.

---

## Convenções de nomenclatura

- **Arquivos de componente:** PascalCase → `ProdutoForm.tsx`
- **Arquivos de hook:** camelCase com prefixo `use` → `useProducts.ts`
- **Arquivos de service:** camelCase com sufixo `Service` → `productsService.ts`
- **Arquivos de tipo:** camelCase com sufixo `.types.ts` → `product.types.ts`
- **Rotas de API:** kebab-case → `app/api/movements/exit/route.ts`
- **Migrations SQL:** `YYYYMMDDHHMMSS_descricao_da_migration.sql`

---

## Variáveis de ambiente necessárias

Veja `.env.example` na raiz. As principais:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # apenas no servidor, nunca exposta ao browser
```

---

## Comandos úteis

```bash
# Rodar web em dev
cd web && pnpm dev

# Rodar mobile
cd mobile && pnpm start

# Aplicar migrations no Supabase local
supabase db push

# Gerar tipos TypeScript a partir do schema do Supabase
supabase gen types typescript --local > packages/shared/types/supabase.ts

# Rodar tudo com turbo
pnpm dev
```

---

## Arquivos de referência importantes

Antes de implementar qualquer funcionalidade nova, leia:

- `docs/decisions/` — decisões de arquitetura já tomadas
- `docs/api/` — contratos dos endpoints
- `docs/flows/` — fluxos de negócio (entrada, saída, alertas)
- `supabase/migrations/` — schema atual do banco
- `packages/shared/types/` — tipos compartilhados

---

## Estado atual do projeto

Acompanhe o que já foi implementado em `docs/STATUS.md`.
Sempre atualize esse arquivo ao concluir uma funcionalidade.
