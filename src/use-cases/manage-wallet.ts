import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";

export class ManageWalletUseCase {
  async getBalance(userId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    return {
      walletId: wallet.id,
      balance: Number(wallet.balance),
      currency: wallet.currency,
    };
  }

  async getHistory(userId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    const entries = await prisma.entry.findMany({
      where: { walletId: wallet.id },
      include: { transaction: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return entries.map((e) => ({
      id: e.id,
      transactionId: e.transactionId,
      type: e.type,
      amount: Number(e.amount),
      transactionType: e.transaction.type,
      date: e.createdAt,
    }));
  }

  async reconcileLedger(userId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    const entries = await prisma.entry.findMany({
      where: { walletId: wallet.id },
    });

    let calculatedBalance = 0;
    for (const entry of entries) {
      const amount = Number(entry.amount);
      calculatedBalance += entry.type === "CREDIT" ? amount : -amount;
    }

    const currentCachedBalance = Number(wallet.balance);
    const isBalanced = calculatedBalance === currentCachedBalance;

    return {
      walletId: wallet.id,
      cachedBalance: currentCachedBalance,
      reconciledLedgerBalance: calculatedBalance,
      isBalanced,
    };
  }
}
