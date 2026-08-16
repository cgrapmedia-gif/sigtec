-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'TECNICO', 'FUNCIONARIO', 'DIRECCAO');

-- CreateEnum
CREATE TYPE "EstadoActivo" AS ENUM ('EM_ARMAZEM', 'OPERACIONAL', 'EM_MANUTENCAO', 'AVARIADO', 'OBSOLETO', 'ABATIDO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('NOVO', 'EM_ANALISE', 'EM_RESOLUCAO', 'AGUARDA_MATERIAL', 'RESOLVIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoProposta" AS ENUM ('COM_PARECER', 'AGUARDA_APROVACAO', 'APROVADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'FUNCIONARIO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "localizacao" TEXT,
    "departamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "numInventario" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numSerie" TEXT,
    "dataAquisicao" TIMESTAMP(3) NOT NULL,
    "fimGarantia" TIMESTAMP(3),
    "localizacao" TEXT NOT NULL,
    "departamentoId" TEXT,
    "responsavelId" TEXT,
    "estado" "EstadoActivo" NOT NULL DEFAULT 'OPERACIONAL',
    "temDisco" BOOLEAN NOT NULL DEFAULT false,
    "falhas6m" INTEGER NOT NULL DEFAULT 0,
    "custoReparacao" DECIMAL(10,2),
    "valorSubstituicao" DECIMAL(10,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoActivo" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'intervencao',

    CONSTRAINT "EventoActivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoPedido" NOT NULL DEFAULT 'NOVO',
    "slaHoras" INTEGER NOT NULL DEFAULT 24,
    "autorId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "activoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemManutencao" (
    "id" TEXT NOT NULL,
    "tarefa" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "activoId" TEXT,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "concluidaPor" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "OrdemManutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropostaAbate" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "parecer" TEXT NOT NULL,
    "parecerPorId" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "sanitizacao" TEXT NOT NULL,
    "estado" "EstadoProposta" NOT NULL DEFAULT 'COM_PARECER',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropostaAbate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoAbate" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propostaId" TEXT NOT NULL,
    "aprovadoPorId" TEXT NOT NULL,

    CONSTRAINT "AutoAbate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "quando" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quemNome" TEXT NOT NULL,
    "quemPerfil" TEXT NOT NULL,
    "accao" TEXT NOT NULL,
    "titularNome" TEXT,
    "ip" TEXT,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaQuestionario" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "problema" TEXT NOT NULL,
    "equipamento" TEXT,
    "ferramenta" TEXT,
    "automatizar" TEXT,
    "formacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaQuestionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActivoToPropostaAbate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nome_key" ON "Departamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_numInventario_key" ON "Activo"("numInventario");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "PropostaAbate_numero_key" ON "PropostaAbate"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "AutoAbate_numero_key" ON "AutoAbate"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "AutoAbate_propostaId_key" ON "AutoAbate"("propostaId");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivoToPropostaAbate_AB_unique" ON "_ActivoToPropostaAbate"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivoToPropostaAbate_B_index" ON "_ActivoToPropostaAbate"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoActivo" ADD CONSTRAINT "EventoActivo_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPedido" ADD CONSTRAINT "EventoPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoPedido" ADD CONSTRAINT "EventoPedido_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemManutencao" ADD CONSTRAINT "OrdemManutencao_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaAbate" ADD CONSTRAINT "PropostaAbate_parecerPorId_fkey" FOREIGN KEY ("parecerPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAbate" ADD CONSTRAINT "AutoAbate_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "PropostaAbate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoAbate" ADD CONSTRAINT "AutoAbate_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuestionario" ADD CONSTRAINT "RespostaQuestionario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivoToPropostaAbate" ADD CONSTRAINT "_ActivoToPropostaAbate_A_fkey" FOREIGN KEY ("A") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivoToPropostaAbate" ADD CONSTRAINT "_ActivoToPropostaAbate_B_fkey" FOREIGN KEY ("B") REFERENCES "PropostaAbate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
