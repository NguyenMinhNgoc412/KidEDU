import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { LogController } from "fastify";

import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./http/api-exception.filter";

export async function createApp() {
  if (process.env.APP_ENV === "production" || process.env.APP_ENV === "staging") {
    for (const name of [
      "DATABASE_POOL_URL",
      "SUPABASE_JWKS_URL",
      "SUPABASE_JWT_ISSUER",
      "SUPABASE_JWT_AUDIENCE",
      "CHILD_PROFILE_CONSENT_VERSION"
    ]) {
      if (!process.env[name]) throw new Error(`Missing runtime configuration: ${name}`);
    }
  }
  const adapter = new FastifyAdapter({
    bodyLimit: 1024 * 1024,
    logController: new LogController({ disableRequestLogging: true }),
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['x-api-key']",
          "res.headers['set-cookie']"
        ],
        censor: "[REDACTED]"
      }
    }
  });
  adapter.getInstance().addHook("onRequest", (request, reply, done) => {
    reply.header("x-request-id", request.id);
    done();
  });
  adapter.getInstance().addHook("onResponse", (request, reply, done) => {
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        route: request.routeOptions.url ?? "unmatched",
        statusCode: reply.statusCode
      },
      "request completed"
    );
    done();
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true
  });
  if (process.env.APP_ENV === "local") {
    app.enableCors({
      origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    });
  }
  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix("v1", { exclude: ["health/live", "health/startup", "health/ready"] });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

if (require.main === module) {
  void createApp()
    .then(async (app) => {
      const port = Number(process.env.PORT ?? 3000);
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
      await app.listen(port, "0.0.0.0");
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `API startup failed: ${error instanceof Error ? error.message : "unknown error"}\n`
      );
      process.exitCode = 1;
    });
}
