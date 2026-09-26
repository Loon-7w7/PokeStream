-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Mi Nuzlocke',
    "game" TEXT NOT NULL DEFAULT '',
    "ruleset" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "widgetToken" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'hud-bottom',
    "opacity" INTEGER NOT NULL DEFAULT 75,
    "scale" INTEGER NOT NULL DEFAULT 100,
    "gap" INTEGER NOT NULL DEFAULT 12,
    "showHp" BOOLEAN NOT NULL DEFAULT true,
    "showNickname" BOOLEAN NOT NULL DEFAULT true,
    "showLevel" BOOLEAN NOT NULL DEFAULT true,
    "showTypes" BOOLEAN NOT NULL DEFAULT true,
    "faintEffect" BOOLEAN NOT NULL DEFAULT true,
    "animated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "species" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT NOT NULL DEFAULT '',
    "level" INTEGER NOT NULL DEFAULT 50,
    "hpCurrent" INTEGER NOT NULL DEFAULT 0,
    "hpMax" INTEGER NOT NULL DEFAULT 0,
    "ability" TEXT NOT NULL DEFAULT '',
    "item" TEXT NOT NULL DEFAULT '',
    "nature" TEXT NOT NULL DEFAULT '',
    "teraType" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "shiny" BOOLEAN NOT NULL DEFAULT false,
    "fainted" BOOLEAN NOT NULL DEFAULT false,
    "moves" TEXT NOT NULL DEFAULT '[]',
    "evs" TEXT NOT NULL DEFAULT '',
    "ivs" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoryEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Run_widgetToken_key" ON "Run"("widgetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_runId_position_key" ON "Slot"("runId", "position");

-- CreateIndex
CREATE INDEX "HistoryEntry_runId_createdAt_idx" ON "HistoryEntry"("runId", "createdAt");
