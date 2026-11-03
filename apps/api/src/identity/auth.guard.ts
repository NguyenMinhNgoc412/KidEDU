import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import { IdentityService } from "./identity.service";

type AuthenticatedRequest = {
  headers: { authorization?: string };
  accountId?: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly identity: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? "");
    if (!match?.[1]) throw new UnauthorizedException("Cần đăng nhập để tiếp tục.");
    request.accountId = await this.identity.resolveAccount(match[1]);
    return true;
  }
}
