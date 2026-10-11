import { defaultRecord } from "../domain/types";
import type { LearningRecord, LearningPatch } from "../domain/types";

const DATABASE = "mathveo-learning-v1";
let dbPromise: Promise<IDBDatabase> | null = null;

export function openLearningDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("このブラウザでは学習記録を保存できません。"));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("records", { keyPath: "key" });
    request.onerror = () => {
      dbPromise = null;
      reject(
        new Error(
          "保存領域を開けませんでした。ブラウザの設定を確認してください。",
        ),
      );
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(
        new Error(
          "別タブが保存領域を使用中です。別タブを閉じて再読み込みしてください。",
        ),
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
  });
  return dbPromise;
}

export async function readAllRecords(): Promise<
  Record<string, LearningRecord>
> {
  const db = await openLearningDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readonly");
    const request = tx.objectStore("records").getAll();
    request.onsuccess = () =>
      resolve(
        Object.fromEntries(
          (request.result as LearningRecord[]).map((r) => [r.key, r]),
        ),
      );
    request.onerror = () =>
      reject(new Error("学習記録を読み込めませんでした。"));
  });
}

export async function writeRecordPatch(
  key: string,
  patch: LearningPatch,
  expectedNote?: string,
): Promise<LearningRecord> {
  const db = await openLearningDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readwrite");
    const store = tx.objectStore("records");
    const request = store.get(key);
    let result: LearningRecord;
    let conflict = false;
    request.onsuccess = () => {
      const current: LearningRecord = request.result ?? defaultRecord(key);
      if (
        patch.note !== undefined &&
        expectedNote !== undefined &&
        current.note !== expectedNote &&
        current.note !== patch.note
      ) {
        conflict = true;
        tx.abort();
        return;
      }
      result = { ...current, ...patch, key, updatedAt: Date.now() };
      store.put(result);
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () =>
      reject(
        new Error(
          conflict
            ? "別タブでメモが変更されました。この下書きをコピーしてからページを再読み込みしてください。保存済みのメモは上書きしていません。"
            : "学習記録を保存できませんでした。入力内容は画面に残っています。再試行または記録の書き出しができます。",
        ),
      );
  });
}
