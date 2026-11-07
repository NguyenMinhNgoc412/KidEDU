import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../identity/auth.guard";
import { DailyGameService } from "./daily-game.service";
type AccountRequest = { accountId: string };

@Controller("children/:childId/daily-game")
@UseGuards(AuthGuard)
export class DailyGameController {
  constructor(private readonly games: DailyGameService) {}
  @Get("inventory")
  inventory(@Req() req: AccountRequest, @Param("childId") childId: string) {
    return this.games.inventory(req.accountId, childId);
  }
  @Get()
  status(@Req() req: AccountRequest, @Param("childId") childId: string) {
    return this.games.status(req.accountId, childId);
  }
  @Post("start")
  start(@Req() req: AccountRequest, @Param("childId") childId: string, @Body() body: unknown) {
    return this.games.start(req.accountId, childId, body);
  }
  @Post("local-test/restart")
  restartLocalTest(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Body() body: unknown
  ) {
    return this.games.restartLocalTest(req.accountId, childId, body);
  }
  @Put(":sessionId/checkpoint")
  checkpoint(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown
  ) {
    return this.games.checkpoint(req.accountId, childId, sessionId, body);
  }
  @Post(":sessionId/reward/reserve")
  reserve(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown
  ) {
    return this.games.reserve(req.accountId, childId, sessionId, body);
  }
  @Get(":sessionId/reward")
  rewardState(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("sessionId") sessionId: string
  ) {
    return this.games.rewardState(req.accountId, childId, sessionId);
  }
  @Post(":sessionId/reward/claim")
  claim(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown
  ) {
    return this.games.claim(req.accountId, childId, sessionId, body);
  }
}
