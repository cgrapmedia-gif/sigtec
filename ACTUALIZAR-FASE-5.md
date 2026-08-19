# SIGTEC — Fase 5: Formulários completos e utilização em telemóvel/tablet

## Como aplicar

**Passo 1.** Copie o conteúdo de `sigtec` para `C:\Projectos\sigtec`, substituindo os ficheiros.

**Passo 2.** Backend:
```bash
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fase5
npx prisma db seed
```
*(Se a Fase 4 ainda não foi aplicada, esta migração cria também as tabelas dessa fase.)*

**Passo 3.** Frontend:
```bash
cd C:\Projectos\sigtec\frontend
npm install
```

**Passo 4.** Confirme a variável `NEXT_PUBLIC_MODO_DEMO` (`1` local, `0` ou ausente na Vercel).

**Passo 5.** `git add . && git commit -m "Fase 5: formularios completos e adaptacao movel" && git push`

---

## 1. Auditoria: tudo o que existia na base sem formulário

Percorri o modelo de dados à procura de tabelas e campos que só se conseguiam preencher por seed ou por
acesso directo à base. Resultado e correcção:

| O que faltava | Onde ficou |
|---|---|
| **Departamentos** — só existiam os 5 do seed | Página **Departamentos** com criar, renomear e eliminar (com protecção: não elimina se houver utilizadores ou itens associados) |
| **Responsável de um item** — o campo existia mas o formulário não o mostrava | Selector de responsável no formulário de item. É o que faz o equipamento aparecer nos pedidos desse funcionário (Once-Only) |
| **Relações entre itens** — a API existia desde a Fase 4, sem interface | Na ficha do item: «＋ Acrescentar dependência», com tipo de relação e marca de criticidade, e remoção com ✕ |
| **Histórico técnico** — só se alimentava automaticamente | Botão «＋ Registar intervenção» na ficha, com tipo (intervenção, avaria, movimentação, instalação) |
| **Edição de utilizadores** — só se criava e desactivava | Botão «Editar»: nome, perfil, departamento e posto de trabalho. Alterar o perfil notifica o utilizador |
| **Fornecedor e contrato de um item** | Selectores no formulário de item |
| **Criticidade (1-5)** | Selector com descrição de cada nível, de «sem impacto» a «serviço parado» |

Princípio adoptado: **se está na base de dados, tem de ter um botão.** Nada deve exigir acesso directo à base.

## 2. Utilização em telemóvel e tablet

Reconstruí a camada de apresentação para funcionar bem no terreno — que é onde o técnico está quando precisa
do sistema. Não é uma aplicação separada: é a mesma, adaptada.

**Tabelas que se transformam em cartões.** Abaixo de 700 px, cada linha da tabela passa a ser um cartão
legível, com o nome de cada campo por cima do valor. Sem deslizar na horizontal, sem letra minúscula.

**Modais em ecrã inteiro.** No telemóvel, as janelas sobem de baixo e ocupam o ecrã, com cabeçalho e rodapé
fixos — os botões de acção estão sempre visíveis, mesmo com o formulário longo.

**Alvos de toque adequados.** Todos os botões e campos passaram a ter no mínimo 44 px de altura, a medida
recomendada pela Apple e pela Google. Os botões de acção nas listas ocupam a largura toda no telemóvel.

**Sem ampliação indesejada no iPhone.** Os campos passaram a 16 px: abaixo disso, o Safari do iOS amplia
automaticamente ao tocar num campo, desalinhando a página. É um detalhe que estraga a utilização e agora
está resolvido.

**Áreas seguras do iPhone.** A barra lateral e o fim das páginas respeitam a zona do indicador inferior e do
entalhe, com `viewport-fit=cover`.

**Menu móvel com fundo escurecido**, que se fecha ao tocar fora, e cabeçalho fixo ao deslizar.

**Instalável no ecrã inicial (PWA).** Com `manifest.json` e ícone próprio, o SIGTEC pode ser adicionado ao
ecrã inicial em iOS e Android e abre em ecrã inteiro, sem barra do browser, com o aspecto de aplicação.
No iPhone: Safari → Partilhar → «Adicionar ao ecrã principal». No Android: Chrome → menu → «Instalar aplicação».

## 3. Permissões novas

Acrescentadas à matriz e visíveis no Quadro de Permissões:
`departamentos.ver` (todos), `departamentos.gerir` (Admin), `users.editar` (Admin).

## Endpoints novos

```
GET    /api/departamentos
POST   /api/departamentos            (Admin)
PATCH  /api/departamentos/:id        (Admin)
DELETE /api/departamentos/:id        (Admin, só se não houver dependentes)
PATCH  /api/users/:id                (Admin) nome, perfil, departamento, posto
GET    /api/users/simples            lista para selectores
POST   /api/activos/:id/eventos      registo manual no histórico técnico
```

---

## Continua por fazer

Mantêm-se as pendências que não são código: contas nominais e desactivação das de demonstração, limpeza dos
dados fictícios, cópias de segurança testadas, notificações por email, e formar uma segunda pessoa.

Do documento de arquitectura, para fases seguintes: stock de peças, Auto de Entrega de Equipamento, gestão
de problemas e mudanças, custo total de propriedade, inventário físico com leitura de QR pela câmara do
telemóvel (agora que a base móvel está pronta, é um passo curto), e monitorização activa.
