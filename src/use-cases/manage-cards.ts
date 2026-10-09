import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";

export class ManageCardsUseCase {
  async createCard(userId: string, dailyLimit?: number) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    const cardNumberLast4 = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 4; // Validade de 4 anos

    const card = await prisma.card.create({
      data: {
        walletId: wallet.id,
        cardNumberLast4,
        expiryMonth,
        expiryYear,
        dailyLimit,
        status: "ACTIVE",
        type: "VIRTUAL",
      },
    });

    return { card };
  }

  async listCards(userId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    return await prisma.card.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async toggleCardStatus(
    userId: string,
    cardId: string,
    status: "ACTIVE" | "BLOCKED" | "CANCELLED",
  ) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isActive: true },
    });
    if (!wallet) throw new AppError("Wallet not found.", 404);

    const card = await prisma.card.findFirst({
      where: { id: cardId, walletId: wallet.id },
    });
    if (!card) throw new AppError("Card not found.", 404);

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status },
    });

    return { card: updatedCard };
  }
}
