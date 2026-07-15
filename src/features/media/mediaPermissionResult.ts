export interface PermissionResultLike {
  granted: boolean;
  canAskAgain?: boolean;
}

export class MediaPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaPermissionError";
  }
}

export function assertPermissionGranted(
  permission: PermissionResultLike,
  deniedMessage: string,
  blockedMessage: string
): void {
  if (permission.granted) {
    return;
  }

  throw new MediaPermissionError(permission.canAskAgain === false ? blockedMessage : deniedMessage);
}
