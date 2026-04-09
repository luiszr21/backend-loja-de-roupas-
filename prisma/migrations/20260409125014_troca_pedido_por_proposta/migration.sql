/*
  Warnings:

  - You are about to drop the `Carrinho` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemCarrinho` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemPedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pagamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pedido` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Carrinho" DROP CONSTRAINT "Carrinho_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "ItemCarrinho" DROP CONSTRAINT "ItemCarrinho_carrinhoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemCarrinho" DROP CONSTRAINT "ItemCarrinho_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "Pagamento" DROP CONSTRAINT "Pagamento_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_usuarioId_fkey";

-- DropTable
DROP TABLE "Carrinho";

-- DropTable
DROP TABLE "ItemCarrinho";

-- DropTable
DROP TABLE "ItemPedido";

-- DropTable
DROP TABLE "Pagamento";

-- DropTable
DROP TABLE "Pedido";

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "resposta" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
