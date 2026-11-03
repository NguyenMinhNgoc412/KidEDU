import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ObjectStorageGateway, StoredObject } from "./object-storage.gateway";

@Injectable()
export class R2ObjectStorageAdapter implements ObjectStorageGateway {
  private client?: S3Client;
  private bucket?: string;

  private configuration(): { client: S3Client; bucket: string } {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("R2 storage configuration missing");
    }
    const url = new URL(endpoint);
    if (
      url.protocol !== "https:" &&
      !(
        process.env.APP_ENV === "local" &&
        ["localhost", "127.0.0.1", "minio"].includes(url.hostname)
      )
    ) {
      throw new Error("R2_ENDPOINT must use HTTPS");
    }
    this.client ??= new S3Client({
      endpoint,
      region: "auto",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey }
    });
    this.bucket ??= bucket;
    return { client: this.client, bucket: this.bucket };
  }

  private validateKey(key: string): void {
    if (!/^[a-z0-9][a-z0-9/_-]{0,511}$/.test(key) || key.includes("..") || key.includes("//")) {
      throw new Error("Invalid logical object key");
    }
  }

  async head(key: string): Promise<StoredObject | null> {
    this.validateKey(key);
    const { client, bucket } = this.configuration();
    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return {
        key,
        size: result.ContentLength ?? 0,
        contentType: result.ContentType,
        checksumSha256: result.ChecksumSHA256
      };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        (error.name === "NotFound" || error.name === "NoSuchKey")
      )
        return null;
      throw error;
    }
  }

  async authorizeUpload(key: string, contentType: string, expiresSeconds: number): Promise<string> {
    this.validateKey(key);
    this.validateExpiry(expiresSeconds);
    if (!/^(image|audio|video)\/[a-z0-9.+-]+$/.test(contentType))
      throw new Error("Invalid media type");
    const { client, bucket } = this.configuration();
    return getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresSeconds }
    );
  }

  async authorizeDownload(key: string, expiresSeconds: number): Promise<string> {
    this.validateKey(key);
    this.validateExpiry(expiresSeconds);
    const { client, bucket } = this.configuration();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: expiresSeconds
    });
  }

  async delete(key: string): Promise<void> {
    this.validateKey(key);
    const { client, bucket } = this.configuration();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  private validateExpiry(seconds: number): void {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 900) {
      throw new Error("Invalid signed URL lifetime");
    }
  }
}
