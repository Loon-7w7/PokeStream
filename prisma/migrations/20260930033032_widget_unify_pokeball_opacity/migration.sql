-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nuzlocke" BOOLEAN NOT NULL DEFAULT false,
    "widgetToken" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'hud-bottom',
    "slotPositions" TEXT NOT NULL DEFAULT '',
    "opacity" INTEGER NOT NULL DEFAULT 75,
    "scale" INTEGER NOT NULL DEFAULT 100,
    "gap" INTEGER NOT NULL DEFAULT 12,
    "showNickname" BOOLEAN NOT NULL DEFAULT true,
    "showTypes" BOOLEAN NOT NULL DEFAULT true,
    "faintEffect" BOOLEAN NOT NULL DEFAULT true,
    "animated" BOOLEAN NOT NULL DEFAULT true,
    "deathCounter" BOOLEAN NOT NULL DEFAULT false,
    "deathCounterPosition" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Run" ("animated", "createdAt", "deathCounter", "deathCounterPosition", "faintEffect", "gap", "id", "isActive", "layout", "nuzlocke", "opacity", "ownerEmail", "scale", "showNickname", "showTypes", "slotPositions", "updatedAt", "widgetToken") SELECT "animated", "createdAt", "deathCounter", "deathCounterPosition", "faintEffect", "gap", "id", "isActive", "layout", "nuzlocke", "opacity", "ownerEmail", "scale", "showNickname", "showTypes", "slotPositions", "updatedAt", "widgetToken" FROM "Run";
DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";
CREATE UNIQUE INDEX "Run_ownerEmail_key" ON "Run"("ownerEmail");
CREATE UNIQUE INDEX "Run_widgetToken_key" ON "Run"("widgetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

