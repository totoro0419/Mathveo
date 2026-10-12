import { ArrowRight, ChevronRight, Info, ListFilter } from "lucide-react";
import { subjects } from "../data/catalog";
import { unitVideos } from "../data/video-library";
import {
  subjectProgress,
  subjectUnits,
  supplementalLabel,
  supplementalVideos,
  videoHref,
  videoProgress,
} from "../domain/library";
import { statusLabels } from "../domain/types";
import { videoPresentation } from "../domain/video-title";
import type { LearningStore } from "../hooks/useLearning";
import type { Route } from "../hooks/useRoute";
import { Empty, PageTitle } from "./Page";

export function LibraryPage({
  route,
  learning,
}: {
  route: Route;
  learning: LearningStore;
}) {
  const subject = subjects.find((s) => s.id === route.query.get("subject"));
  const mode = route.query.get("mode") === "official" ? "official" : "current";
  const rawFilter = route.query.get("state") ?? "all";
  const filter =
    rawFilter in statusLabels
      ? (rawFilter as keyof typeof statusLabels)
      : "all";
  const stage =
    subject?.id === "junior"
      ? "junior"
      : subject?.id === "special"
        ? "special"
        : "high";
  const update = (patch: Record<string, string>) => {
    const query = new URLSearchParams(route.query);
    for (const [key, value] of Object.entries(patch)) query.set(key, value);
    window.location.hash = `/library?${query}`;
  };
  const lists = subject ? subjectUnits(subject.id, mode) : [];
  const matches = (id: string) =>
    filter === "all" || learning.get(`video:${id}`).status === filter;
  const visibleLists = lists.filter((list) =>
    unitVideos(list.id).some((video) => matches(video.id)),
  );
  const supplemental = subject
    ? supplementalVideos(subject.id).filter((video) => matches(video.id))
    : [];
  const progress = subject
    ? subjectProgress(subject.id, learning.records, mode)
    : null;
  return (
    <div className="video-library">
      <PageTitle
        eyebrow="MATH LIBRARY"
        title="数学ライブラリ"
        description="科目から単元へ。公式の授業順に、必要な動画を選ぼう。"
      />
      <nav className="school-navigation" aria-label="学校段階">
        <a
          href={`#/library?mode=${mode}`}
          aria-current={stage === "high" ? "page" : undefined}
        >
          高校数学
        </a>
        <a
          href={`#/library?subject=junior&mode=${mode}`}
          aria-current={stage === "junior" ? "page" : undefined}
        >
          中学数学
        </a>
        <a
          href={`#/library?subject=special&mode=${mode}`}
          aria-current={stage === "special" ? "page" : undefined}
        >
          総復習・入試・特別講義
        </a>
      </nav>
      {stage === "high" && (
        <nav className="subject-navigation" aria-label="高校数学の科目選択">
          <a
            href={`#/library?mode=${mode}`}
            className={!subject ? "active" : ""}
            aria-current={!subject ? "page" : undefined}
          >
            科目一覧
          </a>
          {subjects.slice(0, 6).map((s) => (
            <a
              href={`#/library?subject=${s.id}&mode=${mode}`}
              key={s.id}
              className={subject?.id === s.id ? "active" : ""}
              aria-current={subject?.id === s.id ? "page" : undefined}
            >
              {s.name}
            </a>
          ))}
        </nav>
      )}
      {!subject ? (
        <>
          <div className="section-heading library-overview-heading">
            <h2>学びたい科目を選ぶ</h2>
            <span className="muted-text">高校数学</span>
          </div>
          <div className="library-course-directory">
            {subjects.slice(0, 6).map((s) => {
              const progress = subjectProgress(s.id, learning.records, mode);
              return (
                <a href={`#/library?subject=${s.id}&mode=${mode}`} key={s.id}>
                  <span className="subject-symbol large">{s.symbol}</span>
                  <span className="course-detail">
                    <strong>{s.name}</strong>
                    <span>{s.summary}</span>
                    <small>
                      {subjectUnits(s.id, mode).length}単元 · {progress.total}
                      本の動画
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </a>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="library-controls">
            <div className="library-subject">
              <span className="subject-symbol large">{subject.symbol}</span>
              <div>
                <h2>{subject.name}</h2>
                <p>
                  {lists.length}単元 · {progress!.total}本の動画（重複除外）
                </p>
              </div>
            </div>
            <div className="filter-controls">
              <label>
                <ListFilter size={15} />
                <select
                  aria-label="分類方法"
                  value={mode}
                  onChange={(e) => update({ mode: e.target.value })}
                >
                  <option value="current">現行課程の分類</option>
                  <option value="official">公式サイトの分類</option>
                </select>
              </label>
              <label>
                <select
                  aria-label="動画の学習状態"
                  value={filter}
                  disabled={!learning.ready}
                  onChange={(e) => update({ state: e.target.value })}
                >
                  <option value="all">動画：すべての学習状態</option>
                  {Object.entries(statusLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="subject-progress-line">
            <span>
              動画の学習済み{" "}
              <strong>
                {progress!.completed} / {progress!.total}本
              </strong>
            </span>
            <span>再生完了と理解度は、それぞれ記録します。</span>
          </div>
          <div className="library-body">
            <section className="library-main">
              <div className="section-heading">
                <h2>単元を選ぶ</h2>
                <span className="muted-text">
                  {filter === "all"
                    ? "公式の授業体系"
                    : `${statusLabels[filter]}の動画がある単元`}
                </span>
              </div>
              {visibleLists.length ? (
                <div className="playlist-list">
                  {visibleLists.map((list) => {
                    const lessons = unitVideos(list.id);
                    const progress = videoProgress(lessons, learning.records);
                    const index = lists.indexOf(list);
                    return (
                      <a
                        key={list.id}
                        href={`#/unit/${list.id}?mode=${mode}&state=${filter}`}
                      >
                        <span className="playlist-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong>{list.title}</strong>
                          <span>
                            {lessons.length}本の授業
                            {progress.completed > 0 &&
                              ` · 学習済み ${progress.completed}/${progress.total}本`}
                            {filter !== "all" &&
                              ` · 該当 ${lessons.filter((video) => matches(video.id)).length}本`}
                          </span>
                        </div>
                        <span className="external-label">
                          授業を選ぶ
                          <ChevronRight size={16} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : filter !== "all" ? (
                <Empty
                  title="条件に合う動画はありません"
                  description="学習状態のフィルタを解除すると、すべての授業を表示できます。"
                >
                  <button
                    className="button secondary small"
                    onClick={() => update({ state: "all" })}
                  >
                    フィルタを解除
                  </button>
                </Empty>
              ) : (
                <p className="quiet-empty">
                  この分類に登録された単元はありません。分類方法を切り替えて探せます。
                </p>
              )}
              {supplemental.length > 0 && (
                <section className="supplemental-section">
                  <div className="section-heading">
                    <h2>補足講義・入試演習</h2>
                    <span className="muted-text">
                      公式の単元一覧とは別に収録
                    </span>
                  </div>
                  <div className="search-video-list">
                    {supplemental.map((video) => (
                      <a
                        className="search-video"
                        key={video.id}
                        href={videoHref(video, mode)}
                      >
                        <div>
                          <span className="topic-meta">
                            {supplementalLabel(video)}
                          </span>
                          <h3>{videoPresentation(video).title}</h3>
                        </div>
                        <ChevronRight size={17} />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </section>
            <aside className="library-aside">
              <span className="eyebrow">LEARNING GUIDE</span>
              <h3>授業の順に、ひとつずつ。</h3>
              <p>
                単元を開くと、公式の授業順で動画を選べます。関連教材がある単元では、公式・解説・例題も併せて読めます。
              </p>
              {mode === "official" ? (
                <p className="classification-note">
                  公式サイトの元の分類を表示しています。
                </p>
              ) : (
                <div className="library-info">
                  <Info size={18} />
                  <p>
                    旧数学Bのベクトルは数学Cから探せます。元の分類も保持しています。
                  </p>
                </div>
              )}
              <a className="subtle-link" href="#/about">
                収録状況・出典
                <ArrowRight size={14} />
              </a>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
