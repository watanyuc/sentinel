-- AlterTable
ALTER TABLE "User" ADD COLUMN "telegramBotToken" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "server" TEXT NOT NULL DEFAULT 'Unknown',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leverage" INTEGER NOT NULL DEFAULT 100,
    "userId" TEXT NOT NULL,
    "alertDrawdown" REAL,
    "alertEquityBelow" REAL,
    "alertMarginLevel" REAL,
    "alertOffline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountNumber", "apiKey", "broker", "createdAt", "currency", "id", "leverage", "name", "server", "updatedAt", "userId") SELECT "accountNumber", "apiKey", "broker", "createdAt", "currency", "id", "leverage", "name", "server", "updatedAt", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_apiKey_key" ON "Account"("apiKey");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Account_apiKey_idx" ON "Account"("apiKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
