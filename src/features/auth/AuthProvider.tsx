import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { AppState } from "react-native";
import { RequestTimeoutError } from "@/api/requestWithTimeout";

import { scheduleAccessExpiry } from "@/features/entitlement/scheduleAccessExpiry";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useSelectedChildStore } from "@/features/parent/selectedChild";

import type { AuthSession } from "./authGateway";
import { createAuthGateway } from "./createAuthGateway";

interface AuthContextValue {
  ready: boolean;
  session: AuthSession | null;
  accessTokenValid: boolean;
  error: string | null;
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  refreshSession(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [gateway] = useState(createAuthGateway);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accessTokenValid, setAccessTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(null);
  const revisionRef = useRef(0);
  const refreshingRef = useRef<Promise<void> | null>(null);
  const queryClient = useQueryClient();

  const applySession = useCallback(
    (next: AuthSession | null) => {
      const previous = sessionRef.current;
      if (previous?.accountId !== next?.accountId) {
        queryClient.clear();
        useParentGateStore.getState().lock();
        useSelectedChildStore.getState().clear();
      }
      revisionRef.current += 1;
      sessionRef.current = next;
      setSession(next);
      setAccessTokenValid(Boolean(next && Date.parse(next.expiresAt) > Date.now()));
    },
    [queryClient]
  );

  const refreshSession = useCallback((): Promise<void> => {
    if (refreshingRef.current) return refreshingRef.current;
    if (!gateway || !sessionRef.current) return Promise.resolve();
    const revision = revisionRef.current;
    const operation = (async () => {
      try {
        const next = await gateway.refresh();
        if (revisionRef.current !== revision) return;
        if (next && !(Date.parse(next.expiresAt) > Date.now())) {
          throw new Error("REFRESH_DID_NOT_RETURN_VALID_ACCESS");
        }
        applySession(next);
        setError(null);
      } catch {
        if (revisionRef.current !== revision) return;
        // Keep the refresh credential. Expired access stays blocked until retry succeeds.
        if (Date.parse(sessionRef.current?.expiresAt ?? "") <= Date.now())
          setAccessTokenValid(false);
        setError("Chưa khôi phục được phiên. Kiểm tra kết nối rồi thử lại.");
      }
    })();
    refreshingRef.current = operation;
    void operation.finally(() => {
      if (refreshingRef.current === operation) refreshingRef.current = null;
    });
    return operation;
  }, [gateway, applySession]);

  useEffect(() => {
    let active = true;
    const initialRevision = revisionRef.current;
    const unsubscribe = gateway?.subscribe((next) => {
      if (active) {
        applySession(next);
        setError(null);
      }
    });
    void gateway
      ?.restore()
      .then(
        (restored) => {
          if (active && revisionRef.current === initialRevision) applySession(restored);
        },
        () => {
          if (active) setError("Chưa khôi phục được phiên. Hãy kiểm tra kết nối.");
        }
      )
      .finally(() => {
        if (active) setReady(true);
      });
    if (!gateway) setReady(true);
    return () => {
      active = false;
      revisionRef.current += 1;
      unsubscribe?.();
    };
  }, [gateway, applySession]);

  useEffect(() => {
    if (!session) return;
    return scheduleAccessExpiry(Date.parse(session.expiresAt) - Date.now(), () => {
      setAccessTokenValid(false);
      void refreshSession();
    });
  }, [session, refreshSession]);

  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && sessionRef.current) {
        if (Date.parse(sessionRef.current.expiresAt) <= Date.now()) {
          setAccessTokenValid(false);
          void refreshSession();
        }
      }
    });
    return () => listener.remove();
  }, [refreshSession]);

  async function signIn(email: string, password: string): Promise<boolean> {
    setError(null);
    if (!gateway) {
      setError("Chưa cấu hình dịch vụ đăng nhập.");
      return false;
    }
    const revision = ++revisionRef.current;
    try {
      const next = await gateway.signIn(email.trim().toLowerCase(), password);
      if (revisionRef.current !== revision) return false;
      queryClient.clear();
      useParentGateStore.getState().lock();
      applySession(next);
      return true;
    } catch (caught) {
      if (revisionRef.current !== revision) return false;
      setError(
        caught instanceof Error && caught.message === "INVALID_CREDENTIALS"
          ? "Email hoặc mật khẩu không đúng."
          : caught instanceof RequestTimeoutError
            ? "Máy chủ chưa phản hồi. Kiểm tra kết nối rồi thử đăng nhập lại."
            : "Không thể đăng nhập. Kiểm tra kết nối và thử lại."
      );
      return false;
    }
  }

  async function signOut(): Promise<void> {
    // Invalidate in-flight work and close account-bound UI before network cleanup.
    applySession(null);
    queryClient.clear();
    useParentGateStore.getState().lock();
    setError(null);
    await gateway?.signOut().catch(() => undefined);
  }

  return (
    <AuthContext.Provider
      value={{ ready, session, accessTokenValid, error, signIn, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be inside AuthProvider");
  return value;
}
