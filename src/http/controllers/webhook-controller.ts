import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ManageWebhooksUseCase } from "../../use-cases/manage-webhooks.js";

export const WebhookController = {
  async createEndpoint(req: FastifyRequest, reply: FastifyReply) {
    const body = z.object({ url: z.string().url() }).parse(req.body);
    const { endpoint } = await new ManageWebhooksUseCase().createEndpoint(
      body.url,
    );
    return reply.status(201).send(endpoint);
  },

  async listDeliveries(_: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new ManageWebhooksUseCase().listDeliveries());
  },
};
