import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { KidEduDataProvider } from "@/data/KidEduDataProvider";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { LearningAccessProvider } from "@/features/entitlement/LearningAccessProvider";
import { ParentGateLifecycle } from "@/features/parent/ParentGateLifecycle";
import { LessonRuntimeProvider } from "@/features/lessonRuntime/LessonRuntimeProvider";
import { DailyGameRuntimeProvider } from "@/features/dailyGames/DailyGameRuntimeProvider";
import { MediaAccountContext } from "@/features/media/MediaAccountBoundary";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ParentGateLifecycle />
        <LearningAccessProvider>
          <AuthenticatedDataProvider>{children}</AuthenticatedDataProvider>
        </LearningAccessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return session ? (
    <MediaAccountContext.Provider value={session.accountId}>
      <KidEduDataProvider key={session.accountId} accountId={session.accountId}>
        <DailyGameRuntimeProvider>
          <LessonRuntimeProvider>{children}</LessonRuntimeProvider>
        </DailyGameRuntimeProvider>
      </KidEduDataProvider>
    </MediaAccountContext.Provider>
  ) : (
    children
  );
}
