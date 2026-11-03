export interface StoredObject {
  key: string;
  size: number;
  contentType?: string;
  checksumSha256?: string;
}

export interface ObjectStorageGateway {
  head(key: string): Promise<StoredObject | null>;
  authorizeUpload(key: string, contentType: string, expiresSeconds: number): Promise<string>;
  authorizeDownload(key: string, expiresSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export const OBJECT_STORAGE_GATEWAY = Symbol("OBJECT_STORAGE_GATEWAY");
