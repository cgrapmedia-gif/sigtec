# SIGTEC — Roadmap das 10 Fases Seguintes

**Consulado Geral de Angola no Porto** · Agosto de 2026
*Documento de planeamento · Fases 8 a 17*

---

## Como ler este documento

Cada fase indica o **problema real** que resolve, o que inclui, o esforço estimado e as dependências.
A ordem proposta é por **valor entregue a dividir por esforço**, não por sofisticação técnica.

Legenda de esforço: 🔹 curto (1-2 dias) · 🔸 médio (3-5 dias) · 🔶 longo (1-2 semanas)

---

# FASE 8 — Interface adaptável, a sério 🔸

**Problema:** a adaptação a telemóvel foi feita por camadas sucessivas e nota-se. Há tabelas que ainda
deslizam, formulários com dois campos lado a lado onde não cabem, e ecrãs desenhados para rato usados com o
polegar. O técnico está de pé ao lado do equipamento — se a interface o obrigar a ampliar e a arrastar,
não a usa.

**O que inclui:**
- Reconstrução das páginas em **abordagem telemóvel primeiro**, e não desktop reduzido
- Ponto de corte único e coerente em 768 px, aplicado a todas as páginas sem excepção
- Barra de navegação inferior fixa no telemóvel, com as 4 acções principais do perfil
- Listas com **carregamento progressivo** em vez de tabelas completas
- Gestos: deslizar para a esquerda numa lista abre acções rápidas
- Estados vazios ilustrados, que ensinam em vez de deixar um ecrã em branco
- Verificação real em iPhone SE (o mais estreito em uso), iPad e Android de gama média

**Dependências:** nenhuma. **Deve ser a próxima fase.**

---

# FASE 9 — Notificações por email e no telemóvel 🔸

**Problema:** as notificações só existem dentro da aplicação. Se o técnico abrir um pedido crítico às 9h e o
Administrador só entrar no sistema às 11h, perderam-se duas horas de um SLA de quatro.

**O que inclui:**
- Envio por email em todos os eventos que já geram notificação
- **Notificações push** (Web Push) para quem instalou a aplicação no ecrã inicial
- Preferências por utilizador: o que quer receber, por que via, e em que horário
- Resumo diário opcional para a Direcção
- Registo de entregas, para provar que o aviso foi enviado

**Decisão necessária:** fornecedor de email (Resend, SendGrid ou o SMTP do Consulado) e validação do domínio.

---

# FASE 10 — Leitura de QR e modo de campo 🔸

**Problema:** o técnico tem o telemóvel na mão, à frente do equipamento avariado, e tem de procurar o número
de inventário numa lista.

**O que inclui:**
- **Leitura de QR pela câmara** → abre a ficha do item de imediato
- Ecrã de campo optimizado: histórico, garantia, contrato, «quem contactar» e peças compatíveis
- Registo de intervenção **por ditado de voz**, para não escrever de pé
- **Modo offline** com sincronização posterior: as salas técnicas têm cobertura fraca
- Acção rápida «abrir pedido para este equipamento» a partir do QR

**Dependências:** Fase 8 (a base móvel tem de estar sólida primeiro).

---

# FASE 11 — Fotografias e documentos 🔸

**Problema:** «o ecrã mostra uma mensagem estranha» descrito por palavras vale muito menos do que uma
fotografia. E as garantias e facturas continuam em pastas de rede.

**O que inclui:**
- Fotografia directa da câmara no assistente de pedido e no registo de intervenção
- Anexos na ficha do item: garantias, facturas, manuais, autos assinados
- Compressão automática e limite de tamanho, com miniaturas
- Política de retenção e eliminação, para cumprir o RGPD

**Decisão necessária:** armazenamento de ficheiros (Cloudflare R2 ou AWS S3, cerca de 5 €/mês).

---

# FASE 12 — Stock de peças e consumíveis 🔸

**Problema:** os técnicos já o disseram no questionário — «falta de discos SSD em stock para substituições
rápidas». O sistema recolheu a queixa e não tem onde a resolver. E o estado «aguarda material» não tem
gestão associada nenhuma.

**O que inclui:**
- Registo de peças e consumíveis com quantidade, localização e **ponto de encomenda**
- Alerta automático quando o stock desce abaixo do mínimo
- Consumo ligado ao pedido: ao usar uma peça, o stock desce e o custo entra no histórico do equipamento
- Sugestão de peça compatível na ficha e nas sugestões de resolução
- Histórico de consumo, que fundamenta as aquisições perante a Direcção

---

# FASE 13 — Auto de Entrega e ciclo de vida do funcionário 🔹

**Problema:** quando alguém entra, ninguém sabe que equipamento e acessos atribuir. Quando sai, ninguém sabe
o que tem de devolver. É risco de segurança e de perda patrimonial ao mesmo tempo.

