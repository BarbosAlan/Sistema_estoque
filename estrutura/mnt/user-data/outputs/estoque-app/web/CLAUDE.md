# CLAUDE.md — Web App (Next.js)

> Leia também o CLAUDE.md na raiz do projeto antes de qualquer coisa.

## Estrutura de rotas

O App Router do Next.js usa grupos de rota com parênteses para separar layouts:

- `(auth)/` — páginas sem autenticação, sem sidebar. Layout: só centraliza o conteúdo.
- `(dashboard)/` — páginas autenticadas. Layout: sidebar + header + verificação de sessão.

Nunca crie uma página autenticada fora do grupo `(dashboard)/`.

## Como criar um novo endpoint de API

1. Crie o arquivo em `src/app/api/[recurso]/route.ts`
2. Importe e use `withAuth(handler, ['perfil_minimo'])` de `src/lib/auth-middleware.ts`
3. Valide o body com Zod usando os schemas de `packages/shared/validators/`
4. Retorne sempre no formato `{ data, error }` — nunca retorne dados diretamente

Exemplo:
```ts
// src/app/api/products/route.ts
import { withAuth } from '@/lib/auth-middleware'
import { createProductSchema } from '@shared/validators/product.validators'

export const POST = withAuth(async (req, { user }) => {
  const body = createProductSchema.parse(await req.json())
  // ...
}, ['estoquista', 'admin'])
```

## Como criar uma nova página

1. Crie a pasta em `src/app/(dashboard)/[rota]/`
2. Crie `page.tsx` (Server Component por padrão — use `'use client'` só quando necessário)
3. Crie `loading.tsx` para o skeleton de carregamento
4. Se tiver formulário ou interação, extraia para um Client Component em `components/`

## Gerenciamento de estado

- **Dados do servidor:** React Query (`@tanstack/react-query`) via hooks em `src/hooks/`
- **Estado global de UI:** Zustand em `src/store/` (apenas alertas ativos e usuário logado)
- **Estado de formulário:** React Hook Form + Zod

Não use `useState` para dados que vêm da API. Use React Query.

## Componentes UI

Usamos **shadcn/ui** como base. Antes de criar um componente novo em `components/ui/`,
verifique se já existe via `npx shadcn@latest add [componente]`.

Componentes customizados ficam em:
- `components/forms/` — formulários completos (ex: `ProdutoForm.tsx`)
- `components/tables/` — tabelas com filtros (ex: `ProdutosTable.tsx`)
- `components/modals/` — modais de confirmação e detalhes

## Imports

Use sempre o alias `@/` para imports internos do web:
```ts
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@shared/types/product.types'  // pacote compartilhado
```

O alias `@shared/` aponta para `packages/shared/`.
