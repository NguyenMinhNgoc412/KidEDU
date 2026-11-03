const webMediaScheme = "web-media://";
const databaseName = "kidedu-web-media";
const storeName = "files";

interface WebMediaRecord {
  id: string;
  blob: Blob;
  createdAt: number;
  mimeType: string | null;
  accountId?: string;
}

export async function assignWebMediaToAccount(uri: string, accountId: string): Promise<string> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId) ||
    !isWebMediaUri(uri)
  )
    throw new Error("INVALID_MEDIA_NAMESPACE");
  const database = await openWebMediaDatabase();
  try {
    const record = await runStoreRequest<WebMediaRecord | undefined>(
      database,
      "readonly",
      (store) => store.get(uri.slice(webMediaScheme.length))
    );
    if (!record || (record.accountId && record.accountId !== accountId.toLowerCase()))
      throw new Error("MEDIA_NOT_OWNED");
    const id = `${accountId.toLowerCase()}/web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await runStoreRequest(database, "readwrite", (store) =>
      store.put({ ...record, id, accountId: accountId.toLowerCase() })
    );
    return `${webMediaScheme}${id}`;
  } finally {
    database.close();
  }
}

export function isWebMediaUri(uri: string | null | undefined): uri is string {
  return Boolean(uri?.startsWith(webMediaScheme));
}

export async function saveWebMediaBlob(blob: Blob, mimeType?: string | null): Promise<string> {
  const database = await openWebMediaDatabase();
  const id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await runStoreRequest(database, "readwrite", (store) =>
    store.put({
      id,
      blob,
      createdAt: Date.now(),
      mimeType: mimeType ?? blob.type ?? null
    } satisfies WebMediaRecord)
  );

  database.close();
  return `${webMediaScheme}${id}`;
}

export async function getWebMediaObjectUrl(uri: string): Promise<string | null> {
  const id = uri.replace(webMediaScheme, "");
  const database = await openWebMediaDatabase();
  const record = await runStoreRequest<WebMediaRecord | undefined>(database, "readonly", (store) =>
    store.get(id)
  );
  database.close();

  if (!record?.blob) {
    return null;
  }

  return URL.createObjectURL(record.blob);
}

export async function deleteWebMediaUris(uris: string[]): Promise<void> {
  const ids = uris.filter(isWebMediaUri).map((uri) => uri.replace(webMediaScheme, ""));
  if (ids.length === 0) {
    return;
  }

  const database = await openWebMediaDatabase();
  const cleanupConcurrency = 4;
  for (let index = 0; index < ids.length; index += cleanupConcurrency) {
    await Promise.all(
      ids
        .slice(index, index + cleanupConcurrency)
        .map((id) => runStoreRequest(database, "readwrite", (store) => store.delete(id)))
    );
  }
  database.close();
}

function openWebMediaDatabase(): Promise<IDBDatabase> {
  const indexedDb = globalThis.indexedDB;
  if (!indexedDb) {
    return Promise.reject(new Error("Trình duyệt chưa hỗ trợ lưu media local."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error ?? new Error("Không mở được kho media local."));
    request.onsuccess = () => resolve(request.result);
  });
}

function runStoreRequest<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = createRequest(transaction.objectStore(storeName));

    request.onerror = () => reject(request.error ?? new Error("Không ghi được media local."));
    request.onsuccess = () => resolve(request.result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Không hoàn tất thao tác media local."));
  });
}
