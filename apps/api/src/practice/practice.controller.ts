import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../identity/auth.guard";
import { PracticeService } from "./practice.service";
type AccountRequest = { accountId: string };

@Controller("children/:childId/practice")
@UseGuards(AuthGuard)
export class PracticeController {
  constructor(private readonly practice: PracticeService) {}
  @Get("catalog") catalog(@Req() req: AccountRequest, @Param("childId") childId: string) {
    return this.practice.catalog(req.accountId, childId);
  }
  @Get("plan") plan(@Req() req: AccountRequest, @Param("childId") childId: string) {
    return this.practice.plan(req.accountId, childId);
  }
  @Put("plan") savePlan(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Body() body: unknown
  ) {
    return this.practice.savePlan(req.accountId, childId, body);
  }
  @Post("lessons/:lessonId/prepare") prepare(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("lessonId") lessonId: string,
    @Body() body: unknown
  ) {
    return this.practice.prepare(req.accountId, childId, lessonId, body);
  }
  @Get("checkpoints") checkpoints(@Req() req: AccountRequest, @Param("childId") childId: string) {
    return this.practice.checkpoints(req.accountId, childId);
  }
  @Put("checkpoints/:sessionId") saveCheckpoint(
    @Req() req: AccountRequest,
    @Param("childId") childId: string,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown
  ) {
    return this.practice.saveCheckpoint(req.accountId, childId, sessionId, body);
  }
}
