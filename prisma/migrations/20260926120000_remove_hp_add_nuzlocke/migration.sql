-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Mi Nuzlocke',
    "game" TEXT NOT NULL DEFAULT '',
    "ruleset" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nuzlocke" BOOLEAN NOT NULL DEFAULT false,
    "widgetToken" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'hud-bottom',
    "opacity" INTEGER NOT NULL DEFAULT 75,
    "scale" INTEGER NOT NULL DEFAULT 100,
    "gap" INTEGER NOT NULL DEFAULT 12,
    "showNickname" BOOLEAN NOT NULL DEFAULT true,
    "showLevel" BOOLEAN NOT NULL DEFAULT true,
    "showTypes" BOOLEAN NOT NULL DEFAULT true,
    "faintEffect" BOOLEAN NOT NULL DEFAULT true,
    "animated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Run" ("animated", "createdAt", "faintEffect", "game", "gap", "id", "isActive", "layout", "opacity", "ruleset", "scale", "showLevel", "showNickname", "showTypes", "title", "updatedAt", "widgetToken") SELECT "animated", "createdAt", "faintEffect", "game", "gap", "id", "isActive", "layout", "opacity", "ruleset", "scale", "showLevel", "showNickname", "showTypes", "title", "updatedAt", "widgetToken" FROM "Run";
DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";
CREATE UNIQUE INDEX "Run_widgetToken_key" ON "Run"("widgetToken");
CREATE TABLE "new_Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "species" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT NOT NULL DEFAULT '',
    "level" INTEGER NOT NULL DEFAULT 50,
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
INSERT INTO "new_Slot" ("ability", "evs", "fainted", "gender", "id", "item", "ivs", "level", "moves", "nature", "nickname", "position", "runId", "shiny", "species", "teraType", "updatedAt") SELECT "ability", "evs", "fainted", "gender", "id", "item", "ivs", "level", "moves", "nature", "nickname", "position", "runId", "shiny", "species", "teraType", "updatedAt" FROM "Slot";
DROP TABLE "Slot";
ALTER TABLE "new_Slot" RENAME TO "Slot";
CREATE UNIQUE INDEX "Slot_runId_position_key" ON "Slot"("runId", "position");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

