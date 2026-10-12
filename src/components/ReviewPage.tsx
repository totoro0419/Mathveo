import {
  ArrowDownToLine,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Laptop,
} from "lucide-react";
import { topics, videos } from "../data/catalog";
import { learningEntries, playbackLabel } from "../domain/library";
import { statusLabels, understandingLabels } from "../domain/types";
import type { LearningStore } from "../hooks/useLearning";
import type { Route } from "../hooks/useRoute";
import { PageTitle, Empty } from "./Page";
import { Tabs } from "./Tabs";

export function ReviewPage({
  learning,
  route,
}: {
  learning: LearningStore;
  route: Route;
}) {
  const tabValue = route.query.get("tab");
  const tab =
    tabValue === "history" || tabValue === "notes" ? tabValue : "review";
  const scope = route.query.get("type") ?? "all";
  const entries = learningEntries(learning.records);
  const reviews = entries.filter((entry) => entry.record.review);
  const notes = entries.filter((entry) => entry.record.note.trim());
  const list = (
    tab === "review" ? reviews : tab === "notes" ? notes : entries
  ).filter((entry) => scope === "all" || entry.type === scope);
  const completedVideos = entries.filter(
    (entry) => entry.type === "video" && entry.record.status === "completed",
  ).length;
  const completedTopics = entries.filter(
    (entry) => entry.type === "topic" && entry.record.status === "completed",
  ).length;
  const update = (patch: Record<string, string>) => {
    const query = new URLSearchParams(route.query);
    for (const [key, value] of Object.entries(patch)) query.set(key, value);
    window.location.hash = `/review?${query}`;
  };
  return (
    <>
      <PageTitle
        eyebrow="REFLECT & REMEMBER"
        title="学びの続きと、振り返り。"
        description="授業動画と独自教材の記録を、ひとつの場所で。"
        action={
          <button className="button secondary" onClick={learning.exportRecords}>
            <ArrowDownToLine size={17} />
            記録を書き出す
          </button>
        }
      />
      <div className="review-summary">
        <div>
          <Bookmark size={21} />
          <span>
            復習待ち
            <strong>
              {reviews.length}
              <small>件</small>
            </strong>
          </span>
        </div>
        <div>
          <CheckCircle2 size={21} />
          <span>
            学習済みの動画
            <strong>
              {completedVideos}
              <small> / {videos.length.toLocaleString()}本</small>
            </strong>
          </span>
        </div>
        <div>
          <BookOpen size={21} />
          <span>
            メモがある記録
            <strong>
              {notes.length}
              <small>件</small>
            </strong>
          </span>
        </div>
      </div>
      <p className="material-progress-caption">
        独自教材の学習済み：{completedTopics} / {topics.length}
        テーマ。動画の学習状態とは別に保存します。
      </p>
      <div className="review-panel">
        <div className="record-scope">
          <label htmlFor="record-type">記録の対象</label>
          <select
            id="record-type"
            value={scope}
            onChange={(e) => update({ type: e.target.value })}
          >
            <option value="all">動画と教材</option>
            <option value="video">授業動画</option>
            <option value="topic">独自教材</option>
          </select>
        </div>
        <Tabs
          items={[
            { id: "review", label: `復習待ち ${reviews.length}` },
            { id: "history", label: "学習履歴" },
            { id: "notes", label: "学習メモ" },
          ]}
          active={tab}
          onChange={(tab) => update({ tab })}
          label="学習記録の種類"
        >
          {!learning.ready ? (
            <p className="quiet-empty">学習記録を読み込み中です。</p>
          ) : list.length ? (
            <div className="review-list">
              {list.map((entry) => (
                <article className="review-item" key={entry.key}>
                  <div>
                    <span className="topic-meta">{entry.context}</span>
                    <a href={entry.href}>
                      <h2>{entry.title}</h2>
                    </a>
                    <div className="review-item-tags">
                      <span className={`status-tag ${entry.record.status}`}>
                        {statusLabels[entry.record.status]}
                      </span>
                      {entry.record.understanding !== "unset" && (
                        <span className="tag plain">
                          {understandingLabels[entry.record.understanding]}
                        </span>
                      )}
                      {entry.type === "video" &&
                        playbackLabel(entry.record) && (
                          <span className="muted-text">
                            {playbackLabel(entry.record)}
                          </span>
                        )}
                      <span className="muted-text">
                        {new Date(entry.record.updatedAt).toLocaleDateString(
                          "ja-JP",
                        )}
                      </span>
                    </div>
                    {tab === "notes" && (
                      <p className="note-preview">{entry.record.note}</p>
                    )}
                  </div>
                  <a className="button secondary small" href={entry.href}>
                    {entry.type === "video" ? "授業を開く" : "教材を開く"}
                    <ArrowRight size={15} />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title={
                tab === "review"
                  ? "復習リストは、まだ空です"
                  : tab === "history"
                    ? "ここから、学びを積み重ねよう"
                    : "気づいたことを残してみよう"
              }
              description={
                tab === "review"
                  ? "授業や教材の復習ボタンから登録できます。"
                  : tab === "history"
                    ? "授業や教材を開くと、続きに戻れる学習記録が表示されます。"
                    : "授業や教材で書いたメモを、ここから振り返れます。"
              }
              icon={<Bookmark size={25} />}
            >
              <a className="button primary small" href="#/library">
                科目から探す
                <ArrowRight size={15} />
              </a>
            </Empty>
          )}
        </Tabs>
      </div>
      <p className="record-footnote">
        <Laptop size={15} />
        記録はこのブラウザに保存します。別の端末への同期はまだありません。
      </p>
    </>
  );
}
