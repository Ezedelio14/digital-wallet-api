import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { WebhookService } from "../services/webhook-service.js";

export class ManageTransfersUseCase {
  async execute(
    senderUserId: string,
    receiverWalletId: string,
    amount: number,
    idempotencyKey: string,
  ) {
    if (amount <= 0)
      throw new AppError("Amount must be greater than zero.", 400);

    const transactionResult = await prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findFirst({
        where: { userId: senderUserId, isActive: true },
      });
      if (!senderWallet) throw new AppError("Sender wallet not found.", 404);

      const receiverWallet = await tx.wallet.findUnique({
        where: { id: receiverWalletId, isActive: true },
      });
      if (!receiverWallet)
        throw new AppError("Receiver wallet not found.", 404);
      if (senderWallet.id === receiverWallet.id)
        throw new AppError("Cannot transfer to yourself.", 400);

      if (Number(senderWallet.balance) < amount)
        throw new AppError("Insufficient funds.", 400);

      // Double-Entry Ledger Creation
      const transaction = await tx.transaction.create({
        data: {
          type: "TRANSFER",
          status: "COMPLETED",
          amount,
          idempotencyKey,
          entries: {
            create: [
              { walletId: senderWallet.id, type: "DEBIT", amount },
              { walletId: receiverWallet.id, type: "CREDIT", amount },
            ],
          },
        },
      });

      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: amount } },
      });

      return transaction;
    });

    // Async Webhook Trigger
    WebhookService.dispatchEvent("TRANSFER_COMPLETED", {
      transactionId: transactionResult.id,
      amount,
      idempotencyKey,
    }).catch(console.error);

    return { transactionId: transactionResult.id, amount };
  }
}
