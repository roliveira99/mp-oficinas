# Pesquisa Aqui

Plataforma web para conectar clientes a oficinas mecânicas (carros, motos ou mistas), com conteúdo do setor automotivo e dashboards gerenciais com controle de acesso por perfil.

## Stack

- Next.js 16 (App Router)
- React 19 · TypeScript · Tailwind CSS 4
- **PostgreSQL** + **Prisma ORM**
- Autenticação com sessão HTTP-only (cookie)

## Banco de dados (PostgreSQL)

### Opção A — Docker (recomendado)

```bash
cp .env.example .env
npm run db:setup
```

Isso sobe o Postgres, cria as tabelas e popula dados demo.

### Opção B — Postgres externo (Neon, Supabase, etc.)

1. Copie `.env.example` → `.env`
2. Ajuste `DATABASE_URL` com sua connection string
3. Rode:

```bash
npm run db:push
npm run db:seed
```

### Sem banco

O site continua funcionando com **dados estáticos de fallback** (login demo em memória, oficinas do seed local). Para persistência real (avaliações, agenda, patrocínios, login), configure o PostgreSQL.

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login em `/login`.

## Perfis de acesso

### 👑 Administrador Master
| Campo  | Valor                      |
|--------|----------------------------|
| E-mail | `admin@pesquisaaqui.com`   |
| Senha  | `admin123`                 |

### 🏢 Dono da Oficina
| Campo  | Valor                     |
|--------|---------------------------|
| E-mail | `dono@pesquisaaqui.com`   |
| Senha  | `dono123`                 |

### 🖥️ Gerência
| Campo  | Valor                          |
|--------|--------------------------------|
| E-mail | `gerencia@pesquisaaqui.com`    |
| Senha  | `gerencia123`                  |

### 🔧 Mecânico
| Campo  | Valor                          |
|--------|--------------------------------|
| E-mail | `mecanico@pesquisaaqui.com`    |
| Senha  | `mecanico123`                  |

## Migração de marca (produção)

Se o banco ainda tiver contas `@mpoficinas.com`:

```bash
npm run db:migrate-brand
```

## API (principais rotas)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login (cookie de sessão) |
| POST | `/api/auth/logout` | Encerrar sessão |
| GET | `/api/auth/me` | Usuário logado |
| GET | `/api/workshops` | Listagem de oficinas |
| GET/POST | `/api/workshops/[slug]/reviews` | Avaliações |
| POST | `/api/agenda` | Solicitar / aprovar agenda |
| GET/POST | `/api/platform` | Anúncios e patrocínios |

## Scripts úteis

```bash
npm run db:push          # Cria/atualiza tabelas
npm run db:seed          # Popula dados demo
npm run db:setup         # Docker + push + seed
npm run db:migrate-brand # Atualiza e-mails legados no banco
npm run build            # Build de produção
```

## Próximas migrações (localStorage → Postgres)

- CRM (clientes, veículos, OS)
- Catálogo editável no dashboard
- Fornecedores do mecânico
- Notas fiscais / orçamentos
