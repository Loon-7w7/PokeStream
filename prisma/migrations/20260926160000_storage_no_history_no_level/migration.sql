-- DropIndex
DROP INDEX "HistoryEntry_runId_createdAt_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HistoryEntry";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Storage" (
    "runId" TEXT NOT NULL PRIMARY KEY,
    "box" TEXT NOT NULL DEFAULT '',
    "graveyard" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Storage_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "species" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Slot" ("ability", "evs", "fainted", "gender", "id", "item", "ivs", "moves", "nature", "nickname", "position", "runId", "shiny", "species", "teraType", "updatedAt") SELECT "ability", "evs", "fainted", "gender", "id", "item", "ivs", "moves", "nature", "nickname", "position", "runId", "shiny", "species", "teraType", "updatedAt" FROM "Slot";
DROP TABLE "Slot";
ALTER TABLE "new_Slot" RENAME TO "Slot";
CREATE UNIQUE INDEX "Slot_runId_position_key" ON "Slot"("runId", "position");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

