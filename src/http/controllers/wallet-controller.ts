import type { FastifyRequest, FastifyReply } from "fastify";
import { ManageWalletUseCase } from "../../use-cases/manage-wallet.js";

export const WalletController = {
  async getBalance(req: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new ManageWalletUseCase().getBalance(req.user.sub));
  },

  async getHistory(req: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      history: await new ManageWalletUseCase().getHistory(req.user.sub),
    });
  },

  async reconcile(req: FastifyRequest, reply: FastifyReply) {
    return reply.send(
      await new ManageWalletUseCase().reconcileLedger(req.user.sub),
    );
  },
};
