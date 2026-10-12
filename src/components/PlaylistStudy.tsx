import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Play,
  RotateCcw,
} from "lucide-react";
import { officialPlaylists } from "../data/playlists";
import type { OfficialPlaylist } from "../data/playlists";
import { QUADRATIC_PLAYLIST, subjects, topics } from "../data/catalog";

export function PlaylistStudy({
  playlist,
  mode,
  offline,
}: {
  playlist: OfficialPlaylist;
  mode: "current" | "official";
  offline: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const subjectId = mode === "official" ? playlist.original : playlist.current;
  const subject = subjects.find((s) => s.id === subjectId)!;
  const original = subjects.find((s) => s.id === playlist.original)!;
  const current = subjects.find((s) => s.id === playlist.current)!;
  const units = officialPlaylists.filter(
    (p) => (mode === "official" ? p.original : p.current) === subjectId,
  );
  const params = new URLSearchParams({
    listType: "playlist",
    list: playlist.id,
    playsinline: "1",
    controls: "1",
    autoplay: "0",
    rel: "0",
    hl: "ja",
    origin: window.location.origin,
  });

  return (
    <div className="playlist-study">
      <nav className="breadcrumb" aria-label="パンくず">
        <a href={`#/library?subject=${subjectId}&mode=${mode}`}>
          {subject.name}
        </a>
        <ChevronRight size={13} />
        <span aria-current="page">{playlist.title}</span>
      </nav>
      <div className="topic-heading">
        <div>
          <span className="eyebrow">OFFICIAL LESSONS</span>
          <h1 tabIndex={-1}>{playlist.title}</h1>
          <p>{subject.name}の授業を、ひとつの再生リストで。</p>
        </div>
        <a
          className="button secondary"
          href={`#/library?subject=${subjectId}&mode=${mode}`}
        >
          単元一覧へ
          <ArrowRight size={17} />
        </a>
      </div>
      <div className="playlist-study-layout">
        <section
          className="playlist-study-main"
          aria-label={`${playlist.title}の授業動画`}
        >
          <div className="youtube-block">
            <div className="player-wrapper">
              <div className="player-frame">
                <iframe
                  key={attempt}
                  src={`https://www.youtube.com/embed?${params}`}
                  title={`${subject.name} ${playlist.title} — 超わかる！授業動画の公式再生リスト`}
                  width="960"
                  height="540"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="player-footer playlist-player-footer">
              <span>YouTube 公式プレーヤー</span>
              <button
                className="playlist-reload"
                onClick={() => setAttempt((a) => a + 1)}
                disabled={offline}
                title={
                  offline
                    ? "オンラインで再読み込みできます"
                    : "プレーヤーが表示されないときに再読み込み"
                }
              >
                <RotateCcw size={14} />
                再読み込み
              </button>
            </div>
          </div>
          <div className="playlist-study-description">
            <div className="playlist-source-line">
              <span className="tag blue">公式再生リスト</span>
              <span>超わかる！授業動画</span>
            </div>
            <p>
              プレーヤーの再生リストボタンから、授業動画を選べます。再生・字幕・速度・全画面の操作もプレーヤー内で行えます。
            </p>
            {playlist.original !== playlist.current && (
              <p className="playlist-classification">
                公式サイトの分類：{original.name}
                <span>／</span>現行課程：{current.name}
              </p>
            )}
            <a
              className="subtle-link"
              href={`https://www.youtube.com/playlist?list=${playlist.id}`}
              target="_blank"
              rel="noopener"
            >
              YouTubeで再生リストを開く
              <ExternalLink size={14} />
            </a>
          </div>
          <section className="playlist-material-note">
            <BookOpen size={21} />
            <div>
              <h2>
                {playlist.id === QUADRATIC_PLAYLIST
                  ? "公式・解説・例題と一緒に"
                  : "この単元の数学教材"}
              </h2>
              {playlist.id === QUADRATIC_PLAYLIST ? (
                <>
                  <p>二次関数は、Mathveoの独自教材も利用できます。</p>
                  <div className="playlist-material-links">
                    {topics.map((t) => (
                      <a key={t.id} href={`#/material/${t.id}`}>
                        {t.title}
                        <ArrowRight size={14} />
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  公式・解説・例題は準備中です。授業動画は、この画面で視聴できます。
                </p>
              )}
            </div>
          </section>
          <p className="playlist-record-note">
            この再生リスト内の動画ごとの学習記録・再生位置の保存は、まだ対応していません。
          </p>
        </section>
        <aside className="playlist-unit-guide">
          <span className="eyebrow">SUBJECT GUIDE</span>
          <h2>{subject.name}の単元</h2>
          <nav aria-label={`${subject.name}の授業単元`}>
            {units.map((unit, i) => (
              <a
                key={unit.id}
                href={`#/playlist/${unit.id}?mode=${mode}`}
                aria-current={unit.id === playlist.id ? "page" : undefined}
                className={unit.id === playlist.id ? "active" : ""}
              >
                <span className="playlist-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{unit.title}</span>
                <Play size={14} />
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
