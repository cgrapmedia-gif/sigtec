-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('EQUIPAMENTO', 'SOFTWARE', 'SERVICO', 'CONTRATO', 'INFRAESTRUTURA', 'CONSUMIVEL');

-- CreateEnum
CREATE TYPE "TipoRelacao" AS ENUM ('DEPENDE_DE', 'ALIMENTA', 'INSTALADO_EM', 'LIGADO_A', 'COBERTO_POR', 'SUBSTITUI');

-- AlterTable
ALTER TABLE "Activo" ADD COLUMN     "camposPersonalizados" JSONB,
ADD COLUMN     "categoriaId" TEXT,
ADD COLUMN     "contratoId" TEXT,
ADD COLUMN     "criticidade" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "designacao" TEXT,
ADD COLUMN     "fornecedorId" TEXT,
ADD COLUMN     "tipo" "TipoItem" NOT NULL DEFAULT 'EQUIPAMENTO';

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL DEFAULT 'EQUIPAMENTO',
    "icone" TEXT,
    "cicloVidaMeses" INTEGER NOT NULL DEFAULT 72,
    "falhasCriticas" INTEGER NOT NULL DEFAULT 5,
    "racioReparacao" INTEGER NOT NULL DEFAULT 50,
    "esquemaCampos" JSONB,
    "rotinaTarefa" TEXT,
    "rotinaMeses" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nif" TEXT,
    "contactoNome" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "apoioTecnico" TEXT,
    "observacoes" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "designacao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "avisoDias" INTEGER NOT NULL DEFAULT 60,
    "valorMensal" DECIMAL(10,2),
    "slaHoras" INTEGER,
    "numeroCliente" TEXT,
    "observacoes" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelacaoItem" (
    "id" TEXT NOT NULL,
    "origemId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "tipo" "TipoRelacao" NOT NULL DEFAULT 'DEPENDE_DE',
    "critica" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_nome_key" ON "Fornecedor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_numero_key" ON "Contrato"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "RelacaoItem_origemId_destinoId_tipo_key" ON "RelacaoItem"("origemId", "destinoId", "tipo");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacaoItem" ADD CONSTRAINT "RelacaoItem_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacaoItem" ADD CONSTRAINT "RelacaoItem_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
