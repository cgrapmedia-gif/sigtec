# SIGTEC — Actualização Fases 2 e 3

Esta versão inclui tudo o que já existia (Fase 1) mais os módulos de análise, conhecimento e robustez.

## Como aplicar

**Passo 1.** Descompacte este pacote para uma pasta temporária.

**Passo 2.** Copie o conteúdo da pasta `sigtec` para `C:\Projectos\sigtec`, substituindo os ficheiros.
*(O pacote não contém `.env` nem `prisma/migrations` — a sua configuração e histórico ficam intactos.)*

**Passo 3.** Backend — dependências novas e migração:

```bash
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fases23
```

Esta migração acrescenta: `Pedido.satisfacao`, `Pedido.satisfacaoComentario`,
`OrdemManutencao.recorrenciaMeses` e a tabela `ArtigoConhecimento`.

**Passo 4.** Carregue os artigos iniciais da base de conhecimento:

```bash
npx prisma db seed
```
*(O seed é idempotente: não duplica os dados que já existem.)*

**Passo 5.** Frontend:

```bash
cd C:\Projectos\sigtec\frontend
npm install
```

**Passo 6.** Publique:

```bash
cd C:\Projectos\sigtec
git add .
git commit -m "Fases 2 e 3: relatorios, conhecimento, SLA, satisfacao, rotinas, hardening"
git push
```

**Passo 7.** O Railway aplica a migração no arranque (`migrate deploy`). Para os artigos da base de
conhecimento aparecerem em produção, corra o seed uma vez apontando o `.env` local à base de produção
(como fez na Fase 1).

---

## FASE 2 — Valor operacional

### Relatórios & Indicadores (`/relatorios`)
Página nova com **gráficos reais** (Recharts): evolução mensal de pedidos abertos vs. resolvidos,
equipamentos com maior taxa de falha, distribuição por categoria e por prioridade.
Inclui KPIs de desempenho, tabela de **risco de falha do parque** e o **plano de renovação** com totais.
Exportação do inventário em **CSV** e impressão do relatório.

### Indicadores reais em todo o lado
Os números do painel público e da Transparência deixaram de estar fixos no código: são **calculados
a partir da base** — tempo médio de resolução, percentagem de SLA cumprido, satisfação média,
folhas de papel evitadas, horas poupadas, registos de auditoria.

### SLA activo (`/pedidos`)
Cada pedido mostra agora o estado do prazo: horas restantes, aviso quando entra nos últimos 25% do
tempo, e marca clara de **SLA excedido** ou **SLA cumprido** após a conclusão.

### Avaliação de satisfação
Depois de resolvido, o requerente vê «Avaliar atendimento» e classifica de 1 a 5 com comentário
opcional. As avaliações alimentam o painel público — deixa de ser um número ilustrativo.

### Manutenção operacional (`/manutencao`)
Criação de ordens pela interface, com **recorrência** (mensal a anual): ao concluir uma ordem
recorrente, a próxima é agendada automaticamente. Botão **«Gerar rotinas do parque»** que cria o
calendário preventivo completo segundo as rotinas por categoria, sem duplicar o que já existe.

### Questionário Técnico (`/questionario`)
Passou do protótipo para produção: formulário e histórico de respostas da equipa.

### Abate de vários equipamentos
Os candidatos passam a ter caixa de selecção: escolha vários e crie um **processo conjunto** —
um único Auto de Abate para todos, como é prática corrente.

## FASE 3 — Inteligência e robustez

### Motor de regras (assistente de decisão)
Implementado como **regras determinísticas e explicáveis**, não como caixa negra — decisão deliberada
num contexto institucional onde cada sugestão tem de ser justificável perante a Direcção e auditável:

- **Triagem automática**: ao escrever o assunto do pedido, o sistema sugere prioridade e categoria,
  mostrando *porquê* («expressão "não arranca" indica serviço interrompido»). O utilizador pode alterar.
- **Resumo executivo** nos relatórios: texto gerado a partir dos dados reais do período.
- **Risco de falha**: pontuação por equipamento (idade, garantia, historial), com nível Alto/Médio/Baixo.

### Base de Conhecimento (`/conhecimento`)
Artigos pesquisáveis por texto e palavras-chave, com categorias e contagem de visualizações.
Técnicos e Admin escrevem; todos consultam. Já vem com 5 artigos: encravamento de impressora,
leitor biométrico, pasta partilhada, computador lento e o **procedimento formal de abate**.

### Interoperabilidade
- `GET /api/relatorios/publico` — indicadores **sem autenticação**, para publicação ou integração
- `GET /api/relatorios/inventario.csv` — exportação do inventário (Excel/LibreOffice, com BOM UTF-8)

### Robustez
- **Helmet** — cabeçalhos de segurança HTTP
- **Rate limiting** — 120 pedidos por minuto por IP, contra abuso e ataques automatizados

## Endpoints novos

```
GET  /api/relatorios                    indicadores completos + resumo executivo
GET  /api/relatorios/publico            KPIs de digitalização (sem autenticação)
GET  /api/relatorios/inventario.csv     exportação do inventário
POST /api/pedidos/triagem               sugestão de prioridade e categoria
POST /api/pedidos/:id/avaliacao         { nota: 1-5, comentario? }
POST /api/manutencao/gerar-rotinas      calendário preventivo automático
GET  /api/conhecimento?pesquisa=&categoria=
GET  /api/conhecimento/:id
POST /api/conhecimento                  (Admin/Técnico)
PATCH /api/conhecimento/:id             (Admin/Técnico)
```

---

## O que fica por fazer (depende de decisões, não de programação)

| Item | O que falta decidir | Custo indicativo |
|---|---|---|
| **Notificações por email** | Escolher fornecedor (Resend, SendGrid ou SMTP do Consulado) e validar o domínio remetente | 0–20 €/mês |
| **Fotografias nos pedidos** | Escolher armazenamento de ficheiros (Cloudflare R2 ou AWS S3) e definir política de retenção | ~5 €/mês |
| **IA generativa** (resumos em linguagem natural, sugestão de solução) | Decidir se se aceita enviar dados a um fornecedor externo; havendo decisão favorável, integra-se sobre o motor de regras já existente | consumo por utilização |
| **Domínio próprio** (`sigtec.consuladoporto.gov.ao`) | Acesso à gestão de DNS do domínio institucional | 0 € (configuração) |
| **Testes automatizados e leitura de QR por telemóvel** | Apenas prioridade e tempo | 0 € |

Nenhum destes bloqueia o uso corrente do sistema.
