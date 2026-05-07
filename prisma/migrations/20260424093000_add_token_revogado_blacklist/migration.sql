-- CreateTable
CREATE TABLE "TokenRevogado" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRevogado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenRevogado_jti_key" ON "TokenRevogado"("jti");

-- CreateIndex
CREATE INDEX "TokenRevogado_usuarioId_idx" ON "TokenRevogado"("usuarioId");

-- CreateIndex
CREATE INDEX "TokenRevogado_expiracao_idx" ON "TokenRevogado"("expiracao");
