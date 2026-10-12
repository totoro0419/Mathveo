import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Library,
  Play,
} from "lucide-react";
import { subjects, videos } from "../data/catalog";
import { officialPlaylists } from "../data/playlists";
import {
  learningEntries,
  playbackLabel,
  resumeEntry,
  subjectProgress,
  subjectUnits,
  videoHref,
} from "../domain/library";
import type { LearningEntry } from "../domain/library";
import { statusLabels } from "../domain/types";
import { videoPresentation } from "../domain/video-title";
import type { LearningStore } from "../hooks/useLearning";
import { PageTitle } from "./Page";

export function HistoryRows({ entries }: { entries: LearningEntry[] }) {
  return (
    <div className="history-rows">
      {entries.map((entry) => (
        <a href={entry.href} key={entry.key} className="history-row">
          <span className={`history-icon ${entry.type}`}>
            {entry.type === "video" ? (
              <Play size={16} />
            ) : (
              <BookOpen size={16} />
            )}
          </span>
          <span className="history-copy">
            <span className="topic-meta">{entry.context}</span>
            <strong>{entry.title}</strong>
            <span className="history-detail">
              {statusLabels[entry.record.status]}
              {entry.type === "video" &&
                playbackLabel(entry.record) &&
                ` · ${playbackLabel(entry.record)}`}
            </span>
          </span>
          <ChevronRight size={16} />
        </a>
      ))}
    </div>
  );
}

export function HomePage({ learning }: { learning: LearningStore }) {
  const entries = learningEntries(learning.records);
  const resume = resumeEntry(entries);
  const reviews = entries.filter((entry) => entry.record.review);
  const newest = videos
    .filter(
      (video) =>
        video.publishedAt && Number.isFinite(Date.parse(video.publishedAt)),
    )
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3);
  return (
    <div className="learning-home">
      <PageTitle
        eyebrow="YOUR LEARNING SPACE"
        title="今日の学びを、ここから。"
        description="中学数学から高校数学・入試まで。必要な授業を、自分のペースで。"
      />
      <section
        className={`resume-panel ${resume ? "has-history" : ""}`}
        aria-label="続きから学習"
      >
        <div className="resume-copy">
          <span className="eyebrow">
            {resume ? "CONTINUE LEARNING" : "LET’S GET STARTED"}
          </span>
          <h2>{resume ? resume.title : "学びたい科目から、はじめよう。"}</h2>
          <p>
            {resume
              ? resume.context
              : "科目を選び、単元を開く。授業の順に、一つずつ理解を重ねよう。"}
          </p>
          <div className="resume-actions">
            <a className="button primary" href={resume?.href ?? "#/library"}>
              {resume ? <Play size={17} /> : <Library size={17} />}
              {resume
                ? resume.record.status === "completed" ||
                  resume.record.playbackEnded
                  ? "最近の学習を開く"
                  : "続きから学習"
                : "科目を選ぶ"}
              <ArrowRight size={16} />
            </a>
            {!resume && (
              <a className="resume-search" href="#/search">
                動画を検索
                <ArrowRight size={15} />
              </a>
            )}
          </div>
          {resume?.type === "video" && playbackLabel(resume.record) && (
            <span className="resume-position">
              {playbackLabel(resume.record)}
            </span>
          )}
        </div>
        <div className="resume-context" aria-label="収録状況">
          <div className="learning-route">
            <span>科目</span>
            <ChevronRight size={15} />
            <span>単元</span>
            <ChevronRight size={15} />
            <span>授業</span>
          </div>
          <div className="inventory-count">
            <strong>{videos.length.toLocaleString()}</strong>
            <span>本の収録動画</span>
          </div>
          <p>{officialPlaylists.length}単元 · 公式の授業順で学ぶ</p>
        </div>
      </section>
      <section className="home-subjects" aria-labelledby="subjects-title">
        <div className="section-heading">
          <h2 id="subjects-title">科目から探す</h2>
          <a href="#/library">
            ライブラリへ
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="subject-directory">
          <div className="school-group-label">高校数学</div>
          <div className="course-grid">
            {subjects.slice(0, 6).map((subject) => {
              const progress = subjectProgress(subject.id, learning.records);
              return (
                <a
                  href={`#/library?subject=${subject.id}`}
                  key={subject.id}
                  className="course-link"
                >
                  <span className="subject-symbol">{subject.symbol}</span>
                  <span>
                    <strong>{subject.name}</strong>
                    <small>
                      {subjectUnits(subject.id).length}単元 · {progress.total}本
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </a>
              );
            })}
          </div>
          <div className="other-courses">
            {subjects.slice(6).map((subject) => (
              <a key={subject.id} href={`#/library?subject=${subject.id}`}>
                <span className="subject-symbol">{subject.symbol}</span>
                <span>
                  <strong>{subject.name}</strong>
                  <small>{subjectUnits(subject.id).length}単元</small>
                </span>
                <ChevronRight size={15} />
              </a>
            ))}
          </div>
        </div>
      </section>
      <div className="home-records">
        <section>
          <div className="section-heading">
            <h2>最近の学習</h2>
            <a href="#/review?tab=history">
              すべての記録
              <ArrowRight size={15} />
            </a>
          </div>
          {!learning.ready ? (
            <p className="quiet-empty">学習記録を読み込み中です。</p>
          ) : entries.length ? (
            <HistoryRows entries={entries.slice(0, 4)} />
          ) : (
            <div className="record-empty">
              <Play size={20} />
              <p>授業を開くと、ここから続きに戻れます。</p>
            </div>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>
              <Bookmark size={17} />
              復習待ち
            </h2>
            <span className="count-badge">{reviews.length}</span>
          </div>
          {reviews.length ? (
            <HistoryRows entries={reviews.slice(0, 3)} />
          ) : (
            <div className="record-empty">
              <Bookmark size={20} />
              <p>もう一度見たい授業や教材を、復習に登録できます。</p>
            </div>
          )}
          <a href="#/review" className="subtle-link">
            復習リストへ
            <ArrowRight size={14} />
          </a>
        </section>
      </div>
      {newest.length > 0 && (
        <section className="home-newest">
          <div className="section-heading">
            <h2>新着数学動画</h2>
          </div>
          <div className="history-rows">
            {newest.map((video) => (
              <a className="history-row" key={video.id} href={videoHref(video)}>
                <Play size={17} />
                <span className="history-copy">
                  <strong>{videoPresentation(video).title}</strong>
                  <small>
                    {new Date(video.publishedAt!).toLocaleDateString("ja-JP")}
                  </small>
                </span>
                <ChevronRight size={16} />
              </a>
            ))}
          </div>
        </section>
      )}
      <a className="notebook-access" href="#/materials">
        <span className="notebook-access-icon">
          <BookOpen size={22} />
        </span>
        <span>
          <strong>公式・解説・例題を読む</strong>
          <small>授業の理解を助ける、Mathveoの独自教材</small>
        </span>
        <ArrowRight size={19} />
      </a>
    </div>
  );
}
