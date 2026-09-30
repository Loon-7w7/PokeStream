-- CreateTable
CREATE TABLE "Access" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "invited" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccessSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT false
);
