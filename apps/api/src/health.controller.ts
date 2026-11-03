import { Controller, Get } from "@nestjs/common";

import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("live")
  live() {
    return { status: "ok" };
  }

  @Get("startup")
  startup() {
    return { status: "ok" };
  }

  @Get("ready")
  ready() {
    return this.health.ready();
  }
}
