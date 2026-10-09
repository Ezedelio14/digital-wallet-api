import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import { setupSwagger } from "./lib/swagger.js";
import { setupErrorHandler } from "./errors/handler.js";
import { appRoutes } from "./http/routes.js";

export const app = fastify();

app.register(fastifyCors, { origin: true });

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "fallback-secret",
});

setupErrorHandler(app);

await setupSwagger(app);
await app.register(appRoutes);
