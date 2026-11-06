import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { PrismaService } from "./database/prisma.service";
import { FamilyController } from "./families/family.controller";
import { FamilyRepository } from "./families/family.repository";
import { FamilyService } from "./families/family.service";
import { AccountRepository } from "./identity/account.repository";
import { AuthGuard } from "./identity/auth.guard";
import { IDENTITY_GATEWAY } from "./identity/identity.gateway";
import { IdentityService } from "./identity/identity.service";
import { MeController } from "./identity/me.controller";
import { SupabaseIdentityAdapter } from "./identity/supabase-identity.adapter";
import { LearningController } from "./learning/learning.controller";
import { LearningService } from "./learning/learning.service";
import { ObservationController } from "./learning/observation.controller";
import { EntitlementRepository } from "./entitlement/entitlement.repository";
import { SubscriptionController } from "./entitlement/subscription.controller";
import { SubscriptionService } from "./entitlement/subscription.service";
import { OBJECT_STORAGE_GATEWAY } from "./storage/object-storage.gateway";
import { R2ObjectStorageAdapter } from "./storage/r2-object-storage.adapter";
import { PracticeController } from "./practice/practice.controller";
import { PracticeService } from "./practice/practice.service";
import { DailyGameController } from "./daily-games/daily-game.controller";
import { DailyGameService } from "./daily-games/daily-game.service";
import { DailyGameRepository } from "./daily-games/daily-game.repository";
import { DailyRewardRepository } from "./daily-games/daily-reward.repository";
import { LocalDailyContentGateway } from "./daily-games/local-daily-content.gateway";
import {
  DAILY_CONTENT_GATEWAY,
  UnavailableDailyContentGateway
} from "./daily-games/daily-content.gateway";

@Module({
  controllers: [
    HealthController,
    DailyGameController,
    PracticeController,
    MeController,
    FamilyController,
    LearningController,
    ObservationController,
    SubscriptionController
  ],
  providers: [
    PrismaService,
    DailyGameService,
    DailyGameRepository,
    DailyRewardRepository,
    {
      provide: DAILY_CONTENT_GATEWAY,
      useFactory: () =>
        process.env.APP_ENV === "local" && process.env.C50_LOCAL_DAILY_FIXTURE === "1"
          ? new LocalDailyContentGateway()
          : new UnavailableDailyContentGateway()
    },
    PracticeService,
    HealthService,
    AccountRepository,
    FamilyRepository,
    FamilyService,
    LearningService,
    EntitlementRepository,
    SubscriptionService,
    IdentityService,
    AuthGuard,
    { provide: IDENTITY_GATEWAY, useClass: SupabaseIdentityAdapter },
    { provide: OBJECT_STORAGE_GATEWAY, useClass: R2ObjectStorageAdapter }
  ]
})
export class AppModule {}
