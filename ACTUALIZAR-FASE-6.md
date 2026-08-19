# SIGTEC — Fase 6: Sistema que qualquer pessoa consegue usar

## Como aplicar

```bash
# 1. Copiar o conteúdo de sigtec/ para C:\Projectos\sigtec (substituir)
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fase6-sintomas
npx prisma db seed          # carrega os 30 sintomas catalogados

cd C:\Projectos\sigtec\frontend
npm install

cd C:\Projectos\sigtec
git add . && git commit -m "Fase 6: assistente de sintomas e paineis por perfil" && git push
```
Em produção, corra o seed uma vez apontando o `.env` local à base do Railway, para os sintomas ficarem lá.

---

## O diagnóstico que originou esta fase

O sistema estava desenhado **para quem já sabe o que quer registar**. Pedia «Categoria: Hardware / Software /
Rede» e «Prioridade: Alta / Crítica» a alguém cujo computador simplesmente não liga. Quem não é da área ou
escolhe ao acaso — estragando os dados — ou desiste e telefona ao técnico. Nos dois casos, o sistema perde.

A correcção foi inverter a lógica: **o sistema pergunta sintomas em linguagem comum e deduz o resto.**

## 1. Assistente de sintomas — a nova forma de pedir ajuda

Um botão grande, «Preciso de ajuda», e três passos quase sem escrita:

**Passo 1 — O que está a acontecer?** Sintomas agrupados por área, com ícone e frase simples:
*«Não liga — nada acontece ao carregar no botão»*, *«O ecrã fica preto»*, *«Não tenho internet»*,
*«O leitor de impressões digitais não lê»*. Há também pesquisa livre, para quem prefere escrever.

**Passo 2 — Auto-ajuda antes do pedido.** Antes de abrir o pedido, o sistema mostra os passos que resolvem a
maioria dos casos, com dois botões: «Isto resolveu, obrigado» ou «O problema continua». Cada resolução por
auto-ajuda é contabilizada — é trabalho que a equipa técnica não teve de fazer.

**Passo 3 — Perguntas por toque.** Duas ou três perguntas de escolha, sem escrever: *«Os colegas também estão
sem internet?»*, *«Está a atender público neste momento?»* Depois, confirmar e enviar.

**O que o sistema faz sozinho:** define a categoria técnica, define a prioridade e o SLA, **sobe a urgência
automaticamente se a resposta indicar público em espera**, monta o assunto e compõe a descrição a partir das
respostas, preenche requerente e posto, e sugere os equipamentos do próprio utilizador.

**O que o técnico recebe:** o pedido já com uma pista de diagnóstico. Por exemplo, no ecrã preto:
*«Luz laranja indica ausência de sinal — verificar cabo antes de trocar o monitor.»* A experiência da equipa
deixa de depender de quem está de serviço.

**30 sintomas catalogados de origem**, cobrindo computadores, impressoras, rede e internet, atendimento
consular (biometria, vistos, senhas), programas e acessos, telefone e pedidos de equipamento.

## 2. Catálogo de Sintomas — configurável, como tudo o resto

Página nova onde Técnicos e Administrador acrescentam sintomas: rótulo em linguagem comum, ícone, passos de
auto-ajuda, perguntas com opções, prioridade, categoria técnica e pista de diagnóstico.

**Esta é a página mais importante para a evolução do sistema.** Sempre que aparecer uma avaria nova, cinco
minutos a catalogá-la poupam dezenas de pedidos mal preenchidos no futuro. E o contador «usado N×» mostra
quais são os problemas reais do Consulado — informação que nenhum inquérito daria com esta fidelidade.

## 3. Painel reconstruído — cada perfil vê o que tem de fazer

O painel único foi substituído por três, porque as perguntas são diferentes:

**Funcionário — «o que se passa com os meus pedidos»**
Saudação pelo nome, botão grande de ajuda, e os pedidos em curso com o estado **em linguagem simples**:
«Um técnico está a analisar», «À espera de material ou peça» — em vez de `EM_ANALISE` ou `AGUARDA_MATERIAL`.
Mais os seus equipamentos e os artigos que pode consultar para resolver sozinho.

**Técnico e Administrador — «o que preciso de fazer agora»**
Quatro contadores de acção (SLA excedido, prazo a terminar, por atribuir, atribuídos a mim) e uma **fila de
trabalho ordenada por urgência real**: primeiro os SLA violados, depois os em risco, depois por prioridade.
Cada linha traz a pista de diagnóstico. Abaixo: manutenção dos próximos 15 dias e o que o sistema já tratou
sozinho (garantias, contratos a expirar, candidatos a abate).

**Direcção — «o que tenho de decidir»**
As propostas de abate pendentes em primeiro lugar, com valor de substituição e botão directo para decidir.
Depois os indicadores de serviço e o estado do património.

## 4. Pedidos separados por categoria

A lista passou a ter **separadores por categoria** no topo, cada um com a contagem de pedidos em curso, e um
selector **Em curso / Histórico**. Por omissão mostra só o que está em aberto — que é o que interessa a quem
está a trabalhar. Ninguém precisa de olhar para 200 pedidos resolvidos para encontrar os três de hoje.

## Endpoints novos

```
GET  /api/sintomas                    catálogo agrupado
GET  /api/sintomas/frequentes         os mais usados
POST /api/sintomas                    (Admin/Técnico)
PATCH /api/sintomas/:id               (Admin/Técnico)
POST /api/sintomas/:id/auto-ajuda     métrica de problemas resolvidos sem pedido
POST /api/pedidos/por-sintoma         abertura pelo assistente
GET  /api/pedidos/resumo-categorias   contagens para os separadores
GET  /api/dashboard                   agora devolve painel específico do perfil
```

---

## O que faria a seguir, por ordem de impacto

1. **Alargar o catálogo de sintomas** com a equipa técnica — uma sessão de uma hora a listar as avarias reais
   do último ano vale mais do que qualquer funcionalidade nova.
2. **Notificações por email** — sem elas, o circuito de suporte só funciona com o sistema aberto no browser.
3. **Leitura de QR pela câmara** — o técnico aponta ao equipamento e abre a ficha. A base móvel já está pronta.
4. **Fotografia no pedido** — «uma imagem do erro» poupa uma deslocação; falta decidir o armazenamento.
5. **Stock de peças** — os técnicos já pediram; sem isto, «aguarda material» não tem gestão associada.
