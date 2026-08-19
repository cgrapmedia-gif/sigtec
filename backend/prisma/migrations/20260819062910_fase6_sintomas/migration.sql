-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "resolvidoPorAutoAjuda" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "respostas" JSONB,
ADD COLUMN     "sintomaId" TEXT;

-- CreateTable
CREATE TABLE "Sintoma" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "icone" TEXT,
    "descricaoAjuda" TEXT,
    "perguntas" JSONB,
    "passosAutoAjuda" JSONB,
    "prioridadeSugerida" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "categoriaTecnica" TEXT NOT NULL,
    "diagnosticoProvavel" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vezesUsado" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sintoma_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_sintomaId_fkey" FOREIGN KEY ("sintomaId") REFERENCES "Sintoma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
