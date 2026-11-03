import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "./database/prisma.service";

@Injectable()
export class HealthService {
  private lastReadyAt = 0;
  private inFlight?: Promise<void>;

  constructor(private readonly prisma: PrismaService) {}

  async ready() {
    if (!process.env.DATABASE_POOL_URL) return { status: "ok" };
    if (Date.now() - this.lastReadyAt < 5000) return { status: "ok" };
    this.inFlight ??= this.prisma.$queryRaw`SELECT 1`
      .then(() => {
        this.lastReadyAt = Date.now();
      })
      .finally(() => {
        this.inFlight = undefined;
      });
    try {
      await this.inFlight;
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
