-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "excluidoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
