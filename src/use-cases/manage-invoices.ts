import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { WebhookService } from "../services/webhook-service.js";

export class ManageInvoicesUseCase {
  async createInvoice(
    creatorId: string,
    amount: number,
    description?: string,
    payerEmail?: string,
  ) {
    if (amount <= 0)
      throw new AppError("Amount must be greater than zero.", 400);

    let payerId: string | null = null;
    if (payerEmail) {
      const payerUser = await prisma.user.findUnique({
        where: { email: payerEmail },
      });
      if (payerUser) payerId = payerUser.id;
    }

    const invoice = await prisma.invoice.create({
      data: {
        creatorId,
        payerEmail,
        payerId,
        amount,
        description,
        status: "PENDING",
      },
    });

    return { invoice };
  }

  async listUserInvoices(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [{ creatorId: userId }, { payerId: userId }],
      },
      include: {
        creator: { select: { name: true, email: true } },
        payer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return invoices;
  }

  async payInvoice(
    payerUserId: string,
    invoiceId: string,
    idempotencyKey: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new AppError("Invoice not found.", 404);
      if (invoice.status !== "PENDING")
        throw new AppError(
          `Invoice is already ${invoice.status.toLowerCase()}.`,
          400,
        );
      if (invoice.creatorId === payerUserId)
        throw new AppError("You cannot pay your own invoice.", 400);

      const amount = Number(invoice.amount);

      // Payer's wallet
      const payerWallet = await tx.wallet.findFirst({
        where: { userId: payerUserId, isActive: true },
      });
      if (!payerWallet) throw new AppError("Payer wallet not found.", 404);
      if (Number(payerWallet.balance) < amount)
        throw new AppError("Insufficient funds to pay invoice.", 400);

      // Creator's wallet
      const creatorWallet = await tx.wallet.findFirst({
        where: { userId: invoice.creatorId, isActive: true },
      });
      if (!creatorWallet) throw new AppError("Creator wallet not found.", 404);

      // Double-Entry Transaction
      const transaction = await tx.transaction.create({
        data: {
          type: "INVOICE_PAYMENT",
          status: "COMPLETED",
          amount,
          idempotencyKey,
          entries: {
            create: [
              { walletId: payerWallet.id, type: "DEBIT", amount },
              { walletId: creatorWallet.id, type: "CREDIT", amount },
            ],
          },
        },
      });

      // Update balances
      await tx.wallet.update({
        where: { id: payerWallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.wallet.update({
        where: { id: creatorWallet.id },
        data: { balance: { increment: amount } },
      });

      // Update invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          payerId: payerUserId,
          transactionId: transaction.id,
        },
      });

      WebhookService.dispatchEvent("INVOICE_PAID", {
        invoiceId: invoice.id,
        amount,
        payerUserId,
      }).catch(console.error);

      return { invoice: updatedInvoice, transactionId: transaction.id };
    });
  }
}
