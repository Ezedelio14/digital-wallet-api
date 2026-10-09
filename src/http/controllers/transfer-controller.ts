import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ManageTransfersUseCase } from "../../use-cases/manage-transfers.js";

export const TransferController = {
  async execute(req: FastifyRequest, reply: FastifyReply) {
    const body = z
      .object({
        receiverWalletId: z.string().uuid(),
        amount: z.number().positive(),
      })
      .parse(req.body);

    const result = await new ManageTransfersUseCase().execute(
      req.user.sub,
      body.receiverWalletId,
      body.amount,
      req.idempotencyKey as string,
    );

    const responsePayload = { success: true, ...result };

    await prisma.idempotencyRecord.create({
      data: {
        key: req.idempotencyKey as string,
        path: req.url,
        method: req.method,
        responseCode: 201,
        responseBody: responsePayload,
      },
    });

    return reply.status(201).send(responsePayload);
  },
};
