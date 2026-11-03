import { Controller, Get, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../identity/auth.guard";
import { SubscriptionService } from "./subscription.service";

@Controller("subscription")
@UseGuards(AuthGuard)
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get()
  current(@Req() request: { accountId: string }) {
    return this.subscription.current(request.accountId);
  }
}
