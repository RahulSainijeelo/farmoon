import type { ActionRecord, Stage1Payload, Stage2Result, VerificationRecord } from "@/core/types/pipeline";

const DATABASE_NAME = "soil-to-sky-edge";
const DATABASE_VERSION = 1;
const STORES = ["payloads", "rawFiles", "results", "actions", "verifications"] as const;

type RecordWithId<T> = { id: string; value: T; savedAt: number };

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const name of STORES) if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

async function writeRecord<T>(storeName: typeof STORES[number], record: RecordWithId<T>): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Local write failed."));
  });
  database.close();
}

async function readRecords<T>(storeName: typeof STORES[number]): Promise<RecordWithId<T>[]> {
  const database = await openDatabase();
  const values = await new Promise<RecordWithId<T>[]>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as RecordWithId<T>[]);
    request.onerror = () => reject(request.error ?? new Error("Local read failed."));
  });
  database.close();
  return values.sort((a, b) => b.savedAt - a.savedAt);
}

async function clearStore(storeName: typeof STORES[number]): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Local clear failed."));
  });
  database.close();
}

export const localEdgeStore = {
  savePayload: async (payload: Stage1Payload, rawFiles: File[] = []) => {
    await writeRecord("payloads", { id: `${payload.timestamp}-${payload.engineId}`, value: payload, savedAt: Date.now() });
    await Promise.all(rawFiles.map((file, index) => writeRecord("rawFiles", {
      id: `${payload.timestamp}-${index}-${file.name}`,
      value: { plotId: payload.plotId, engineId: payload.engineId, name: file.name, type: file.type, blob: file },
      savedAt: Date.now(),
    })));
  },
  saveResult: (result: Stage2Result) => writeRecord("results", { id: result.jobId, value: result, savedAt: Date.now() }),
  saveAction: (action: ActionRecord) => writeRecord("actions", { id: action.id, value: action, savedAt: action.updatedAt }),
  saveVerification: (record: VerificationRecord) => writeRecord("verifications", { id: record.id, value: record, savedAt: record.createdAt }),
  listPayloads: async () => (await readRecords<Stage1Payload>("payloads")).map((record) => record.value),
  listResults: async () => (await readRecords<Stage2Result>("results")).map((record) => record.value),
  listActions: async () => (await readRecords<ActionRecord>("actions")).map((record) => record.value),
  listVerifications: async () => (await readRecords<VerificationRecord>("verifications")).map((record) => record.value),
  clear: async () => { await Promise.all(STORES.map(clearStore)); },
};
