import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLocalBackend, type LocalObservation } from "@/features/localBackend/useLocalBackend";
import { ChildGenderField, type ChildGender } from "@/features/localBackend/ChildGenderField";
import { colors, spacing } from "@/theme";

const results = [
  { value: "independent", label: "Độc lập" },
  { value: "supported", label: "Có hỗ trợ" },
  { value: "not_yet", label: "Chưa thực hiện" },
  { value: "not_observed", label: "Chưa quan sát" }
] as const;

const subscriptionLabels: Record<string, string> = {
  none: "Chưa có gói",
  trial_active: "Đang dùng thử",
  active: "Đang hoạt động",
  grace_period: "Trong thời gian gia hạn",
  billing_retry: "Đang thử thanh toán lại",
  canceled_active: "Đã hủy, còn hiệu lực",
  expired: "Đã hết hạn",
  refunded: "Đã hoàn tiền",
  revoked: "Đã thu hồi",
  account_hold: "Tài khoản đang tạm giữ"
};

export default function LocalApiScreen() {
  const { session } = useAuth();
  const backend = useLocalBackend(session?.accessToken);
  const [childName, setChildName] = useState("");
  const [childGender, setChildGender] = useState<ChildGender | null>(null);
  const [missingGender, setMissingGender] = useState<ChildGender | null>(null);
  const [editName, setEditName] = useState("");
  const [editingObservation, setEditingObservation] = useState<string | null>(null);

  useEffect(() => {
    setChildName("");
    setChildGender(null);
    setMissingGender(null);
  }, [backend.accountId]);

  useEffect(() => {
    setEditName(backend.selected?.displayName ?? "");
    setEditingObservation(null);
    setMissingGender(null);
  }, [backend.selected?.id, backend.selected?.displayName]);

  if (!__DEV__) return <Redirect href="/parent" />;

  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="screenTitle">Dữ liệu gia đình trên server</AppText>
        <AppText color="muted">Phiên đăng nhập hiện tại được dùng để gọi app server.</AppText>

        <Card padding="lg" variant="form">
          <AppText variant="cardTitle">Kết nối backend</AppText>
          <TextField
            label="Địa chỉ API"
            value={backend.url}
            onChangeText={backend.setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <KidButton
            label="Tải dữ liệu"
            onPress={() => void backend.connect()}
            disabled={backend.busy || !backend.token.trim()}
            fullWidth
          />
          <AppText accessibilityLiveRegion="polite" color="muted">
            {backend.status}
          </AppText>
        </Card>

        {backend.accountId && backend.subscription ? (
          <>
            <Card padding="lg" variant="subtle">
              <AppText variant="cardTitle">Quyền học hiện tại</AppText>
              <AppText>
                {subscriptionLabels[backend.subscription.state] ?? backend.subscription.state}
              </AppText>
              <AppText color="muted">
                {backend.subscription.learningAllowed
                  ? "Server cho phép truy cập nội dung học theo gói."
                  : "Nội dung học theo gói chưa được mở. Dữ liệu gia đình vẫn có thể xem."}
              </AppText>
              {backend.subscription.accessUntil ? (
                <AppText color="muted">
                  Hiệu lực đến:{" "}
                  {new Date(backend.subscription.accessUntil).toLocaleDateString("vi-VN")}
                </AppText>
              ) : null}
            </Card>

            <AppText variant="cardTitle">Hồ sơ trẻ</AppText>
            {backend.children.length === 0 ? (
              <Card padding="lg" variant="input">
                <AppText>Chưa có hồ sơ trong tài khoản thử.</AppText>
                <TextField
                  label="Tên hiển thị giả"
                  value={childName}
                  onChangeText={setChildName}
                  maxLength={80}
                />
                <AppText color="muted" variant="caption">
                  Nút này ghi nhận đồng ý local-test-v1 và tạo dữ liệu thử. Chỉ nhập tên giả.
                </AppText>
                <ChildGenderField
                  value={childGender}
                  onChange={setChildGender}
                  disabled={backend.busy}
                />
                <KidButton
                  label="Đồng ý và tạo hồ sơ thử"
                  onPress={() => {
                    if (childGender) void backend.createTestChild(childName, childGender);
                  }}
                  disabled={backend.busy || !childName.trim() || childGender === null}
                  fullWidth
                />
              </Card>
            ) : (
              backend.children.map((child) => (
                <KidButton
                  key={child.id}
                  label={`Xem ${child.displayName}`}
                  onPress={() => void backend.openChild(child)}
                  disabled={backend.busy}
                  variant={backend.selected?.id === child.id ? "secondary" : "plain"}
                  fullWidth
                />
              ))
            )}

            {backend.selected ? (
              <Card padding="lg" variant="input">
                <AppText variant="cardTitle">{backend.selected.displayName}</AppText>
                {backend.selected.gender ? (
                  <AppText>
                    Giới tính: {backend.selected.gender === "boy" ? "Bé trai" : "Bé gái"}
                  </AppText>
                ) : (
                  <>
                    <AppText>Hồ sơ chưa khai báo giới tính. Quà đã nhận vẫn được giữ.</AppText>
                    <ChildGenderField
                      value={missingGender}
                      onChange={setMissingGender}
                      disabled={backend.busy}
                    />
                    <KidButton
                      label="Lưu giới tính"
                      fullWidth
                      disabled={backend.busy || missingGender === null}
                      onPress={() => {
                        if (missingGender) void backend.setMissingGender(missingGender);
                      }}
                    />
                  </>
                )}
                <TextField
                  label="Tên hiển thị"
                  value={editName}
                  onChangeText={setEditName}
                  maxLength={80}
                />
                <KidButton
                  label="Lưu tên"
                  onPress={() => void backend.renameChild(editName.trim())}
                  disabled={
                    backend.busy ||
                    !editName.trim() ||
                    editName.trim() === backend.selected.displayName
                  }
                  fullWidth
                  variant="plain"
                />
                <View style={styles.divider} />
                <AppText variant="cardTitle">Kế hoạch học</AppText>
                {backend.plan?.document ? (
                  <>
                    <AppText>
                      Phiên bản {backend.plan.revision} · {backend.plan.document.items.length} bài
                    </AppText>
                    <AppText color="muted">
                      Mục tiêu: {backend.plan.document.goalIds.join(", ") || "Chưa chọn"}
                    </AppText>
                  </>
                ) : (
                  <AppText color="muted">Chưa có kế hoạch học đã đồng bộ.</AppText>
                )}
              </Card>
            ) : null}

            {backend.selected ? (
              <Card padding="lg" variant="input">
                <AppText variant="cardTitle">Quan sát đã đồng bộ</AppText>
                {backend.observations.length === 0 ? (
                  <AppText color="muted">Chưa có quan sát.</AppText>
                ) : null}
                {backend.observations.map((item) => (
                  <ObservationRow
                    key={item.id}
                    item={item}
                    busy={backend.busy}
                    editing={editingObservation === item.id}
                    onEdit={() => setEditingObservation(item.id)}
                    onCancel={() => setEditingObservation(null)}
                    onCorrect={(result) => {
                      void backend.correctObservation(item.id, result);
                      setEditingObservation(null);
                    }}
                  />
                ))}
              </Card>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function ObservationRow({
  item,
  busy,
  editing,
  onEdit,
  onCancel,
  onCorrect
}: {
  item: LocalObservation;
  busy: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onCorrect: (result: (typeof results)[number]["value"]) => void;
}) {
  const label = results.find((result) => result.value === item.result)?.label ?? item.result;
  return (
    <View style={styles.observation}>
      <AppText variant="bodyStrong">
        {item.targetId} · {label}
      </AppText>
      <AppText color="muted" variant="caption">
        {item.activityType} · {new Date(item.occurredAt).toLocaleDateString("vi-VN")}
      </AppText>
      {item.supersededById ? <AppText color="muted">Đã được sửa bằng bản ghi mới.</AppText> : null}
      {item.supersedesId ? <AppText color="muted">Bản sửa của quan sát trước.</AppText> : null}
      {!item.supersededById && !editing ? (
        <KidButton
          label="Sửa quan sát"
          onPress={onEdit}
          disabled={busy}
          variant="plain"
          fullWidth
        />
      ) : null}
      {editing ? (
        <View style={styles.choiceList}>
          <AppText color="muted">Chọn kết quả đúng; bản gốc sẽ được giữ lại.</AppText>
          {results
            .filter((result) => result.value !== item.result)
            .map((result) => (
              <KidButton
                key={result.value}
                label={result.label}
                onPress={() => onCorrect(result.value)}
                disabled={busy}
                variant="plain"
                fullWidth
              />
            ))}
          <KidButton label="Hủy" onPress={onCancel} disabled={busy} variant="plain" fullWidth />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[16] },
  divider: { borderTopColor: colors.border, borderTopWidth: 1, marginVertical: spacing[4] },
  observation: {
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    gap: spacing[8],
    paddingTop: spacing[12]
  },
  choiceList: { gap: spacing[8] }
});
