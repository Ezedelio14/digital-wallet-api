import crypto from "node:crypto";
import axios from "axios";
import { prisma } from "../lib/prisma.js";

export class WebhookService {
  static async dispatchEvent(event: string, payload: Record<string, unknown>) {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true },
    });

    for (const endpoint of endpoints) {
      const dataToSign = JSON.stringify({
        event,
        payload,
        timestamp: new Date().toISOString(),
      });
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(dataToSign)
        .digest("hex");

      try {
        const response = await axios.post(endpoint.url, dataToSign, {
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Signature": signature,
          },
          timeout: 5000,
        });

        await prisma.webhookDelivery.create({
          data: {
            webhookEndpointId: endpoint.id,
            payload: JSON.parse(dataToSign),
            responseCode: response.status,
            status: "SUCCESS",
          },
        });
      } catch (err: any) {
        await prisma.webhookDelivery.create({
          data: {
            webhookEndpointId: endpoint.id,
            payload: JSON.parse(dataToSign),
            responseCode: err.response?.status || 500,
            status: "FAILED",
          },
        });
      }
    }
  }
}
