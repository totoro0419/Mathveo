import {
  Bookmark,
  Check,
  CheckCircle2,
  Circle,
  Laptop,
  PenLine,
} from "lucide-react";
import type { LearningStore } from "../hooks/useLearning";
import type { LearningStatus, Topic, Understanding } from "../domain/types";
import { statusLabels, understandingLabels } from "../domain/types";

export function LearningControls({
  topic,
  learning,
  announce,
}: {
  topic: Topic;
  learning: LearningStore;
  announce: (text: string) => void;
}) {
  const controlId = useId();
  const key = `topic:${topic.id}`;
  const record = learning.get(key);
  const update = (
    patch: Parameters<LearningStore["save"]>[1],
    message?: string,
  ) => {
    void learning.save(key, patch);
    if (message) announce(message);
  };
  return (
    <fieldset className="learning-controls" disabled={!learning.ready}>
      <legend className="sr-only">{topic.title}の学習記録</legend>
      <div className="learning-head">
        <div>
          <span className="eyebrow">MY LEARNING</span>
          <h3>自分の理解を、記録する</h3>
        </div>
        <button
          className={`icon-button bookmark ${record.review ? "selected" : ""}`}
          onClick={() =>
            update(
              { review: !record.review },
              record.review
                ? "復習リストから外しました。"
                : "復習リストに追加しました。",
            )
          }
          aria-pressed={record.review}
          aria-label={record.review ? "復習リストから外す" : "復習リストに追加"}
          title="復習リスト"
        >
          <Bookmark size={20} fill={record.review ? "currentColor" : "none"} />
        </button>
      </div>
      <label className="field-label" htmlFor={`${controlId}-status`}>
        学習状態
      </label>
      <select
        id={`${controlId}-status`}
        value={record.status}
        onChange={(e) => update({ status: e.target.value as LearningStatus })}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <fieldset className="understanding-field">
        <legend className="field-label">理解度</legend>
        <div className="understanding-options">
          {(["understood", "unsure", "review"] as Understanding[]).map(
            (value) => (
              <label
                key={value}
                className={record.understanding === value ? "selected" : ""}
              >
                <input
                  type="radio"
                  name={`${controlId}-understanding`}
                  value={value}
                  checked={record.understanding === value}
                  onChange={() =>
                    update({
                      understanding: value,
                      ...(value === "review" ? { review: true } : {}),
                    })
                  }
                />
                {record.understanding === value ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
                {understandingLabels[value]}
              </label>
            ),
          )}
        </div>
      </fieldset>
      <p className="small-note">
        理解度は自分で記録します。動画の再生完了とは別です。
      </p>
      <label className="field-label note-label" htmlFor={`${controlId}-note`}>
        <PenLine size={15} />
        学習メモ
      </label>
      <textarea
        id={`${controlId}-note`}
        placeholder="気づいたこと、もう一度確かめたいこと。"
        rows={5}
        maxLength={20000}
        value={record.note}
        onChange={(e) => update({ note: e.target.value })}
      />
      <div className="note-status">
        <span>
          {learning.saveState === "saving"
            ? "保存中…"
            : learning.saveState === "error"
              ? "未保存の変更があります"
              : "変更は自動で保存されます"}
        </span>
        <span>{record.note.length.toLocaleString()} / 20,000</span>
      </div>
      <div className="local-save-label">
        <Laptop size={14} />
        このブラウザに保存
      </div>
    </fieldset>
  );
}

export function CompleteButton({
  topic,
  learning,
  announce,
}: {
  topic: Topic;
  learning: LearningStore;
  announce: (text: string) => void;
}) {
  const completed = learning.get(`topic:${topic.id}`).status === "completed";
  return (
    <button
      className={`button ${completed ? "secondary completed" : "primary"}`}
      disabled={!learning.ready}
      aria-pressed={completed}
      onClick={() => {
        void learning.save(`topic:${topic.id}`, {
          status: completed ? "learning" : "completed",
        });
        announce(
          completed
            ? "学習中に戻しました。"
            : "学習済みとして記録しました。理解度も記録できます。",
        );
      }}
    >
      {completed ? <Check size={18} /> : <CheckCircle2 size={18} />}
      {completed ? "学習済み" : "学習済みにする"}
    </button>
  );
}
import { useId } from "react";
