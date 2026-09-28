-- AlterTable
ALTER TABLE "Run" ADD COLUMN "ownerEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Run_ownerEmail_key" ON "Run"("ownerEmail");
