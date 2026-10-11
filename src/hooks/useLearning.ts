import { useCallback, useEffect, useRef, useState } from "react";
import { defaultRecord } from "../domain/types";
import type { LearningPatch, LearningRecord } from "../domain/types";
import { readAllRecords, writeRecordPatch } from "../lib/storage";

export type SaveState = "loading" | "saved" | "saving" | "error";

export function useLearning() {
  const [records, setRecords] = useState<Record<string, LearningRecord>>({});
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [error, setError] = useState("");
  const data = useRef(records);
  const noteBase = useRef<Record<string, string>>({});
  const pending = useRef<Record<string, LearningPatch>>({});
  const serial = useRef(Promise.resolve());
  const writes = useRef(0);

  useEffect(() => {
    let mounted = true;
    readAllRecords()
      .then((value) => {
        if (!mounted) return;
        data.current = value;
        setRecords(value);
        noteBase.current = Object.fromEntries(
          Object.entries(value).map(([key, r]) => [key, r.note]),
        );
        setSaveState("saved");
        setReady(true);
      })
      .catch((e) => {
        if (mounted) {
          setError(e.message);
          setSaveState("error");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, []);

  const save = useCallback((key: string, patch: LearningPatch) => {
    const updated = {
      ...(data.current[key] ?? defaultRecord(key)),
      ...patch,
      updatedAt: Date.now(),
    };
    data.current = { ...data.current, [key]: updated };
    setRecords(data.current);
    pending.current[key] = { ...pending.current[key], ...patch };
    writes.current += 1;
    setSaveState("saving");
    serial.current = serial.current.then(async () => {
      try {
        const saved = await writeRecordPatch(
          key,
          patch,
          patch.note !== undefined ? (noteBase.current[key] ?? "") : undefined,
        );
        noteBase.current[key] = saved.note;
        // Keep edits entered while this transaction was saving.
        const rest = pending.current[key] ?? {};
        for (const field of Object.keys(patch) as (keyof LearningPatch)[]) {
          if (rest[field] === patch[field]) delete rest[field];
        }
        if (!Object.keys(rest).length) delete pending.current[key];
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存できませんでした。");
      } finally {
        writes.current -= 1;
        if (!writes.current) {
          if (Object.keys(pending.current).length) setSaveState("error");
          else {
            setSaveState("saved");
            setError("");
          }
        }
      }
    });
    return serial.current;
  }, []);

  const get = useCallback(
    (key: string) => records[key] ?? defaultRecord(key),
    [records],
  );
  const retry = () => {
    if (!ready) {
      window.location.reload();
      return;
    }
    for (const [key, patch] of Object.entries(pending.current))
      void save(key, patch);
  };
  const exportRecords = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            records: data.current,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mathveo-learning.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { records, ready, get, save, saveState, error, retry, exportRecords };
}

export type LearningStore = ReturnType<typeof useLearning>;
