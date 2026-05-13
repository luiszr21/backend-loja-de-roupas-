/*
  Warnings:

  - The `status` column on the `Proposta` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[nome]` on the table `Categoria` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PropostaStatus" AS ENUM ('PENDENTE', 'RESPONDIDA', 'ACEITA', 'REJEITADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Endereco" DROP CONSTRAINT "Endereco_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "Proposta" DROP CONSTRAINT "Proposta_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "Proposta" DROP CONSTRAINT "Proposta_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Produto" ALTER COLUMN "categoriaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Proposta" DROP COLUMN "status",
ADD COLUMN     "status" "PropostaStatus" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE INDEX "Endereco_usuarioId_idx" ON "Endereco"("usuarioId");

-- CreateIndex
CREATE INDEX "Produto_categoriaId_idx" ON "Produto"("categoriaId");

-- CreateIndex
CREATE INDEX "Proposta_usuarioId_idx" ON "Proposta"("usuarioId");

-- CreateIndex
CREATE INDEX "Proposta_produtoId_idx" ON "Proposta"("produtoId");

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
