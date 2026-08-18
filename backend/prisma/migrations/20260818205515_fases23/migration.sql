-- AlterTable
ALTER TABLE "OrdemManutencao" ADD COLUMN     "recorrenciaMeses" INTEGER;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "satisfacao" INTEGER,
ADD COLUMN     "satisfacaoComentario" TEXT;

-- CreateTable
CREATE TABLE "ArtigoConhecimento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "palavrasChave" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "autorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtigoConhecimento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtigoConhecimento" ADD CONSTRAINT "ArtigoConhecimento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
