-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "inicioTiempo" TIMESTAMP(3),
ADD COLUMN     "tiempoJuego" INTEGER NOT NULL DEFAULT 0;
