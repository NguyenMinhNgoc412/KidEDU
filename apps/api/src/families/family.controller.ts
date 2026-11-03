import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../identity/auth.guard";
import { FamilyService } from "./family.service";

type AccountRequest = { accountId: string };

@Controller()
@UseGuards(AuthGuard)
export class FamilyController {
  constructor(private readonly families: FamilyService) {}

  @Post("families")
  createFamily(@Req() request: AccountRequest) {
    return this.families.createFamily(request.accountId);
  }

  @Get("families")
  familiesForAccount(@Req() request: AccountRequest) {
    return this.families.listFamilies(request.accountId);
  }

  @Get("consents")
  consents(@Req() request: AccountRequest) {
    return this.families.listConsents(request.accountId);
  }

  @Post("consents")
  recordConsent(@Req() request: AccountRequest, @Body() body: unknown) {
    return this.families.recordConsent(request.accountId, body);
  }

  @Get("children")
  children(@Req() request: AccountRequest) {
    return this.families.listChildren(request.accountId);
  }

  @Post("children")
  createChild(@Req() request: AccountRequest, @Body() body: unknown) {
    return this.families.createChild(request.accountId, body);
  }

  @Get("children/:childId")
  child(@Req() request: AccountRequest, @Param("childId") childId: string) {
    return this.families.getChild(request.accountId, childId);
  }

  @Patch("children/:childId")
  updateChild(
    @Req() request: AccountRequest,
    @Param("childId") childId: string,
    @Body() body: unknown
  ) {
    return this.families.updateChild(request.accountId, childId, body);
  }
}
