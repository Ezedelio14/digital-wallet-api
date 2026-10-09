-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VIRTUAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'OVERDUE');

-- AlterEnum
ALTER TYPE "TxStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TxType" ADD VALUE 'INVOICE_PAYMENT';
ALTER TYPE "TxType" ADD VALUE 'CARD_PURCHASE';

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "cardNumberLast4" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "type" "CardType" NOT NULL DEFAULT 'VIRTUAL',
    "dailyLimit" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "payerEmail" TEXT,
    "payerId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_transactionId_key" ON "Invoice"("transactionId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
