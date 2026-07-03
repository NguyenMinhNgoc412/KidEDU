import { useLocalSearchParams, useRouter } from "expo-router";
import { Save, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

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
import { colors } from "@/theme";

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
      <SectionHeader title="Sửa thẻ" action={<KidButton label="Quay lại" onPress={() => router.back()} variant="plain" />} />
      <View style={styles.form}>
        <TextInput
          onChangeText={setTitle}
          placeholder="Từ hoặc cụm từ"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <TextInput
          multiline
          onChangeText={setNote}
          placeholder="Ghi chú"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.note]}
          value={note}
        />

        <Text style={styles.label}>Chủ đề</Text>
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

        <Text style={styles.label}>Hiển thị</Text>
        <View style={styles.choiceWrap}>
          <KidButton label="Đang hiển thị" onPress={() => setStatus("active")} variant={status === "active" ? "primary" : "plain"} />
          <KidButton label="Tạm ẩn" onPress={() => setStatus("hidden")} variant={status === "hidden" ? "primary" : "plain"} />
        </View>

        <Text style={styles.label}>Trạng thái học</Text>
        <View style={styles.choiceWrap}>
          <KidButton label="Mới" onPress={() => setLearningStatus("new")} variant={learningStatus === "new" ? "primary" : "plain"} />
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
          <KidButton disabled={updateMutation.isPending} icon={<Save color="#FFFFFF" size={22} />} label="Lưu" onPress={save} />
          <KidButton icon={<Trash2 color="#FFFFFF" size={22} />} label="Xóa" onPress={confirmArchive} variant="danger" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 12
  },
  note: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actions: {
    flexDirection: "row",
    gap: 10
  }
});
