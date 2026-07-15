import { assertPermissionGranted, MediaPermissionError } from "../mediaPermissionResult";

describe("mediaPermissions", () => {
  it("allows granted permissions", () => {
    expect(() =>
      assertPermissionGranted({ granted: true }, "Cần quyền.", "Mở Cài đặt để cấp quyền.")
    ).not.toThrow();
  });

  it("uses the denied message when permission can be requested again", () => {
    expect(() =>
      assertPermissionGranted({ granted: false, canAskAgain: true }, "Cần quyền.", "Mở Cài đặt để cấp quyền.")
    ).toThrow("Cần quyền.");
  });

  it("uses the blocked message when permission cannot be requested again", () => {
    expect(() =>
      assertPermissionGranted({ granted: false, canAskAgain: false }, "Cần quyền.", "Mở Cài đặt để cấp quyền.")
    ).toThrow(MediaPermissionError);
    expect(() =>
      assertPermissionGranted({ granted: false, canAskAgain: false }, "Cần quyền.", "Mở Cài đặt để cấp quyền.")
    ).toThrow("Mở Cài đặt để cấp quyền.");
  });
});
