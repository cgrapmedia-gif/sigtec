-- AlterTable
ALTER TABLE "Notificacao" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "PropostaAbate" ADD COLUMN     "motivoRejeicao" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "precisaTrocarPassword" BOOLEAN NOT NULL DEFAULT false;
