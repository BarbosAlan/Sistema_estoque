# Como testar o app mobile

## Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- App **Expo Go** instalado no celular (Android ou iOS)
- Celular e PC na **mesma rede Wi-Fi**

## Passo a passo

### 1. Clonar o repositório (se ainda não tiver)

```bash
git clone https://github.com/BarbosAlan/Sistema_estoque.git
cd Sistema_estoque
```

### 2. Criar o arquivo de variáveis de ambiente

Crie o arquivo `mobile/.env.local` com o conteúdo abaixo:

```
EXPO_PUBLIC_SUPABASE_URL=https://zetyugynbgqnohoananl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldHl1Z3luYmdxbm9ob2FuYW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQ4NzUsImV4cCI6MjA5NTU4MDg3NX0.XzyK2WoaGl62V7VyzFHkxRQs2aRkH6JYTqRH8cuJwFs
```

> O `.env.local` não é commitado no git por segurança — precisa criar manualmente.

### 3. Instalar dependências

```bash
pnpm install
```

### 4. Rodar o app

```bash
cd mobile
pnpm start
```

Vai abrir o Expo no terminal com um **QR Code**.

### 5. Abrir no celular

- **Android:** abra o app Expo Go e escaneie o QR Code
- **iOS:** abra a câmera do iPhone e escaneie o QR Code

## Credenciais de teste

| Campo  | Valor               |
|--------|---------------------|
| E-mail | `admin@estoque.com` |
| Senha  | `Admin@123`         |

## Telas disponíveis

| Aba              | O que faz                                              |
|------------------|--------------------------------------------------------|
| **Início**       | Cards com total de produtos, estoque baixo e zerados + últimas movimentações |
| **Produtos**     | Lista todos os produtos com busca por nome ou código e indicador de status (OK / Baixo / Zerado) |
| **Registrar Saída** | Busca um produto, informa a quantidade e registra a saída no sistema |
