import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { verifyJWT } from "../middlewares/verify-jwt.js";
import { checkIdempotency } from "../middlewares/idempotency.js";

import { AuthController } from "./controllers/auth-controller.js";
import { WalletController } from "./controllers/wallet-controller.js";
import { TransferController } from "./controllers/transfer-controller.js";
import { WebhookController } from "./controllers/webhook-controller.js";
import { CardController } from "./controllers/card-controller.js";
import { InvoiceController } from "./controllers/invoice-controller.js";

export async function appRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // --- AUTHENTICATION ---
  typedApp.post(
    "/auth/register",
    { schema: { tags: ["Auth"] } },
    AuthController.register,
  );
  typedApp.post(
    "/auth/login",
    { schema: { tags: ["Auth"] } },
    AuthController.authenticate,
  );
  typedApp.post(
    "/auth/refresh",
    { schema: { tags: ["Auth"] } },
    AuthController.refresh,
  );

  // --- WALLET ---
  typedApp.get(
    "/wallet/balance",
    {
      onRequest: [verifyJWT],
      schema: { tags: ["Wallet"], security: [{ bearerAuth: [] }] },
    },
    WalletController.getBalance,
  );
  typedApp.get(
    "/wallet/history",
    {
      onRequest: [verifyJWT],
      schema: { tags: ["Wallet"], security: [{ bearerAuth: [] }] },
    },
    WalletController.getHistory,
  );
  typedApp.get(
    "/wallet/reconcile",
    {
      onRequest: [verifyJWT],
      schema: { tags: ["Wallet"], security: [{ bearerAuth: [] }] },
    },
    WalletController.reconcile,
  );

  // --- TRANSFERS ---
  typedApp.post(
    "/transfers",
    {
      onRequest: [verifyJWT, checkIdempotency],
      schema: {
        tags: ["Transfers"],
        security: [{ bearerAuth: [] }],
        headers: z.object({ "idempotency-key": z.string() }),
        body: z.object({
          receiverWalletId: z.string().uuid(),
          amount: z.number().positive(),
        }),
      },
    },
    TransferController.execute,
  );

  // --- VIRTUAL CARDS (NOVO) ---
  typedApp.post(
    "/cards",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["Virtual Cards"],
        summary: "Issue a new virtual card",
        security: [{ bearerAuth: [] }],
        body: z.object({ dailyLimit: z.number().positive().optional() }),
      },
    },
    CardController.createCard,
  );

  typedApp.get(
    "/cards",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["Virtual Cards"],
        summary: "List user virtual cards",
        security: [{ bearerAuth: [] }],
      },
    },
    CardController.listCards,
  );

  typedApp.patch(
    "/cards/:id/status",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["Virtual Cards"],
        summary: "Update card status (ACTIVE, BLOCKED, CANCELLED)",
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ status: z.enum(["ACTIVE", "BLOCKED", "CANCELLED"]) }),
      },
    },
    CardController.toggleStatus,
  );

  // --- INVOICES / PAYMENT REQUESTS (NOVO) ---
  typedApp.post(
    "/invoices",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["Invoices"],
        summary: "Create a payment request/invoice",
        security: [{ bearerAuth: [] }],
        body: z.object({
          amount: z.number().positive(),
          description: z.string().optional(),
          payerEmail: z.string().email().optional(),
        }),
      },
    },
    InvoiceController.createInvoice,
  );

  typedApp.get(
    "/invoices",
    {
      onRequest: [verifyJWT],
      schema: {
        tags: ["Invoices"],
        summary: "List user invoices",
        security: [{ bearerAuth: [] }],
      },
    },
    InvoiceController.listInvoices,
  );

  typedApp.post(
    "/invoices/:id/pay",
    {
      onRequest: [verifyJWT, checkIdempotency],
      schema: {
        tags: ["Invoices"],
        summary: "Pay an invoice using wallet balance (Idempotent)",
        security: [{ bearerAuth: [] }],
        headers: z.object({ "idempotency-key": z.string() }),
        params: z.object({ id: z.string().uuid() }),
      },
    },
    InvoiceController.payInvoice,
  );

  // --- WEBHOOKS ---
  typedApp.post(
    "/webhooks/endpoints",
    {
      onRequest: [verifyJWT],
      schema: { tags: ["Webhooks"], security: [{ bearerAuth: [] }] },
    },
    WebhookController.createEndpoint,
  );
  typedApp.get(
    "/webhooks/deliveries",
    {
      onRequest: [verifyJWT],
      schema: { tags: ["Webhooks"], security: [{ bearerAuth: [] }] },
    },
    WebhookController.listDeliveries,
  );
}
