import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../identity/auth.guard";
import { LearningService } from "./learning.service";

type AccountRequest = { accountId: string };

@Controller("children/:childId")
@UseGuards(AuthGuard)
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get("plan")
  plan(@Req() request: AccountRequest, @Param("childId") childId: string) {
    return this.learning.getPlan(request.accountId, childId);
  }

  @Put("plan")
  savePlan(
    @Req() request: AccountRequest,
    @Param("childId") childId: string,
    @Body() body: unknown
  ) {
    return this.learning.savePlan(request.accountId, childId, body);
  }

  @Post("events:batch")
  ingest(@Req() request: AccountRequest, @Param("childId") childId: string, @Body() body: unknown) {
    return this.learning.ingest(request.accountId, childId, body);
  }

  @Get("observations")
  observations(
    @Req() request: AccountRequest,
    @Param("childId") childId: string,
    @Query("cursor") cursor?: string
  ) {
    return this.learning.observations(request.accountId, childId, cursor);
  }
}
