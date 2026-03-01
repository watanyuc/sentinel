-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "protectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "protectionDrawdown" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Account_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountNumber", "alertDrawdown", "alertEquityBelow", "alertMarginLevel", "alertOffline", "apiKey", "broker", "createdAt", "currency", "groupId", "id", "leverage", "name", "server", "updatedAt", "userId") SELECT "accountNumber", "alertDrawdown", "alertEquityBelow", "alertMarginLevel", "alertOffline", "apiKey", "broker", "createdAt", "currency", "groupId", "id", "leverage", "name", "server", "updatedAt", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_apiKey_key" ON "Account"("apiKey");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Account_apiKey_idx" ON "Account"("apiKey");
CREATE INDEX "Account_groupId_idx" ON "Account"("groupId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "reportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reportFrequency" TEXT NOT NULL DEFAULT 'daily',
    "reportTime" TEXT NOT NULL DEFAULT '20:00',
    "reportDay" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "telegramBotToken", "telegramChatId", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "telegramBotToken", "telegramChatId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
