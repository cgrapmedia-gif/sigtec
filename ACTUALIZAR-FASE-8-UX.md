# SIGTEC — Fase 8: Revisão profunda de UX e UI para telemóvel e tablet

```bash
# Copiar o conteúdo de sigtec/ para C:\Projectos\sigtec (substituir)
cd C:\Projectos\sigtec\frontend
npm install
cd C:\Projectos\sigtec
git add . && git commit -m "Fase 8: revisao profunda UX/UI movel" && git push
```

**Não há migração de base de dados nesta fase.** Só frontend — o deploy da Vercel basta.

---

## O que estava errado — auditoria feita ao código

Corri uma auditoria a todas as páginas antes de mexer. Resultado:

| Página | Estado encontrado |
|---|---|
| Obsolescência & Abate | **2 tabelas, 0 adaptadas** — deslizava na horizontal |
| Relatórios | **2 tabelas, 0 adaptadas** + gráficos com altura fixa |
| Transparência | **2 tabelas, 0 adaptadas** |
| Quadro de Permissões | **matriz de 5 colunas** — inutilizável num telemóvel |
| Activos | tabela de análise de impacto não adaptada |
| Todas | pontos de corte em conflito: `sm:` (640 px) misturado com `md:` (768 px) |

A causa de fundo: a adaptação foi feita **por camadas sucessivas sobre um desenho de secretária**. Umas
partes funcionavam, outras não, e não havia regra única.

## A abordagem desta revisão

Reconstruí a folha de estilos **a partir do telemóvel**: o ecrã pequeno é o caso base e o ecrã grande é o
que ganha colunas. **Um único ponto de corte: 1024 px.** Acima disso, secretária; abaixo, telemóvel e tablet.

### 1. Navegação repensada

- **Barra inferior fixa** com as 4 acções mais usadas por cada perfil, ao alcance do polegar. O funcionário
  tem Painel, Pedidos, Ajuda e Conta; o técnico tem Painel, Pedidos, Itens e Manutenção; a Direcção tem
  Painel, Pedidos, Abate e Relatórios. Mais um botão «☰ Mais» para o resto.
- **Menu lateral** passa a gaveta abaixo de 1024 px, com fundo escurecido, botão de fechar, e bloqueio do
  deslize do fundo enquanto está aberto. Fecha-se automaticamente ao navegar.
- **Cabeçalho fixo** que mostra o nome da página onde se está — os títulos duplicados foram removidos das
  páginas.

### 2. Tabelas: 12 tabelas convertidas

Todas as tabelas do sistema (excepto a matriz de permissões, que tem tratamento próprio) transformam-se em
**cartões legíveis** abaixo de 1024 px: nome do campo à esquerda, valor à direita, campo principal em
destaque no topo, botões de acção agrupados no fundo a largura total. **Nenhuma página desliza na horizontal.**

### 3. Quadro de Permissões reescrito

No telemóvel passa a mostrar **um perfil de cada vez**, escolhido em separadores, com as acções permitidas
(✓ verdes) e negadas (✕ cinzentas riscadas) agrupadas por área. A matriz completa de 5 colunas continua
a existir, mas só a partir de 1024 px, onde faz sentido.

### 4. Modais

- Sobem de baixo e ocupam o ecrã no telemóvel, com **barra de arrasto** visível
- Cabeçalho e rodapé fixos, corpo com deslize próprio: os botões nunca desaparecem
- Botões a largura total, empilhados, com a acção principal por cima
- Formulários em **coluna única** abaixo de 768 px

### 5. Detalhes que fazem a diferença no terreno

- **Alvos de toque de 44 px** em todos os botões e campos; 36 px nos botões compactos das listas
- **Campos a 16 px**, que impede o Safari do iOS de ampliar a página ao focar um campo
- **Áreas seguras** do entalhe e do indicador inferior respeitadas em todas as barras
- `overflow-x: hidden` global — o deslize horizontal acidental deixa de ser possível
- Gráficos com altura adaptável e gráfico circular com raio percentual
- Separadores deslizáveis sem barra de deslocamento visível
- Estados vazios uniformes, que explicam o que fazer a seguir

### 6. Uniformização

Todas as grelhas, separadores, botões compactos, modais e estados vazios passaram a usar as **mesmas classes
comuns**. Deixa de haver variações página a página — e a próxima página que se criar herda o comportamento.

## Como verificar

1. No telemóvel: abrir cada página e confirmar que **nada desliza para o lado**
2. Rodar o telemóvel para paisagem e confirmar que se mantém legível
3. Num tablet: confirmar que abaixo de 1024 px aparece a barra inferior, e acima aparece o menu lateral
4. Abrir um modal longo (por exemplo, registar um item) e confirmar que os botões ficam sempre visíveis
5. Tocar num campo de texto no iPhone e confirmar que **a página não amplia**

## Nota honesta

Esta revisão resolve a estrutura. O que fica para uma fase seguinte, e que exige teste com pessoas reais:
carregamento progressivo em listas longas, gestos de deslizar para acções rápidas, e revisão dos textos
com base em observação de utilização — não há substituto para ver alguém a usar o sistema pela primeira vez.
