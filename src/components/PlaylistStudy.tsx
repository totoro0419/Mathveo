import { ArrowRight, BookOpen, ChevronRight, Play } from "lucide-react";
import { officialPlaylists } from "../data/playlists";
import type { OfficialPlaylist } from "../data/playlists";
import { subjects, QUADRATIC_PLAYLIST, topics } from "../data/catalog";
import { unitVideos } from "../data/video-library";
import { VideoThumbnail } from "./VideoThumbnail";
import type { LearningStore } from "../hooks/useLearning";

/** Legacy playlist URLs resolve to the unit's individually registered videos. */
export function PlaylistStudy({
  playlist,
  mode,
  learning,
}: {
  playlist: OfficialPlaylist;
  mode: "current" | "official";
  learning: LearningStore;
}) {
  const subjectId = mode === "official" ? playlist.original : playlist.current;
  const subject = subjects.find((s) => s.id === subjectId)!;
  const videos = unitVideos(playlist.id);
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
      <div className="unit-library-layout">
        <section aria-label={`${playlist.title}の動画一覧`}>
          {videos.length ? (
            <div className="lesson-grid">
              {videos.map((video, i) => (
                <a
                  className="lesson-card"
                  key={video.id}
                  href={`#/video/${video.id}?unit=${playlist.id}&mode=${mode}`}
                >
                  <div className="lesson-card-image">
                    <VideoThumbnail video={video} />
                    <span className="lesson-play">
                      <Play size={20} fill="currentColor" />
                    </span>
                    {learning.get(`video:${video.id}`).playbackEnded && (
                      <span className="lesson-completed">再生完了</span>
                    )}
                  </div>
                  <div className="lesson-card-body">
                    <span className="lesson-order">
                      LESSON {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2>{video.title}</h2>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="quiet-empty">
              この単元の動画はまだ登録されていません。
            </p>
          )}
          {playlist.id === QUADRATIC_PLAYLIST && (
            <section className="playlist-material-note">
              <BookOpen size={21} />
              <div>
                <h2>公式・解説・例題も読む</h2>
                <div className="playlist-material-links">
                  {topics.map((t) => (
                    <a key={t.id} href={`#/material/${t.id}`}>
                      {t.title}
                      <ArrowRight size={14} />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}
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
