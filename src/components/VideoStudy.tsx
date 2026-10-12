import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Play,
} from "lucide-react";
import type { VideoRecord } from "../domain/types";
import { officialPlaylists } from "../data/playlists";
import { subjects, topics, videoTopicLinks } from "../data/catalog";
import { unitVideos } from "../data/video-library";
import type { LearningStore } from "../hooks/useLearning";
import { YouTubePlayer } from "./YouTubePlayer";

export function VideoStudy({
  video,
  unitId,
  mode,
  learning,
}: {
  video: VideoRecord;
  unitId: string;
  mode: "current" | "official";
  learning: LearningStore;
}) {
  const unit =
    officialPlaylists.find(
      (p) => p.id === unitId && video.playlistIds.includes(p.id),
    ) ?? officialPlaylists.find((p) => video.playlistIds.includes(p.id));
  const subjectId = unit
    ? mode === "official"
      ? unit.original
      : unit.current
    : video.currentSubjects[0];
  const subject = subjects.find((s) => s.id === subjectId)!;
  const lessons = unit ? unitVideos(unit.id) : [video];
  const index = lessons.findIndex((v) => v.id === video.id);
  const record = learning.get(`video:${video.id}`);
  const links = videoTopicLinks.filter((l) => l.videoId === video.id);
  const href = (id: string) =>
    `#/video/${id}?unit=${unit?.id ?? ""}&mode=${mode}`;
  return (
    <div className="individual-video-page">
      <nav className="breadcrumb" aria-label="パンくず">
        <a href={`#/library?subject=${subjectId}&mode=${mode}`}>
          {subject.name}
        </a>
        <ChevronRight size={13} />
        {unit && <a href={`#/unit/${unit.id}?mode=${mode}`}>{unit.title}</a>}
        <ChevronRight size={13} />
        <span aria-current="page">授業 {index + 1}</span>
      </nav>
      <div className="individual-video-layout">
        <section className="individual-video-main" aria-label="選択した授業">
          <YouTubePlayer
            key={video.id}
            video={video}
            learning={learning}
            autoLoad
          />
          <div className="individual-video-heading">
            <span className="lesson-order">
              LESSON {String(index + 1).padStart(2, "0")}
              {unit && ` / ${lessons.length}`}
            </span>
            <h1 tabIndex={-1}>{video.title}</h1>
          </div>
          <div className="lesson-actions">
            <div className="lesson-step-controls">
              {index > 0 && (
                <a
                  className="button secondary small"
                  href={href(lessons[index - 1].id)}
                >
                  <ArrowLeft size={16} />
                  前の授業
                </a>
              )}
              {index < lessons.length - 1 && (
                <a
                  className="button secondary small"
                  href={href(lessons[index + 1].id)}
                >
                  次の授業
                  <ArrowRight size={16} />
                </a>
              )}
            </div>
            <button
              className={`button ${record.status === "completed" ? "secondary" : "primary"} small`}
              aria-pressed={record.status === "completed"}
              disabled={!learning.ready}
              onClick={() =>
                void learning.save(`video:${video.id}`, {
                  status:
                    record.status === "completed" ? "learning" : "completed",
                })
              }
            >
              <Check size={16} />
              {record.status === "completed" ? "学習済み" : "学習済みにする"}
            </button>
          </div>
          {links.length > 0 && (
            <section className="playlist-material-note">
              <BookOpen size={21} />
              <div>
                <h2>関連する数学教材</h2>
                <div className="playlist-material-links">
                  {links.map((link) => {
                    const topic = topics.find((t) => t.id === link.topicId)!;
                    return (
                      <a key={topic.id} href={`#/material/${topic.id}`}>
                        {topic.title}
                        <ArrowRight size={14} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
          <details className="video-evidence compact-video-details">
            <summary>
              動画の詳細
              <ChevronRight size={14} />
            </summary>
            <p>投稿者：{video.channelTitle}</p>
            <p>動画ID：{video.id}</p>
            <p>
              タイトル・投稿者・サムネイルは公式oEmbedで確認。単元との対応は公式プレーヤーの動画一覧に基づきます。公開日時・説明文・全動画の再生可否は未確認です。
            </p>
            {unit && unit.original !== unit.current && (
              <p>
                元の分類：{subjects.find((s) => s.id === unit.original)?.name}{" "}
                ／ 現行：{subjects.find((s) => s.id === unit.current)?.name}
              </p>
            )}
          </details>
          <details className="video-evidence compact-video-details">
            <summary>
              学習メモ
              <ChevronRight size={14} />
            </summary>
            <label className="video-note-label" htmlFor="individual-video-note">
              この授業のメモ
            </label>
            <textarea
              id="individual-video-note"
              className="individual-video-note"
              value={record.note}
              disabled={!learning.ready}
              placeholder="気づいたことや、あとで確認したいこと"
              onChange={(e) =>
                void learning.save(`video:${video.id}`, {
                  note: e.target.value,
                })
              }
            />
          </details>
        </section>
        <aside className="lesson-queue">
          <div className="lesson-queue-heading">
            <span className="eyebrow">LESSONS</span>
            <h2>{unit?.title ?? "授業動画"}</h2>
            <p>{lessons.length}本の授業</p>
          </div>
          <nav aria-label="この単元の動画一覧">
            {lessons.map((lesson, i) => (
              <a
                className={lesson.id === video.id ? "active" : ""}
                aria-current={lesson.id === video.id ? "page" : undefined}
                href={href(lesson.id)}
                key={lesson.id}
              >
                <span className="playlist-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{lesson.title}</span>
                {lesson.id === video.id ? (
                  <Play size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </a>
            ))}
          </nav>
          {unit && (
            <a
              className="lesson-all-link"
              href={`#/unit/${unit.id}?mode=${mode}`}
            >
              すべての授業を見る
              <ArrowRight size={15} />
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
