# SIGTEC Consulado — Sistema Integrado de Gestão Tecnológica e Manutenção

**Consulado Geral de Angola no Porto**

Plataforma interna de gestão de activos tecnológicos, help desk com SLA, manutenção preventiva,
obsolescência & abate (com Auto de Abate em PDF gerado no servidor) e transparência (Data Tracker),
segundo os princípios da governação digital estónia: Once-Only, transparência por omissão e serviços proactivos.

## Arquitectura

| Camada | Tecnologia | Alojamento sugerido |
|---|---|---|
| Backend (API REST) | NestJS 10 + Prisma ORM | Railway / Render |
| Base de dados | PostgreSQL | Neon (serverless) |
| Frontend | Next.js 14 (App Router) + Tailwind | Vercel |
| Autenticação | JWT (Bearer) · bcrypt · perfis ADMIN / TECNICO / FUNCIONARIO / DIRECCAO | — |
| PDF | pdfkit (server-side) — Auto de Abate oficial | — |

```
sigtec/
├── backend/    API NestJS + Prisma (porta 3001, prefixo /api)
└── frontend/   Aplicação Next.js (porta 3000)
```

## 1. Base de dados (Neon)

1. Criar projecto em https://neon.tech (região Europa).
2. Copiar as duas connection strings: **pooled** (com `-pooler`) e **directa**.

## 2. Backend

```bash
cd backend
cp .env.example .env        # preencher DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npx prisma migrate dev --name init   # cria as tabelas
npx prisma db seed                   # dados de demonstração
npm run start:dev                    # http://localhost:3001/api
```

### Contas criadas pelo seed (password: `sigtec2026`)

| Perfil | Email |
|---|---|
| Administrador | c.miranda@consuladoporto.gov.ao |
| Técnico | r.sousa@consuladoporto.gov.ao |
| Funcionária | l.baptista@consuladoporto.gov.ao |
| Direcção | direccao@consuladoporto.gov.ao |

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                  # http://localhost:3000
```

## 4. Demonstração de ponta a ponta (argumento e-Estónia)

1. Entrar como **Rui Sousa** (Técnico) → Obsolescência & Abate → «Iniciar processo» no candidato.
2. Entrar como **Carlos Miranda** (Admin) → «Submeter à Direcção».
3. Entrar como **Dra. Ana Van-Dúnem** (Direcção) → «Aprovar e emitir Auto de Abate».
4. Abrir o **PDF do Auto** (gerado no servidor, numerado AB-2026-XXX) — zero papel, tudo auditado.
5. Entrar como **Luísa Baptista** (Funcionária) → Transparência → ver no **Data Tracker** quem acedeu aos seus dados.

## 5. Deploy em produção

**Backend (Railway ou Render):**
- Root directory: `backend` · Build: `npm install && npx prisma generate && npm run build`
- Start: `npx prisma migrate deploy && node dist/main`
- Variáveis: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL` (URL da Vercel), `PORT`

**Frontend (Vercel):**
- Root directory: `frontend`
- Variável: `NEXT_PUBLIC_API_URL` = `https://<api>.railway.app/api`

## Endpoints principais

```
POST  /api/auth/login                      { email, password }
GET   /api/auth/me
GET   /api/dashboard                       KPIs + serviços proactivos
GET   /api/pedidos      POST /api/pedidos  Help desk (SLA: Crítica 4h · Alta 8h · Média 24h · Baixa 72h)
PATCH /api/pedidos/:id/estado              (Admin/Técnico; nota interna opcional)
GET   /api/activos                         inventário + análise de obsolescência
GET   /api/activos/candidatos-abate        2+ critérios cumpridos
POST  /api/abate/propostas                 parecer técnico → proposta
PATCH /api/abate/propostas/:id/submeter    Admin → Direcção
PATCH /api/abate/propostas/:id/aprovar     Direcção → emite Auto + activos ABATIDOS
GET   /api/abate/autos/:id/pdf             PDF oficial do Auto de Abate (server-side)
GET   /api/manutencao                      ordens preventivas
GET   /api/auditoria                       Data Tracker (funcionário vê só os seus dados)
```

## Notas de implementação

- **Registo imutável**: `LogAuditoria` só tem inserções — nenhum endpoint de edição/apagamento.
- **Once-Only**: requerente, localização e SLA derivados pelo sistema; o funcionário nunca repete dados.
- **Abate**: os activos abatidos ficam com estado `ABATIDO` mas permanecem na base para auditoria patrimonial.
- **Ciclos de vida** (anos): Computador 5 · Impressora 6 · Servidor 6 · Leitor biométrico 5 · UPS 4 · Switch/Router 8 · Scanner 6 · Telefone IP 7.
- Ortografia institucional pré-acordo em toda a interface («activos», «direcção», «actualizar»).
