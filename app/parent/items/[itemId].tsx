import { useLocalSearchParams, useRouter } from "expo-router";
import { Save, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import {
  useArchiveLearningItemMutation,
  useCategoriesQuery,
  useLearningItemQuery,
  useUpdateLearningItemMutation
} from "@/data/queries";
import type { EntityStatus, LearningStatus } from "@/data/types";
import { PersonalizedMediaSection } from "@/features/media/PersonalizedMediaSection";
import { colors, spacing } from "@/theme";

export default function ParentItemDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId: string }>();
  const itemId = params.itemId;
  const itemQuery = useLearningItemQuery(itemId);
  const categoriesQuery = useCategoriesQuery();
  const updateMutation = useUpdateLearningItemMutation(itemId);
  const archiveMutation = useArchiveLearningItemMutation();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<EntityStatus>("active");
  const [learningStatus, setLearningStatus] = useState<LearningStatus>("new");

  useEffect(() => {
    if (itemQuery.data) {
      setTitle(itemQuery.data.title);
      setCategoryId(itemQuery.data.categoryId);
      setNote(itemQuery.data.note ?? "");
      setStatus(itemQuery.data.status);
      setLearningStatus(itemQuery.data.learningStatus);
    }
  }, [itemQuery.data]);

  function save() {
    if (!title.trim() || !categoryId) {
      return;
    }

    updateMutation.mutate(
      {
        title,
        categoryId,
        note,
        status,
        learningStatus
      },
      {
        onSuccess: () => router.back()
      }
    );
  }

  function confirmArchive() {
    Alert.alert("Xóa thẻ học", "Thẻ sẽ không còn xuất hiện trong danh sách học hoặc bộ học.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          archiveMutation.mutate(itemId, {
            onSuccess: () => router.replace("/parent/items")
          })
      }
    ]);
  }

  if (itemQuery.isLoading) {
    return (
      <Screen>
        <StateMessage title="Đang tải thẻ" />
      </Screen>
    );
  }

  if (!itemQuery.data) {
    return (
      <Screen>
        <StateMessage title="Không tìm thấy thẻ" />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        title="Sửa thẻ"
        action={<KidButton label="Quay lại" onPress={() => router.back()} variant="plain" />}
      />
      <Card padding="lg" style={styles.form} variant="form">
        <TextField
          label="Từ vựng"
          onChangeText={setTitle}
          placeholder="Từ hoặc cụm từ"
          value={title}
        />
        <TextField
          label="Ghi chú"
          multiline
          onChangeText={setNote}
          placeholder="Ghi chú"
          value={note}
        />

        <AppText variant="fieldLabel">Chủ đề</AppText>
        <View style={styles.choiceWrap}>
          {(categoriesQuery.data ?? []).map((category) => (
            <KidButton
              key={category.id}
              label={category.name}
              onPress={() => setCategoryId(category.id)}
              variant={categoryId === category.id ? "primary" : "plain"}
            />
          ))}
        </View>

        <AppText variant="fieldLabel">Hiển thị</AppText>
        <View style={styles.choiceWrap}>
          <KidButton
            label="Đang hiển thị"
            onPress={() => setStatus("active")}
            variant={status === "active" ? "primary" : "plain"}
          />
          <KidButton
            label="Tạm ẩn"
            onPress={() => setStatus("hidden")}
            variant={status === "hidden" ? "primary" : "plain"}
          />
        </View>

        <AppText variant="fieldLabel">Trạng thái học</AppText>
        <View style={styles.choiceWrap}>
          <KidButton
            label="Mới"
            onPress={() => setLearningStatus("new")}
            variant={learningStatus === "new" ? "primary" : "plain"}
          />
          <KidButton
            label="Đang luyện"
            onPress={() => setLearningStatus("practicing")}
            variant={learningStatus === "practicing" ? "primary" : "plain"}
          />
          <KidButton
            label="Đã quen"
            onPress={() => setLearningStatus("familiar")}
            variant={learningStatus === "familiar" ? "primary" : "plain"}
          />
        </View>

        <PersonalizedMediaSection item={itemQuery.data} />

        <View style={styles.actions}>
          <KidButton
            disabled={updateMutation.isPending}
            icon={<Save color={colors.onPrimary} size={22} />}
            label="Lưu"
            onPress={save}
          />
          <KidButton
            icon={<Trash2 color={colors.onPrimary} size={22} />}
            label="Xóa"
            onPress={confirmArchive}
            variant="danger"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[12]
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8]
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[10]
  }
});
