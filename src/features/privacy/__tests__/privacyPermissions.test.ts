jest.mock("expo-image-picker", () => ({
  getCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn()
}));

jest.mock("expo-audio", () => ({
  getRecordingPermissionsAsync: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn()
}));

jest.mock("react-native", () => ({
  Linking: {
    openSettings: jest.fn()
  },
  Platform: {
    OS: "android"
  }
}));

jest.mock("react-native-web/dist/exports/Linking", () => ({
  __esModule: true,
  default: {
    openSettings: jest.fn()
  }
}));

jest.mock("react-native-web/dist/exports/Platform", () => ({
  __esModule: true,
  default: {
    OS: "android"
  }
}));

import * as Audio from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { Linking, Platform } from "react-native";
import {
  getPrivacyPermissionSnapshot,
  mapExpoPermissionStatus,
  openAppPrivacySettings
} from "../privacyPermissions";
import type { ExpoPermissionLike, PrivacyPermissionStatus } from "../privacyPermissions";

type ExpoApiPermissionResponse = Awaited<
  ReturnType<typeof ImagePicker.getMediaLibraryPermissionsAsync>
>;

const getCameraPermissions = jest.mocked(ImagePicker.getCameraPermissionsAsync);
const getMediaLibraryPermissions = jest.mocked(ImagePicker.getMediaLibraryPermissionsAsync);
const getRecordingPermissions = jest.mocked(Audio.getRecordingPermissionsAsync);
const requestCameraPermissions = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
const requestMediaLibraryPermissions = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const requestRecordingPermissions = jest.mocked(Audio.requestRecordingPermissionsAsync);
const openSettings = jest.mocked(Linking.openSettings);

describe("privacy permission mapper", () => {
  it.each<{
    expected: PrivacyPermissionStatus;
    permission: ExpoPermissionLike | null;
  }>([
    { permission: permission("granted", { granted: true }), expected: "granted" },
    {
      permission: permission("granted", {
        accessPrivileges: "limited",
        granted: true
      }),
      expected: "limited"
    },
    { permission: permission("denied", { canAskAgain: true }), expected: "denied" },
    { permission: permission("denied", { canAskAgain: false }), expected: "blocked" },
    { permission: permission("undetermined"), expected: "undetermined" },
    { permission: permission("unexpected"), expected: "unavailable" },
    { permission: null, expected: "unavailable" }
  ])("maps Expo permission state to $expected", ({ permission: input, expected }) => {
    expect(mapExpoPermissionStatus(input)).toBe(expected);
  });
});

describe("getPrivacyPermissionSnapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform("android");
  });

  it("reads camera, microphone and limited media-library access without requesting them", async () => {
    getCameraPermissions.mockResolvedValue(permission("granted", { granted: true }));
    getRecordingPermissions.mockResolvedValue(permission("denied", { canAskAgain: false }));
    getMediaLibraryPermissions.mockResolvedValue(
      permission("granted", { accessPrivileges: "limited", granted: true })
    );

    await expect(getPrivacyPermissionSnapshot()).resolves.toEqual({
      camera: "granted",
      microphone: "blocked",
      mediaLibrary: "limited"
    });
    expect(getCameraPermissions).toHaveBeenCalledTimes(1);
    expect(getRecordingPermissions).toHaveBeenCalledTimes(1);
    expect(getMediaLibraryPermissions).toHaveBeenCalledTimes(1);
    expect(requestCameraPermissions).not.toHaveBeenCalled();
    expect(requestRecordingPermissions).not.toHaveBeenCalled();
    expect(requestMediaLibraryPermissions).not.toHaveBeenCalled();
  });

  it("isolates native API failures to the affected permission", async () => {
    getCameraPermissions.mockRejectedValue(new Error("camera unavailable"));
    getRecordingPermissions.mockResolvedValue(permission("undetermined"));
    getMediaLibraryPermissions.mockResolvedValue(
      permission("granted", { accessPrivileges: "all", granted: true })
    );

    await expect(getPrivacyPermissionSnapshot()).resolves.toEqual({
      camera: "unavailable",
      microphone: "undetermined",
      mediaLibrary: "granted"
    });
  });

  it("returns unavailable on web without invoking native permission APIs", async () => {
    setPlatform("web");

    await expect(getPrivacyPermissionSnapshot()).resolves.toEqual({
      camera: "unavailable",
      microphone: "unavailable",
      mediaLibrary: "unavailable"
    });
    expect(getCameraPermissions).not.toHaveBeenCalled();
    expect(getRecordingPermissions).not.toHaveBeenCalled();
    expect(getMediaLibraryPermissions).not.toHaveBeenCalled();
  });
});

describe("openAppPrivacySettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform("android");
  });

  it("opens native app settings and reports success", async () => {
    openSettings.mockResolvedValue(undefined);

    await expect(openAppPrivacySettings()).resolves.toBe(true);
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("returns false when native settings cannot be opened", async () => {
    openSettings.mockRejectedValue(new Error("settings unavailable"));

    await expect(openAppPrivacySettings()).resolves.toBe(false);
  });

  it("does not try to open native settings on web", async () => {
    setPlatform("web");

    await expect(openAppPrivacySettings()).resolves.toBe(false);
    expect(openSettings).not.toHaveBeenCalled();
  });
});

function permission(
  status: string,
  overrides: Partial<ExpoApiPermissionResponse> = {}
): ExpoApiPermissionResponse {
  return {
    status: status as ExpoApiPermissionResponse["status"],
    expires: "never",
    granted: false,
    canAskAgain: true,
    ...overrides
  };
}

function setPlatform(os: string): void {
  (Platform as unknown as { OS: string }).OS = os;
}
