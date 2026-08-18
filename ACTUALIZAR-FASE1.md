# SIGTEC — Actualização Fase 1

Esta versão acrescenta gestão de contas, notificações, registo/edição de activos com etiquetas QR,
Once-Only completo para o funcionário e rejeição fundamentada de propostas de abate.

## Como aplicar (substitui o código anterior)

**Passo 1.** Faça uma cópia de segurança da pasta actual do projecto (ex.: renomeie para `sigtec-antigo`).

**Passo 2.** Descompacte este pacote para `C:\Projectos\sigtec`.

**Passo 3.** Reponha os seus ficheiros de configuração (que não vêm no pacote, por segurança):
- `backend\.env` — copie o do projecto antigo
- `frontend\.env.local` e `frontend\.env.production` — copie os do projecto antigo

**Passo 4.** Instale as dependências novas e crie a migração da base de dados:

```bash
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fase1
```

✔ Deve ver `Your database is now in sync with your schema`.
*(Esta migração acrescenta 3 campos: `User.precisaTrocarPassword`, `PropostaAbate.motivoRejeicao`, `Notificacao.link`.)*

**Passo 5.** Frontend:

```bash
cd C:\Projectos\sigtec\frontend
npm install
```

**Passo 6.** Teste localmente (`npm run start:dev` no backend, `npm run dev` no frontend).

**Passo 7.** Publique:

```bash
cd C:\Projectos\sigtec
git add .
git commit -m "Fase 1: contas, notificacoes, activos, once-only, rejeicao de abate"
git push
```

**Passo 8.** No Railway, o Start Command já corre `npx prisma migrate deploy` — a migração é aplicada
automaticamente à base de produção no arranque. Confirme nos logs: `1 migration applied`.

---

## O que há de novo

### 1. Gestão de utilizadores (`/utilizadores` — Administrador)
- Criação de contas por convite, com **palavra-passe temporária gerada** e mostrada uma única vez
- Desactivar e reactivar contas (nunca eliminar — o histórico é preservado)
- Repor palavra-passe esquecida
- Botão para copiar as credenciais e entregar ao utilizador

### 2. Palavras-passe (`/conta` — todos os perfis)
- Alteração da própria palavra-passe
- **Bloqueio de primeiro acesso**: quem tem palavra-passe temporária é obrigado a defini-la antes de usar o sistema

### 3. Notificações reais (sino no topo)
- Contador de não lidas, marcação individual e «marcar todas como lidas», actualização automática a cada minuto
- Geradas automaticamente em: novo pedido (para técnicos e Admin), mudança de estado (para o requerente),
  proposta de abate a aguardar aprovação (para a Direcção), abate aprovado ou rejeitado (para a equipa técnica),
  criação de conta e reposição de palavra-passe

### 4. Inventário de activos
- **Registar activo** com numeração automática CGA-INF-XXXX (ou manual)
- **Editar** qualquer campo; movimentações e mudanças de estado entram sozinhas no histórico técnico
- **Etiquetas QR imprimíveis** — respeitam os filtros aplicados; papel autocolante

### 5. Once-Only completo
- O funcionário passa a ver, no formulário de pedido, apenas os equipamentos que lhe estão atribuídos
  (novo endpoint `GET /api/activos/meus`)

### 6. Abate — rejeição fundamentada
- A Direcção pode **rejeitar com fundamentação** (mín. 10 caracteres), além de aprovar
- O motivo fica visível no processo e é comunicado por notificação; os equipamentos mantêm-se em inventário

## Endpoints novos

```
GET   /api/notificacoes                     lista do próprio
GET   /api/notificacoes/por-ler             contador
PATCH /api/notificacoes/:id/lida
PATCH /api/notificacoes/ler-todas
PATCH /api/users/password                   alterar a própria palavra-passe
PATCH /api/users/:id/reactivar              (Admin)
PATCH /api/users/:id/repor-password         (Admin) devolve password temporária
GET   /api/activos/meus                     Once-Only: equipamentos do próprio
PATCH /api/activos/:id                      editar activo (Admin/Técnico)
PATCH /api/abate/propostas/:id/rejeitar     (Direcção) com { motivo }
```

## Nota sobre as contas de demonstração

As contas do seed continuam com a password `sigtec2026` e **sem** obrigação de troca, para não quebrar
as demonstrações. Contas criadas pela interface nascem sempre com palavra-passe temporária obrigatória.

Antes de entrar em uso real, recomenda-se: criar a conta nominal do Administrador pela interface,
e depois desactivar as contas de demonstração.
