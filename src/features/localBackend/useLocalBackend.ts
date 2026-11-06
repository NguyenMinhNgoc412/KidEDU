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
  const accountEpoch = useRef(0);

  useEffect(() => {
    if (token !== authToken) changeToken(authToken);
  }, [authToken]);

  function client() {
    return createLocalApiClient(url, token);
  }

  function clearAccount() {
    accountEpoch.current += 1;
    setBusy(false);
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

  async function run(action: (isCurrent: () => boolean) => Promise<void>) {
    const epoch = accountEpoch.current;
    const isCurrent = () => accountEpoch.current === epoch;
    setBusy(true);
    try {
      await action(isCurrent);
    } catch (error) {
      if (!isCurrent()) return;
      setStatus(messageFor(error));
      if (error instanceof ApiRequestError && error.status === 401) clearAccount();
    } finally {
      if (isCurrent()) setBusy(false);
    }
  }

  async function connect() {
    clearAccount();
    await run(async (isCurrent) => {
      const api = client();
      const me = await api.getMe();
      const [nextSubscription, rows] = await Promise.all([
        api.getSubscription(),
        api.listChildren()
      ]);
      if (!isCurrent()) return;
      setAccountId(me.id);
      setSubscription(nextSubscription);
      setChildren(rows);
      setStatus(`Đã kết nối. Có ${rows.length} hồ sơ trẻ.`);
    });
  }

  async function createTestChild(displayName: string, gender: NonNullable<LocalChild["gender"]>) {
    await run(async (isCurrent) => {
      const api = client();
      const families = await api.listFamilies();
      if (!isCurrent()) return;
      const familyId =
        families.find((family) => family.role === "owner")?.id ?? (await api.createFamily()).id;
      await api.grantChildProfileConsent("local-test-v1");
      if (!isCurrent()) return;
      const child = await api.createChild(familyId, displayName.trim(), gender);
      const rows = await api.listChildren();
      if (!isCurrent()) return;
      setChildren(rows);
      setStatus(`Đã tạo hồ sơ thử ${child.displayName}.`);
    });
  }

  async function openChild(child: LocalChild) {
    accountEpoch.current += 1;
    setSelected(child);
    setPlan(null);
    setObservations([]);
    await run(async (isCurrent) => {
      const api = client();
      const [nextPlan, page] = await Promise.all([
        api.getPlan(child.id),
        api.listObservations(child.id)
      ]);
      if (!isCurrent()) return;
      setPlan(nextPlan);
      setObservations(page.observations);
      setStatus(`Đã tải dữ liệu của ${child.displayName}.`);
    });
  }

  async function renameChild(displayName: string) {
    if (!selected) return;
    await run(async (isCurrent) => {
      const updated = await client().updateChild(selected.id, selected.version, { displayName });
      if (!isCurrent()) return;
      setSelected(updated);
      setChildren((current) => current.map((child) => (child.id === updated.id ? updated : child)));
      setStatus("Đã cập nhật tên hiển thị.");
    });
  }

  async function setMissingGender(gender: NonNullable<LocalChild["gender"]>) {
    if (!selected || selected.gender != null) return;
    await run(async (isCurrent) => {
      const updated = await client().updateChild(selected.id, selected.version, { gender });
      if (!isCurrent()) return;
      setSelected(updated);
      setChildren((current) => current.map((child) => (child.id === updated.id ? updated : child)));
      setStatus("Đã lưu giới tính do phụ huynh chọn.");
    });
  }

  async function correctObservation(observationId: string, result: ObservationResult) {
    if (!selected) return;
    await run(async (isCurrent) => {
      const pendingKey = `${observationId}:${result}`;
      const eventId =
        pendingCorrections.current.get(pendingKey) ??
        `correction-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      pendingCorrections.current.set(pendingKey, eventId);
      await client().supersedeObservation(observationId, eventId, result, null);
      if (!isCurrent()) return;
      pendingCorrections.current.delete(pendingKey);
      const page = await client().listObservations(selected.id);
      if (!isCurrent()) return;
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
    setMissingGender,
    correctObservation
  };
}
