// src/http/controllers/card-controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ManageCardsUseCase } from "../../use-cases/manage-cards.js";

export const CardController = {
  async createCard(req: FastifyRequest, reply: FastifyReply) {
    const body = z
      .object({ dailyLimit: z.number().positive().optional() })
      .parse(req.body);
    const { card } = await new ManageCardsUseCase().createCard(
      req.user.sub,
      body.dailyLimit,
    );
    return reply.status(201).send(card);
  },

  async listCards(req: FastifyRequest, reply: FastifyReply) {
    const cards = await new ManageCardsUseCase().listCards(req.user.sub);
    return reply.send({ cards });
  },

  async toggleStatus(req: FastifyRequest, reply: FastifyReply) {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({ status: z.enum(["ACTIVE", "BLOCKED", "CANCELLED"]) })
      .parse(req.body);
    const { card } = await new ManageCardsUseCase().toggleCardStatus(
      req.user.sub,
      id,
      body.status,
    );
    return reply.send(card);
  },
};
