import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
      return reply
        .status(400)
        .send({ message: "Validation error.", issues: error.format() });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    console.error(error);
    return reply.status(500).send({ message: "Internal server error." });
  });
}
