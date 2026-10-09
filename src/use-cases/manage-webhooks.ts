import { prisma } from "../lib/prisma.js";
import crypto from "node:crypto";

export class ManageWebhooksUseCase {
  async createEndpoint(url: string) {
    const secret = crypto.randomBytes(32).toString("hex");
    const endpoint = await prisma.webhookEndpoint.create({
      data: { url, secret },
    });
    return { endpoint };
  }

  async listDeliveries() {
    return await prisma.webhookDelivery.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { webhookEndpoint: { select: { url: true } } },
    });
  }
}
