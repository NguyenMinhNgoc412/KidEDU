import { requestRecordingPermissionsAsync } from "expo-audio";
import * as ImagePicker from "expo-image-picker";

import { assertPermissionGranted } from "./mediaPermissionResult";

export { assertPermissionGranted, MediaPermissionError } from "./mediaPermissionResult";

export async function ensureMediaLibraryPermission(): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  assertPermissionGranted(
    permission,
    "Ứng dụng cần quyền đọc thư viện ảnh/video để lưu media cá nhân.",
    "KidEDU chưa có quyền đọc thư viện ảnh/video. Hãy mở Cài đặt của thiết bị để cấp quyền."
  );
}

export async function ensureMouthVideoCapturePermission(): Promise<void> {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  assertPermissionGranted(
    cameraPermission,
    "Ứng dụng cần quyền camera để quay video khẩu hình.",
    "KidEDU chưa có quyền camera. Hãy mở Cài đặt của thiết bị để cấp quyền."
  );

  const microphonePermission = await requestRecordingPermissionsAsync();
  assertPermissionGranted(
    microphonePermission,
    "Ứng dụng cần quyền micro để ghi âm khi quay video khẩu hình.",
    "KidEDU chưa có quyền micro. Hãy mở Cài đặt của thiết bị để cấp quyền."
  );
}

export async function ensureAudioRecordingPermission(): Promise<void> {
  const permission = await requestRecordingPermissionsAsync();
  assertPermissionGranted(
    permission,
    "Ứng dụng cần quyền micro để thu âm phát âm.",
    "KidEDU chưa có quyền micro. Hãy mở Cài đặt của thiết bị để cấp quyền."
  );
}
