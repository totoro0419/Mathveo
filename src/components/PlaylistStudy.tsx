import { ArrowRight, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { officialPlaylists } from "../data/playlists";
import type { OfficialPlaylist } from "../data/playlists";
import { subjects } from "../data/catalog";
import { unitVideos } from "../data/video-library";
import { unitMaterials, videoProgress } from "../domain/library";
import { statusLabels } from "../domain/types";
import type { LearningStatus } from "../domain/types";
import { RelatedMaterials } from "./RelatedMaterials";
import { lessonPresentations, lessonLabel } from "../domain/video-title";
import type { LearningStore } from "../hooks/useLearning";

/** Legacy playlist URLs resolve to the unit's individually registered videos. */
export function PlaylistStudy({
  playlist,
  mode,
  learning,
  filter = "all",
}: {
  playlist: OfficialPlaylist;
  mode: "current" | "official";
  learning: LearningStore;
  filter?: LearningStatus | "all";
}) {
  const subjectId = mode === "official" ? playlist.original : playlist.current;
  const subject = subjects.find((s) => s.id === subjectId)!;
  const videos = unitVideos(playlist.id);
  const presentations = lessonPresentations(videos);
  const progress = videoProgress(videos, learning.records);
  const visibleLessons = videos
    .map((video, index) => ({ video, index }))
    .filter(
      ({ video }) =>
        filter === "all" || learning.get(`video:${video.id}`).status === filter,
    );
  const units = officialPlaylists.filter(
    (p) => (mode === "official" ? p.original : p.current) === subjectId,
  );
  return (
    <div className="unit-page">
      <nav className="breadcrumb" aria-label="パンくず">
        <a href={`#/library?subject=${subjectId}&mode=${mode}`}>
          {subject.name}
        </a>
        <ChevronRight size={13} />
        <span aria-current="page">{playlist.title}</span>
      </nav>
      <div className="topic-heading">
        <div>
          <span className="eyebrow">LESSON LIBRARY</span>
          <h1 tabIndex={-1}>{playlist.title}</h1>
          <p>
            {subject.name} · {videos.length}本の授業
          </p>
        </div>
        <a
          className="button secondary"
          href={`#/library?subject=${subjectId}&mode=${mode}`}
        >
          単元一覧へ
          <ArrowRight size={17} />
        </a>
      </div>
      <div className="unit-list-controls">
        <span>
          {learning.ready
            ? `動画の学習済み ${progress.completed} / ${progress.total}本`
            : "学習記録を読み込み中"}
        </span>
        <label>
          <span className="sr-only">動画の学習状態</span>
          <select
            aria-label="動画の学習状態"
            value={filter}
            disabled={!learning.ready}
            onChange={(e) => {
              window.location.hash = `/unit/${playlist.id}?mode=${mode}&state=${e.target.value}`;
            }}
          >
            <option value="all">すべての学習状態</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="unit-library-layout">
        <section aria-label={`${playlist.title}の動画一覧`}>
          {visibleLessons.length ? (
            <ol className="lesson-list">
              {visibleLessons.map(({ video, index: i }) => {
                const record = learning.get(`video:${video.id}`);
                const state =
                  record.status === "completed"
                    ? "学習済み"
                    : record.playbackEnded
                      ? "再生完了"
                      : "";
                const label = lessonLabel(presentations[i]);
                return (
                  <li key={video.id}>
                    <a
                      className="lesson-list-row"
                      href={`#/video/${video.id}?unit=${playlist.id}&mode=${mode}`}
                    >
                      <span className="lesson-row-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="lesson-row-copy">
                        <strong>{presentations[i].title}</strong>
                        {(label || state) && (
                          <span className="lesson-row-meta">
                            {label && <span>{label}</span>}
                            {state && (
                              <span className="lesson-row-state">
                                <CheckCircle2 size={13} />
                                {state}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      <Play size={16} className="lesson-row-play" />
                    </a>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="quiet-empty">
              条件に合う授業はありません。学習状態を「すべて」にすると全授業を表示できます。
            </p>
          )}
          <RelatedMaterials topics={unitMaterials(playlist.id)} />
        </section>
        <aside className="playlist-unit-guide">
          <span className="eyebrow">SUBJECT GUIDE</span>
          <h2>{subject.name}の単元</h2>
          <nav aria-label={`${subject.name}の授業単元`}>
            {units.map((unit, i) => (
              <a
                key={unit.id}
                href={`#/unit/${unit.id}?mode=${mode}`}
                aria-current={unit.id === playlist.id ? "page" : undefined}
                className={unit.id === playlist.id ? "active" : ""}
              >
                <span className="playlist-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{unit.title}</span>
                <ChevronRight size={14} />
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
