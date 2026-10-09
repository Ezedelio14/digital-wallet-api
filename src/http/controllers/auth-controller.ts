import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ManageAuthUseCase } from "../../use-cases/manage-auth.js";

export const AuthController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const body = z
      .object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(req.body);
    const { user } = await new ManageAuthUseCase().register(body);
    return reply
      .status(201)
      .send({ id: user.id, name: user.name, email: user.email });
  },

  async authenticate(req: FastifyRequest, reply: FastifyReply) {
    const body = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);
    const { user, refreshToken } = await new ManageAuthUseCase().authenticate(
      body,
    );

    const accessToken = await reply.jwtSign(
      { sub: user.id },
      { sign: { expiresIn: "15m" } },
    );
    return reply.send({ accessToken, refreshToken });
  },

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const body = z.object({ refreshToken: z.string() }).parse(req.body);
    const { user } = await new ManageAuthUseCase().refresh(body.refreshToken);

    const accessToken = await reply.jwtSign(
      { sub: user.id },
      { sign: { expiresIn: "15m" } },
    );
    return reply.send({ accessToken });
  },
};
