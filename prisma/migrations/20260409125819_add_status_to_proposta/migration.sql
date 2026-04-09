/*
  Warnings:

  - Added the required column `atualizadoEm` to the `Proposta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Proposta" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pendente';
