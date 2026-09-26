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
    "showTypes" BOOLEAN NOT NULL DEFAULT true,
    "faintEffect" BOOLEAN NOT NULL DEFAULT true,
    "animated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Run" ("animated", "createdAt", "faintEffect", "game", "gap", "id", "isActive", "layout", "nuzlocke", "opacity", "ruleset", "scale", "showNickname", "showTypes", "title", "updatedAt", "widgetToken") SELECT "animated", "createdAt", "faintEffect", "game", "gap", "id", "isActive", "layout", "nuzlocke", "opacity", "ruleset", "scale", "showNickname", "showTypes", "title", "updatedAt", "widgetToken" FROM "Run";
DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";
CREATE UNIQUE INDEX "Run_widgetToken_key" ON "Run"("widgetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