**O que inclui:**
- **Auto de Entrega de Equipamento** em PDF — o gerador do Auto de Abate já existe, é reaproveitá-lo
- Circuito de entrada: modelo de posto por função, com equipamento e acessos padrão
- Circuito de saída: lista do que a pessoa tem, com confirmação de devolução item a item
- Termo de responsabilidade assinado, associado à ficha do equipamento

**Esforço baixo, valor institucional alto.** Bom candidato a fazer em paralelo com outra fase.

---

# FASE 14 — Gestão de problemas e de mudanças 🔸

**Problema:** cada avaria é tratada como um caso isolado. O leitor biométrico com cinco falhas em seis meses
não são cinco incidentes: é **um problema**. Sem esta distinção, a equipa corre atrás de sintomas para sempre.

**O que inclui:**
- **Problemas**: agrupam incidentes recorrentes, com investigação de causa raiz e solução definitiva
- Detecção automática de candidatos a problema (N incidentes iguais no mesmo item ou modelo)
- **Mudanças**: janela de intervenção, análise de impacto automática (as relações já existem), plano de
  recuo obrigatório e aprovação prévia quando afecta o atendimento
- Calendário de mudanças, para nunca coincidirem com horário de público

---

# FASE 15 — Custo total de propriedade e planeamento plurianual 🔸

**Problema:** o argumento de substituição assenta em idade e falhas — que é o argumento fraco. O argumento
forte é: *«esta impressora custou 380 € e já consumiu 640 € em toners e reparações em três anos.»*

**O que inclui:**
- Registo de custos por item: aquisição, reparações, consumíveis, licenças, energia estimada
- **TCO** calculado e comparável entre equipamentos da mesma categoria
- Projecção de investimento a 5 anos, a partir dos ciclos de vida e datas de aquisição
- Curva orçamental com picos identificados com antecedência
- Relatório de proposta orçamental pronto a apresentar

---

# FASE 16 — Monitorização activa e manutenção preditiva 🔶

**Problema:** o sistema é reactivo. Espera que alguém se queixe.

**O que inclui:**
- Agente leve nos computadores: espaço em disco, saúde SMART, temperatura, tempo de actividade, versões
- Sondas de rede (ping, SNMP) para switches, routers, UPS e impressoras
- Painel em tempo real na sala técnica
- **Manutenção preditiva**: «o disco de CGA-INF-0004 tem sectores reatribuídos a crescer — falha provável em
  30 a 60 dias; agendar substituição preventiva»
- Abertura automática de pedido quando um limiar é ultrapassado

**Dependências:** o modelo de dados de relações e serviços (já feito). Sem ele, telemetria dá gráficos
bonitos sem valor de decisão.

---

# FASE 17 — Assinatura qualificada, arquivo e interoperabilidade 🔶

**Problema:** os Autos nascem digitais mas ainda precisam de impressão para assinar. E um auto patrimonial
de 2026 tem de ser legível e verificável em 2046.

**O que inclui:**
- **Assinatura electrónica qualificada** nos Autos de Abate e de Entrega — fecha o circuito zero papel
- Arquivo de longo prazo em PDF/A com metadados e carimbo temporal
- **API de inventário federado**: permitiria ao MIREX ver o parque tecnológico dos consulados de forma
  agregada e comparar indicadores. O SIGTEC deixa de ser um sistema do Porto e passa a modelo replicável
- Autenticação única (SSO) com as contas institucionais e 2FA para perfis de gestão

---

## Ordem recomendada

| Sequência | Fases | Porquê |
|---|---|---|
| **Imediato** | 8, 9 | Sem interface móvel sólida e sem email, o sistema não é usável no terreno |
| **Curto prazo** | 10, 13 | Alto valor, esforço contido; a 13 pode correr em paralelo |
| **Médio prazo** | 11, 12, 14 | Dependem de decisões (armazenamento) ou de dados acumulados |
| **Consolidação** | 15, 16 | Só fazem sentido com histórico real de várias semanas |
| **Maturidade** | 17 | Exige decisões institucionais fora do âmbito técnico |

## Antes de qualquer fase nova

Mantêm-se pendentes, e nenhuma é código:

1. Criar contas nominais e **desactivar as contas de demonstração**
2. **Limpar os dados fictícios** e registar o parque real — os indicadores estão a ser calculados sobre ficção
3. **Cópias de segurança testadas** — a Neon gratuita não garante recuperação a um ponto no tempo
4. **Uma sessão com a equipa técnica** a alargar o catálogo de sintomas e os procedimentos de resolução
5. **Formar uma segunda pessoa** — um sistema que depende de uma pessoa ainda não é institucional

*A quarta é a que mais retorno dá por hora investida. Uma hora com os técnicos a listar as avarias reais do
último ano melhora o sistema mais do que qualquer fase deste documento.*
