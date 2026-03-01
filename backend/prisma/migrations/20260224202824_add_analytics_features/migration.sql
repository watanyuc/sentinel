-- CreateTable
CREATE TABLE "AccountGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "equity" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "drawdown" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquitySnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClosedTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "ticket" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lots" REAL NOT NULL,
    "openPrice" REAL NOT NULL,
    "closePrice" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "openTime" DATETIME NOT NULL,
    "closeTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sl" REAL NOT NULL DEFAULT 0,
    "tp" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ClosedTrade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "groupId" TEXT,
    "alertDrawdown" REAL,
    "alertEquityBelow" REAL,
    "alertMarginLevel" REAL,
    "alertOffline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Account_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountNumber", "alertDrawdown", "alertEquityBelow", "alertMarginLevel", "alertOffline", "apiKey", "broker", "createdAt", "currency", "id", "leverage", "name", "server", "updatedAt", "userId") SELECT "accountNumber", "alertDrawdown", "alertEquityBelow", "alertMarginLevel", "alertOffline", "apiKey", "broker", "createdAt", "currency", "id", "leverage", "name", "server", "updatedAt", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_apiKey_key" ON "Account"("apiKey");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Account_apiKey_idx" ON "Account"("apiKey");
CREATE INDEX "Account_groupId_idx" ON "Account"("groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AccountGroup_userId_idx" ON "AccountGroup"("userId");

-- CreateIndex
CREATE INDEX "EquitySnapshot_accountId_timestamp_idx" ON "EquitySnapshot"("accountId", "timestamp");

-- CreateIndex
CREATE INDEX "EquitySnapshot_accountId_idx" ON "EquitySnapshot"("accountId");

-- CreateIndex
CREATE INDEX "ClosedTrade_accountId_closeTime_idx" ON "ClosedTrade"("accountId", "closeTime");

-- CreateIndex
CREATE INDEX "ClosedTrade_accountId_idx" ON "ClosedTrade"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedTrade_accountId_ticket_key" ON "ClosedTrade"("accountId", "ticket");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_sentAt_idx" ON "NotificationLog"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");
