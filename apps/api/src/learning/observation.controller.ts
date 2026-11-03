import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../identity/auth.guard";
import { LearningService } from "./learning.service";

@Controller("observations")
@UseGuards(AuthGuard)
export class ObservationController {
  constructor(private readonly learning: LearningService) {}

  @Post(":observationId::supersede")
  supersede(
    @Req() request: { accountId: string },
    @Param() params: Record<string, string>,
    @Body() body: unknown
  ) {
    const rawId = params["observationId::supersede"];
    const observationId = rawId?.endsWith(":supersede") ? rawId.slice(0, -10) : "";
    return this.learning.supersedeObservation(request.accountId, observationId, body);
  }
}
