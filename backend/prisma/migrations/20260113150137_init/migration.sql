-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OFICIAL');

-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('FUTSAL', 'VOLEY', 'BASKET');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PROGRAMADO', 'EN_VIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GOL', 'ASISTENCIA', 'TARJETA_AMARILLA', 'TARJETA_ROJA', 'FALTA', 'WALKOVER_LOCAL', 'WALKOVER_VISITANTE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'OFICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Championship" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "SportType" NOT NULL DEFAULT 'FUTSAL',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Championship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviatura" TEXT,
    "escudoUrl" TEXT,
    "campus" TEXT,
    "carreraId" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "dorsal" INTEGER NOT NULL,
    "posicion" TEXT,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matchday" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "esPlayoff" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,

    CONSTRAINT "Matchday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "MatchStatus" NOT NULL DEFAULT 'PROGRAMADO',
    "jornadaId" INTEGER NOT NULL,
    "equipoLocalId" INTEGER NOT NULL,
    "equipoVisitanteId" INTEGER NOT NULL,
    "golesLocal" INTEGER NOT NULL DEFAULT 0,
    "golesVisitante" INTEGER NOT NULL DEFAULT 0,
    "pagoArbitrajeLocal" BOOLEAN NOT NULL DEFAULT false,
    "pagoArbitrajeVisitante" BOOLEAN NOT NULL DEFAULT false,
    "llevoBalonLocal" BOOLEAN NOT NULL DEFAULT false,
    "llevoBalonVisitante" BOOLEAN NOT NULL DEFAULT false,
    "planillaUrl" TEXT,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" SERIAL NOT NULL,
    "tipo" "EventType" NOT NULL,
    "minuto" INTEGER NOT NULL,
    "partidoId" INTEGER NOT NULL,
    "jugadorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Championship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matchday" ADD CONSTRAINT "Matchday_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Championship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "Matchday"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_equipoLocalId_fkey" FOREIGN KEY ("equipoLocalId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_equipoVisitanteId_fkey" FOREIGN KEY ("equipoVisitanteId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
