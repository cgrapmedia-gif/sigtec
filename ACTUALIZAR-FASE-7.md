# SIGTEC — Fase 7: Robustez, uniformidade e ajuda em todo o lado

```bash
# 1. Copiar o conteúdo de sigtec/ para C:\Projectos\sigtec (substituir)
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fase7
npx prisma db seed        # carrega os procedimentos de resolução e preenche o utilizador das contas

cd C:\Projectos\sigtec\frontend
npm install

cd C:\Projectos\sigtec
git add . && git commit -m "Fase 7: lote, criacao inline, sugestoes de resolucao, login por utilizador" && git push
```

⚠ **Importante:** a migração acrescenta o campo `utilizador` às contas e o seed preenche-o. Corra o seed
também contra a base de produção, ou ninguém consegue entrar com o novo formato.

---

## 1. Início de sessão por utilizador, não por email

Entra-se agora com `carlos.miranda`, não com o email completo. O email continua a existir como dado de
contacto, mas deixou de ser a chave de acesso.

**O ecrã de login foi reconstruído:** sem nenhuma conta visível, com campo de utilizador explicado
(«é o seu nome no formato primeiro.ultimo»), botão para mostrar a palavra-passe, mensagens de erro em
linguagem clara e uma secção «Não consigo entrar» que responde às três dúvidas habituais.

## 2. Registar vários equipamentos de uma vez

Botão **«⧉ Registar vários»** no inventário, com dois modos:

- **Repetir N vezes** — para uma remessa de dez computadores iguais; os números de inventário saem em sequência
- **Colar lista** — uma linha por equipamento (`n.º de série ; localização`), colável directamente de uma
  folha de cálculo

No fim, mostra quantos foram criados e quais as linhas com erro, sem perder o trabalho feito.

## 3. Criar sem sair do formulário

Novo componente aplicado a todos os selectores: ao lado de cada lista há um botão **＋**. Falta o
departamento? Cria-se ali, num mini-formulário em linha, e fica automaticamente seleccionado. O mesmo para
categorias e fornecedores. Nunca mais é preciso abandonar um formulário a meio.

## 4. Duas vertentes em todos os formulários

Uniformizado em todo o sistema: **🧭 Com ajuda** e **⚙ Preenchimento completo**.

- **Itens de configuração** — o modo com ajuda pede só o essencial e atribui o número automaticamente
- **Manutenção** — o modo com ajuda oferece tarefas habituais que preenchem categoria e periodicidade
- **Pedidos** — o assistente de sintomas (Fase 6) e o registo manual para técnicos

Em ambos os modos há explicações: o modo completo não é o modo sem ajuda.

## 5. Sugestões de resolução ao técnico

Ao abrir um pedido, o técnico recebe um painel com sugestões combinadas de três fontes:

1. **Procedimentos genéricos por fabricante** — 18 carregados de origem, cobrindo HP, Dell, Kyocera,
   Cisco Meraki, Dermalog e APC, mais procedimentos genéricos por categoria
2. **O que já resolveu este mesmo equipamento** no passado
3. **Casos idênticos noutros equipamentos do mesmo modelo**

Cada procedimento tem passos numerados, peça provável e tempo estimado. E dois botões: «Resolveu o problema»
ou «Apliquei, não resolveu» — **o sistema regista a taxa de sucesso real e os procedimentos mais eficazes
sobem sozinhos nas sugestões**.

Nova página **Procedimentos de Resolução** para a equipa acrescentar os seus. É aqui que a experiência deixa
de estar só na cabeça de quem tem mais anos de casa.

## 6. Tudo separado por categoria

A lógica dos separadores dos pedidos foi aplicada ao **inventário** e à **manutenção**: separadores no topo
com contagem, deslizáveis no telemóvel.

## 7. Responsivo corrigido

O ponto de corte estava em conflito: as tabelas viravam cartões abaixo de 700 px mas mantinham largura
mínima a partir de 640 px — entre os dois valores nada funcionava bem. Está tudo alinhado em **768 px**, e
os formulários passam a coluna única no telemóvel em vez de dois campos lado a lado.

**Nota honesta:** isto corrige o conflito, mas a adaptação móvel continua a ser desktop reduzido. A
reconstrução a sério é a **Fase 8** do roadmap, e recomendo que seja a próxima.

## Endpoints novos

```
POST /api/activos/lote                 registo em lote
GET  /api/resolucoes                   procedimentos
GET  /api/resolucoes/pedido/:id        sugestões para um pedido
POST /api/resolucoes                   criar procedimento
POST /api/resolucoes/:id/uso           { resolveu } — alimenta a taxa de sucesso
POST /api/auth/login                   agora aceita { utilizador, password }
```
