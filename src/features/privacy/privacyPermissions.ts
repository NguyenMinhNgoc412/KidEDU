import { getRecordingPermissionsAsync } from "expo-audio";
import { getCameraPermissionsAsync, getMediaLibraryPermissionsAsync } from "expo-image-picker";
import { Linking, Platform } from "react-native";

export type PrivacyPermissionStatus =
  "granted" | "limited" | "denied" | "blocked" | "undetermined" | "unavailable";

export interface PrivacyPermissionSnapshot {
  camera: PrivacyPermissionStatus;
  microphone: PrivacyPermissionStatus;
  mediaLibrary: PrivacyPermissionStatus;
}

export interface ExpoPermissionLike {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
  accessPrivileges?: "all" | "limited" | "none";
}

const unavailableSnapshot: PrivacyPermissionSnapshot = Object.freeze({
  camera: "unavailable",
  microphone: "unavailable",
  mediaLibrary: "unavailable"
});

/** Maps an Expo permission response without requesting or mutating permission state. */
export function mapExpoPermissionStatus(
  permission: ExpoPermissionLike | null | undefined
): PrivacyPermissionStatus {
  if (!permission) {
    return "unavailable";
  }

  if (permission.status === "granted" || permission.granted) {
    return permission.accessPrivileges === "limited" ? "limited" : "granted";
  }

  if (permission.status === "undetermined") {
    return "undetermined";
  }

  if (permission.status === "denied") {
    return permission.canAskAgain ? "denied" : "blocked";
  }

  return "unavailable";
}

/**
 * Reads existing permission state only. It never opens a prompt or requests a permission.
 * A failure from one native API does not hide the status of the other permissions.
 */
export async function getPrivacyPermissionSnapshot(): Promise<PrivacyPermissionSnapshot> {
  if (!isNativeMobilePlatform()) {
    return { ...unavailableSnapshot };
  }

  const [camera, microphone, mediaLibrary] = await Promise.all([
    readPermission(() => getCameraPermissionsAsync()),
    readPermission(() => getRecordingPermissionsAsync()),
    readPermission(() => getMediaLibraryPermissionsAsync())
  ]);

  return { camera, microphone, mediaLibrary };
}

/** Opens this app's operating-system settings without throwing into the UI layer. */
export async function openAppPrivacySettings(): Promise<boolean> {
  if (!isNativeMobilePlatform()) {
    return false;
  }

  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

async function readPermission(
  read: () => Promise<ExpoPermissionLike>
): Promise<PrivacyPermissionStatus> {
  try {
    return mapExpoPermissionStatus(await read());
  } catch {
    return "unavailable";
  }
}

function isNativeMobilePlatform(): boolean {
  return Platform.OS === "android" || Platform.OS === "ios";
}
