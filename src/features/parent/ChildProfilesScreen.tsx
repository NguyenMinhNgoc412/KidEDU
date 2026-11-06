import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { KidButton } from "@/components/KidButton";
import { TextField } from "@/components/Input";
import { ApiRequestError } from "@/api/localClient";
import { ChildGenderField } from "@/features/localBackend/ChildGenderField";
import { useChildProfiles, type ChildProfile } from "./useChildProfiles";

export function ChildProfilesScreen() {
  const profiles = useChildProfiles();
  const router = useRouter();
  return (
    <Screen>
      <AppText variant="screenTitle">Hồ sơ của con</AppText>
      {profiles.loading ? (
        <AppText>Đang mở hồ sơ…</AppText>
      ) : profiles.error ? (
        <Card>
          <AppText>Chưa tải được hồ sơ. Vui lòng thử lại.</AppText>
          <KidButton label="Thử lại" onPress={() => void profiles.refresh()} />
        </Card>
      ) : (
        <>
          {profiles.children.length > 1 ? (
            <Card>
              <AppText variant="cardTitle">Chọn hồ sơ</AppText>
              {profiles.children.map((child) => (
                <KidButton
                  key={child.id}
                  label={child.displayName}
                  selected={profiles.selected?.id === child.id}
                  variant="plain"
                  onPress={() => profiles.select(child.id)}
                />
              ))}
            </Card>
          ) : null}
          {profiles.selected ? (
            <ProfileForm
              key={`${profiles.selected.id}:${profiles.selected.version}`}
              child={profiles.selected}
              save={profiles.save}
              refresh={profiles.refresh}
            />
          ) : (
            <AppText>Chưa có hồ sơ của con trong tài khoản.</AppText>
          )}
        </>
      )}
      <KidButton label="Về Phụ huynh" variant="plain" onPress={() => router.replace("/parent")} />
    </Screen>
  );
}

function ProfileForm({
  child,
  save,
  refresh
}: {
  child: ChildProfile;
  save: ReturnType<typeof useChildProfiles>["save"];
  refresh: ReturnType<typeof useChildProfiles>["refresh"];
}) {
  const [name, setName] = useState(child.displayName);
  const [gender, setGender] = useState(child.gender ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const active = useRef(true);
  useEffect(
    () => () => {
      active.current = false;
    },
    []
  );
  const changed = name.trim() !== child.displayName || gender !== (child.gender ?? null);
  return (
    <Card variant="form">
      <TextField
        label="Tên gọi của con"
        accessibilityLabel="Tên gọi của con"
        value={name}
        onChangeText={setName}
        maxLength={80}
        editable={!busy}
      />
      {child.gender ? (
        <AppText>Giới tính: {child.gender === "boy" ? "Bé trai" : "Bé gái"}</AppText>
      ) : (
        <ChildGenderField value={gender} onChange={setGender} disabled={busy} />
      )}
      {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
      {conflict ? (
        <KidButton label="Tải hồ sơ mới nhất" onPress={() => void refresh()} />
      ) : (
        <KidButton
          label={busy ? "Đang lưu…" : "Lưu hồ sơ"}
          disabled={busy || !changed || !name.trim() || !gender}
          onPress={() => {
            if (busy || !gender) return;
            setBusy(true);
            setMessage("");
            void save(child, name, gender)
              .then(() => {
                if (active.current) setMessage("Đã lưu hồ sơ.");
              })
              .catch((error: unknown) => {
                if (!active.current) return;
                const stale = error instanceof ApiRequestError && error.status === 409;
                setConflict(stale);
                setMessage(
                  stale
                    ? "Hồ sơ vừa được cập nhật trên thiết bị khác. Tải lại trước khi sửa tiếp."
                    : "Chưa lưu được hồ sơ. Thông tin đang nhập vẫn được giữ để thử lại."
                );
              })
              .finally(() => {
                if (active.current) setBusy(false);
              });
          }}
        />
      )}
    </Card>
  );
}
