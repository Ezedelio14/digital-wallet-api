// src/http/controllers/invoice-controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ManageInvoicesUseCase } from "../../use-cases/manage-invoices.js";

export const InvoiceController = {
  async createInvoice(req: FastifyRequest, reply: FastifyReply) {
    const body = z
      .object({
        amount: z.number().positive(),
        description: z.string().optional(),
        payerEmail: z.string().email().optional(),
      })
      .parse(req.body);

    const { invoice } = await new ManageInvoicesUseCase().createInvoice(
      req.user.sub,
      body.amount,
      body.description,
      body.payerEmail,
    );
    return reply.status(201).send(invoice);
  },

  async listInvoices(req: FastifyRequest, reply: FastifyReply) {
    const invoices = await new ManageInvoicesUseCase().listUserInvoices(
      req.user.sub,
    );
    return reply.send({ invoices });
  },

  async payInvoice(req: FastifyRequest, reply: FastifyReply) {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const result = await new ManageInvoicesUseCase().payInvoice(
      req.user.sub,
      id,
      req.idempotencyKey as string,
    );

    const responsePayload = { success: true, ...result };

    await prisma.idempotencyRecord.create({
      data: {
        key: req.idempotencyKey as string,
        path: req.url,
        method: req.method,
        responseCode: 200,
        responseBody: responsePayload,
      },
    });

    return reply.send(responsePayload);
  },
};
