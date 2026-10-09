import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export class ManageAuthUseCase {
  async register(data: { name: string; email: string; password: string }) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExists) throw new AppError("Email already registered.");

    const passwordHash = await bcrypt.hash(data.password, 6);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name: data.name, email: data.email, passwordHash },
      });
      await tx.wallet.create({
        data: { userId: newUser.id, currency: "USD" },
      });
      return newUser;
    });

    return { user };
  }

  async authenticate(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError("Invalid credentials.", 401);
    }

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return { user, refreshToken };
  }

  async refresh(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError("Refresh token expired or invalid.", 401);
    }

    return { user: storedToken.user };
  }
}
