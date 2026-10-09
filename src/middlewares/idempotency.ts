import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function checkIdempotency(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  if (!idempotencyKey) {
    return reply
      .status(400)
      .send({ message: "Header Idempotency-Key is required." });
  }

  const existingRecord = await prisma.idempotencyRecord.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingRecord) {
    return reply
      .status(existingRecord.responseCode)
      .send(existingRecord.responseBody);
  }

  req.idempotencyKey = idempotencyKey;
}
