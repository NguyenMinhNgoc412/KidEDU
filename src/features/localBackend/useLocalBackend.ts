import { useEffect, useRef, useState } from "react";

import { ApiRequestError, createLocalApiClient } from "@/api/localClient";

type Client = ReturnType<typeof createLocalApiClient>;
export type LocalChild = Awaited<ReturnType<Client["listChildren"]>>[number];
export type LocalSubscription = Awaited<ReturnType<Client["getSubscription"]>>;
export type LocalPlan = Awaited<ReturnType<Client["getPlan"]>>;
export type LocalObservation = Awaited<
  ReturnType<Client["listObservations"]>
>["observations"][number];
type ObservationResult = Parameters<Client["supersedeObservation"]>[2];

function messageFor(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.";
    if (error.status === 409) return "Dữ liệu đã đổi trên server. Tải lại rồi thử tiếp.";
    return `API trả ${error.code} (${error.status}).`;
  }
  return "Không kết nối được. Kiểm tra địa chỉ API, JWT và mạng local.";
}

export function useLocalBackend(authToken = "") {
  const [url, setUrl] = useState(process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000");
  const [token, setToken] = useState(authToken);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Chưa kết nối.");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<LocalSubscription | null>(null);
  const [children, setChildren] = useState<LocalChild[]>([]);
  const [selected, setSelected] = useState<LocalChild | null>(null);
  const [plan, setPlan] = useState<LocalPlan | null>(null);
  const [observations, setObservations] = useState<LocalObservation[]>([]);
  const pendingCorrections = useRef(new Map<string, string>());

  useEffect(() => {
    if (token !== authToken) changeToken(authToken);
  }, [authToken]);

  function client() {
    return createLocalApiClient(url, token);
  }

  function clearAccount() {
    pendingCorrections.current.clear();
    setAccountId(null);
    setSubscription(null);
    setChildren([]);
    setSelected(null);
    setPlan(null);
    setObservations([]);
  }

  function changeToken(value: string) {
    clearAccount();
    setToken(value);
    setStatus(value ? "JWT đã đổi. Kết nối lại để tải dữ liệu." : "Chưa kết nối.");
  }

  function changeUrl(value: string) {
    clearAccount();
    setUrl(value);
    setStatus("Địa chỉ API đã đổi. Kết nối lại để tải dữ liệu.");
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setStatus(messageFor(error));
      if (error instanceof ApiRequestError && error.status === 401) clearAccount();
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    clearAccount();
    await run(async () => {
      const api = client();
      const me = await api.getMe();
      const [nextSubscription, rows] = await Promise.all([
        api.getSubscription(),
        api.listChildren()
      ]);
      setAccountId(me.id);
      setSubscription(nextSubscription);
      setChildren(rows);
      setStatus(`Đã kết nối. Có ${rows.length} hồ sơ trẻ.`);
    });
  }

  async function createTestChild(displayName: string) {
    await run(async () => {
      const api = client();
      const families = await api.listFamilies();
      const familyId =
        families.find((family) => family.role === "owner")?.id ?? (await api.createFamily()).id;
      await api.grantChildProfileConsent("local-test-v1");
      const child = await api.createChild(familyId, displayName.trim());
      setChildren(await api.listChildren());
      setStatus(`Đã tạo hồ sơ thử ${child.displayName}.`);
    });
  }

  async function openChild(child: LocalChild) {
    setSelected(child);
    setPlan(null);
    setObservations([]);
    await run(async () => {
      const api = client();
      const [nextPlan, page] = await Promise.all([
        api.getPlan(child.id),
        api.listObservations(child.id)
      ]);
      setPlan(nextPlan);
      setObservations(page.observations);
      setStatus(`Đã tải dữ liệu của ${child.displayName}.`);
    });
  }

  async function renameChild(displayName: string) {
    if (!selected) return;
    await run(async () => {
      const updated = await client().updateChild(selected.id, selected.version, { displayName });
      setSelected(updated);
      setChildren((current) => current.map((child) => (child.id === updated.id ? updated : child)));
      setStatus("Đã cập nhật tên hiển thị.");
    });
  }

  async function correctObservation(observationId: string, result: ObservationResult) {
    if (!selected) return;
    await run(async () => {
      const pendingKey = `${observationId}:${result}`;
      const eventId =
        pendingCorrections.current.get(pendingKey) ??
        `correction-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      pendingCorrections.current.set(pendingKey, eventId);
      await client().supersedeObservation(observationId, eventId, result, null);
      pendingCorrections.current.delete(pendingKey);
      const page = await client().listObservations(selected.id);
      setObservations(page.observations);
      setStatus("Đã lưu bản sửa quan sát. Bản gốc được giữ lại.");
    });
  }

  return {
    url,
    setUrl: changeUrl,
    token,
    changeToken,
    busy,
    status,
    accountId,
    subscription,
    children,
    selected,
    plan,
    observations,
    connect,
    createTestChild,
    openChild,
    renameChild,
    correctObservation
  };
}
