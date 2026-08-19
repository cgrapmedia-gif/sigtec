# SIGTEC — Fase 9: Localização física, inventário geral e folha timbrada do Consulado

```bash
# Copiar o conteúdo de sigtec/ para C:\Projectos\sigtec (substituir)
cd C:\Projectos\sigtec\backend
npm install
npx prisma migrate dev --name fase9-localizacao
npx prisma db seed

cd C:\Projectos\sigtec\frontend
npm install

cd C:\Projectos\sigtec
git add . && git commit -m "Fase 9: localizacao fisica, inventario geral, folha timbrada" && git push
```

⚠ Como sempre: **crie a migração localmente antes do push**, ou o Railway não terá nada para aplicar.
Depois do deploy, corra o seed uma vez contra a base de produção.

---

## 1. Localização física estruturada

O campo único de localização foi substituído por quatro campos, cada um com sugestões dos valores já usados:

| Campo | Exemplo | Para quê |
|---|---|---|
| **Piso / Andar** | Piso 1 | Onde procurar no edifício |
| **Sala** | Sala de Atendimento | Onde exactamente |
| **Sector** | Atendimento (frontoffice) | **Distingue o posto de atendimento do backoffice** |
| **Posto de trabalho** | Balcão 4 | O lugar concreto |

É o **sector** que resolve o caso que descreveu: um funcionário com dois computadores — um no atendimento e
outro no backoffice — passa a ver os dois identificados pelo sector, e não por dois códigos de inventário
que ele não tem obrigação de saber distinguir.

O seed já inclui esse caso: Luísa Baptista tem agora o computador da Secretaria (backoffice) **e** um
segundo no Balcão 4 (frontoffice).

## 2. O funcionário reconhece o seu equipamento

No assistente de pedido, o passo de escolha do equipamento deixou de ser uma lista e passou a **cartões
tocáveis**, com o sector em destaque:

> 💻 **Atendimento (frontoffice)**
> HP ProDesk 400 G7 · Piso 1 · Sala de Atendimento
> CGA-INF-0015

Quem tem mais do que um equipamento vê o aviso «Tem 2 equipamentos atribuídos — escolha aquele que tem o
problema». Quem só tem um, escolhe-o com um toque.

## 3. Inventário Geral — página nova

Lista real de tudo o que existe, com:

- **Agrupamento** por sector, piso ou responsável (ou lista simples)
- Filtros por sector, piso e tipo, mais pesquisa livre por código, sala, posto, responsável ou n.º de série
- Contadores de total, operacionais, com problema e número de sectores
- Opção de **incluir os bens abatidos**, para efeitos de auditoria patrimonial
- Botão de **PDF na folha padrão do Consulado**, respeitando os filtros aplicados

## 4. Folha padrão do Consulado em todos os PDF

Extraí o cabeçalho e o rodapé do `Folha_Geral.docx` que enviou e reproduzi-os fielmente nos documentos
gerados pelo servidor:

- **Cabeçalho**: emblema da República de Angola centrado, «REPÚBLICA DE ANGOLA» e «Consulado Geral no Porto»
- **Rodapé**: barra vertical nas cores nacionais, morada, telefone, fax, email e sítio, e os logótipos
  **Governo de Angola · MIREX** à direita
- Repetidos em **todas as páginas**, com numeração «Página X de Y»

Aplicada a quatro documentos:

1. **Auto de Abate** — já existia, agora na folha oficial
2. **Auto de Entrega de Equipamento** — novo, para responsabilização patrimonial na atribuição
3. **Inventário de Bens Tecnológicos** — novo, com tabela que repete o cabeçalho em cada página
4. **Relatório de Gestão Tecnológica** — novo, com resumo executivo, indicadores, equipamentos com maior
   taxa de falha e plano de renovação, pronto para assinatura

Os logótipos ficam **embebidos no código**, para os PDF funcionarem no Railway sem depender de cópia de
ficheiros durante a compilação.

## 5. Exportação CSV mais completa

Passou a incluir tipo, designação, piso, sala, sector e posto — pronta para tratamento em folha de cálculo.

## Endpoints novos

```
GET /api/activos/localizacoes           valores já usados em piso, sala, sector e posto
GET /api/relatorios/inventario          lista completa com localização estruturada
GET /api/relatorios/inventario.pdf      inventário na folha do Consulado (respeita filtros)
GET /api/relatorios/relatorio.pdf       relatório de gestão na folha do Consulado
```

---

## Sugestão para o registo do parque real

Agora que os campos existem, vale a pena registar o parque de uma vez, com o botão **«⧉ Registar vários»**:
uma remessa por sector, colando de uma folha de cálculo no formato `n.º de série ; localização`. Depois
basta atribuir os responsáveis — e o sistema passa a saber onde está cada bem e quem responde por ele.
