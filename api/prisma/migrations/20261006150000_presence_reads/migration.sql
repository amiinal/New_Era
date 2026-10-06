-- AlterTable
ALTER TABLE "Account" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ThreadRead" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreadRead_threadId_accountId_key" ON "ThreadRead"("threadId", "accountId");
