/*
  Warnings:

  - A unique constraint covering the columns `[utilizador]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "utilizador" TEXT;

-- CreateTable
CREATE TABLE "Resolucao" (
    "id" TEXT NOT NULL,
    "marca" TEXT,
    "categoria" TEXT,
    "sintomaChave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "passos" JSONB NOT NULL,
    "pecaProvavel" TEXT,
    "tempoEstimado" INTEGER,
    "fonte" TEXT NOT NULL DEFAULT 'Fabricante',
    "vezesAplicada" INTEGER NOT NULL DEFAULT 0,
    "vezesResolvida" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resolucao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_utilizador_key" ON "User"("utilizador");
