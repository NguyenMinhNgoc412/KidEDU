import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import { getWebMediaObjectUrl } from "@/features/media/webMediaStore";
import { mediaUriAllowedForAccount } from "@/features/media/accountMediaScope";
import type { LocalActivityAsset } from "./activityMedia";

/** Export is a parent action, independent of learning entitlement; no automatic upload. */
export async function exportPracticeMedia(
  asset: LocalActivityAsset,
  accountId: string,
  childId: string
) {
  if (
    asset.accountId !== accountId ||
    asset.childId !== childId ||
    !mediaUriAllowedForAccount(asset.uri, accountId)
  )
    throw new Error("MEDIA_NOT_OWNED");
  if (Platform.OS === "web") {
    const uri = await getWebMediaObjectUrl(asset.uri);
    if (!uri) throw new Error("MEDIA_UNAVAILABLE");
    try {
      const anchor = document.createElement("a");
      anchor.href = uri;
      anchor.download = `kidedu-family-${asset.type}.${asset.mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin"}`;
      anchor.click();
    } finally {
      setTimeout(() => URL.revokeObjectURL(uri), 1000);
    }
  } else {
    if (!asset.uri.startsWith("file://") || !(await Sharing.isAvailableAsync()))
      throw new Error("EXPORT_UNAVAILABLE");
    await Sharing.shareAsync(asset.uri, {
      mimeType: asset.mimeType,
      dialogTitle: "Xuất media gia đình"
    });
  }
}
