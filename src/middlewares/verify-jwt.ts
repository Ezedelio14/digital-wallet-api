import type { FastifyRequest, FastifyReply } from "fastify";

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: "Unauthorized access token." });
  }
}
