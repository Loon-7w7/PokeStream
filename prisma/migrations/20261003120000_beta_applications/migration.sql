-- CreateTable
CREATE TABLE "BetaApplication" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "platform" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "BetaApplication_status_createdAt_idx" ON "BetaApplication"("status", "createdAt");
