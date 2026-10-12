import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ExternalLink,
  GraduationCap,
  Home as HomeIcon,
  Info,
  Laptop,
  Library as LibraryIcon,
  ListFilter,
  Play,
  Search,
  Settings,
  Sparkles,
  WifiOff,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import {
  topics,
  videos,
  subjects,
  getTopic,
  topicVideos,
  OFFICIAL_SITE,
  QUADRATIC_PLAYLIST,
} from "./data/catalog";
import { officialPlaylists } from "./data/playlists";
import type { Topic } from "./domain/types";
import { statusLabels, understandingLabels } from "./domain/types";
import { searchCatalog } from "./domain/search";
import { useLearning } from "./hooks/useLearning";
import type { LearningStore } from "./hooks/useLearning";
import { useRoute } from "./hooks/useRoute";
import type { Route } from "./hooks/useRoute";
import { Tabs } from "./components/Tabs";
import { MathText } from "./components/Math";
import { ParabolaGraph } from "./components/Graph";
import {
  FormulaSection,
  ExplanationSection,
  ExampleSection,
  RelatedSection,
} from "./components/Material";
import {
  LearningControls,
  CompleteButton,
} from "./components/LearningControls";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { PlaylistStudy } from "./components/PlaylistStudy";
import { VideoStudy } from "./components/VideoStudy";
import { unitVideos, registeredInventory } from "./data/video-library";
import { videoPresentation } from "./domain/video-title";

const navItems = [
  { id: "home", label: "ホーム", icon: HomeIcon, href: "#/home" },
  { id: "library", label: "ライブラリ", icon: LibraryIcon, href: "#/library" },
  { id: "materials", label: "数学教材", icon: BookOpen, href: "#/materials" },
  { id: "review", label: "復習・記録", icon: Bookmark, href: "#/review" },
];

function navId(page: string) {
  return page === "material"
    ? "materials"
    : page === "watch" ||
        page === "playlist" ||
        page === "unit" ||
        page === "video"
      ? "library"
      : page;
}
function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Empty({
  title,
  description,
  children,
  icon = <BookOpen size={25} />,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}

function TopicRows({
  list = topics,
  learning,
  compact = false,
}: {
  list?: Topic[];
  learning: LearningStore;
  compact?: boolean;
}) {
  return (
    <div className={`topic-rows ${compact ? "compact" : ""}`}>
      {list.map((topic) => {
        const record = learning.get(`topic:${topic.id}`);
        return (
          <a href={`#/watch/${topic.id}`} className="topic-row" key={topic.id}>
            <span
              className={`topic-order ${record.status === "completed" ? "done" : ""}`}
            >
              {record.status === "completed" ? (
                <Check size={20} />
              ) : (
                String(topic.order).padStart(2, "0")
              )}
            </span>
            <div className="topic-row-text">
              <span className="topic-meta">
                数学Ⅰ<span>／</span>二次関数
              </span>
              <h3>{topic.title}</h3>
              {!compact && <p>{topic.summary}</p>}
            </div>
            <div className="topic-row-end">
              <span className={`status-tag ${record.status}`}>
                {record.status === "completed" ? (
                  <CheckCircle2 size={13} />
                ) : record.status === "learning" ? (
                  <Circle size={12} />
                ) : null}
                {statusLabels[record.status]}
              </span>
              <ArrowRight size={18} />
            </div>
          </a>
        );
      })}
    </div>
  );
}

function HomePage({ learning }: { learning: LearningStore }) {
  const completed = topics.filter(
    (t) => learning.get(`topic:${t.id}`).status === "completed",
  ).length;
  const started = topics
    .filter((t) => learning.get(`topic:${t.id}`).updatedAt > 0)
    .sort(
      (a, b) =>
        learning.get(`topic:${b.id}`).updatedAt -
        learning.get(`topic:${a.id}`).updatedAt,
    );
  const inProgress = started.find(
    (t) => learning.get(`topic:${t.id}`).status === "learning",
  );
  const resume =
    inProgress ??
    topics.find((t) => learning.get(`topic:${t.id}`).status !== "completed") ??
    topics[0];
  const resumeLabel = inProgress
    ? "続きから学習する"
    : completed === topics.length
      ? "もう一度復習する"
      : completed > 0
        ? "次のテーマへ"
        : "学習をはじめる";
  const reviews = topics.filter((t) => learning.get(`topic:${t.id}`).review);
  return (
    <>
      <PageTitle
        eyebrow="YOUR LEARNING SPACE"
        title="数学の学びを、ひとつに。"
        description="動画でつかむ。数式でつながる。自分のペースで、理解を深めよう。"
      />
      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-tags">
            <span className="tag blue">数学Ⅰ</span>
            <span className="tag plain">二次関数</span>
          </div>
          <h2>
            式の向こうに、
            <br />
            グラフが見えてくる。
          </h2>
          <p>
            平方完成から最大・最小まで。
            <br className="desktop-break" />
            授業動画と公式・解説・例題を、一か所で。
          </p>
          <a className="button primary" href={`#/watch/${resume.id}`}>
            <Play size={17} fill="currentColor" />
            {resumeLabel}
            <ArrowRight size={17} />
          </a>
          <span className="hero-footnote">
            {started.length
              ? resume.title
              : "3つのテーマで、二次関数の基礎を学ぶ"}
          </span>
        </div>
        <div className="hero-visual">
          <span className="hero-equation">y = a(x − p)² + q</span>
          <ParabolaGraph hero />
          <span className="hero-visual-note">
            <span className="tiny-dot" />
            式とグラフを、つなげる。
          </span>
        </div>
      </section>
      <section className="subjects-section">
        <div className="section-heading">
          <h2>科目から探す</h2>
          <a href="#/library">
            すべて見る
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="subject-shortcuts">
          {subjects.slice(0, 6).map((subject) => (
            <a key={subject.id} href={`#/library?subject=${subject.id}`}>
              <span className="subject-symbol">{subject.symbol}</span>
              <strong>{subject.name}</strong>
              <ChevronRight size={15} />
            </a>
          ))}
        </div>
        <div className="extra-subjects">
          <a href="#/library?subject=junior">
            中学数学
            <ArrowRight size={13} />
          </a>
          <a href="#/library?subject=special">
            総復習・入試・特別講義
            <ArrowRight size={13} />
          </a>
        </div>
      </section>
      <div className="home-lower">
        <section className="learning-path">
          <div className="section-heading">
            <div>
              <span className="eyebrow">STEP BY STEP</span>
              <h2>二次関数の学習ガイド</h2>
            </div>
            <span className="muted-text">3テーマ</span>
          </div>
          <TopicRows learning={learning} />
          <a href="#/materials" className="subtle-link">
            <BookOpen size={16} />
            公式・解説・例題だけを読む
            <ArrowRight size={15} />
          </a>
        </section>
        <aside className="home-aside">
          <section className="progress-summary">
            <div className="section-heading">
              <h2>学びの記録</h2>
              <span className="tag plain">このブラウザ</span>
            </div>
            <div className="progress-number">
              <strong>{completed}</strong>
              <span>/ 3 テーマ 学習済み</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="二次関数の学習済みテーマ"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={3}
            >
              <span style={{ width: `${(completed / 3) * 100}%` }} />
            </div>
            <p>
              {completed
                ? "積み重ねた理解を、ときどき確かめよう。"
                : "最初のテーマから、少しずつ始めよう。"}
            </p>
          </section>
          <section className="review-preview">
            <div className="section-heading">
              <h2>
                <Bookmark size={17} />
                復習待ち
              </h2>
              <span className="count-badge">{reviews.length}</span>
            </div>
            {reviews.length ? (
              reviews.slice(0, 2).map((t) => (
                <a
                  className="aside-topic"
                  href={`#/material/${t.id}`}
                  key={t.id}
                >
                  {t.title}
                  <ArrowRight size={16} />
                </a>
              ))
            ) : (
              <p>気になるテーマを復習に登録すると、ここからすぐに戻れます。</p>
            )}
            <a href="#/review" className="subtle-link">
              復習リストを開く
              <ArrowRight size={14} />
            </a>
          </section>
        </aside>
      </div>
      <div className="home-bottom">
        <section>
          <div className="section-heading">
            <h2>最近の学習</h2>
          </div>
          {started.length ? (
            <TopicRows list={started.slice(0, 2)} learning={learning} compact />
          ) : (
            <p className="quiet-empty">
              まだ学習記録はありません。テーマを開くと、続きから再開できます。
            </p>
          )}
        </section>
        <section className="new-videos">
          <div className="section-heading">
            <h2>新着数学動画</h2>
            <span className="tag muted">同期前</span>
          </div>
          <p>チャンネル全体の新着情報はまだ取得していません。</p>
        </section>
      </div>
    </>
  );
}

function LibraryPage({
  route,
  learning,
}: {
  route: Route;
  learning: LearningStore;
}) {
  const rawSubject = route.query.get("subject") ?? "I";
  const subject = subjects.find((s) => s.id === rawSubject) ?? subjects[0];
  const mode = route.query.get("mode") === "official" ? "official" : "current";
  const filter = route.query.get("state") ?? "all";
  const update = (patch: Record<string, string>) => {
    const query = new URLSearchParams(route.query);
    for (const [k, v] of Object.entries(patch)) query.set(k, v);
    window.location.hash = `/library?${query}`;
  };
  const lists = officialPlaylists.filter(
    (p) => (mode === "official" ? p.original : p.current) === subject.id,
  );
  const lessons = topics.filter(
    (t) =>
      t.subject === subject.id &&
      (filter === "all" || learning.get(`topic:${t.id}`).status === filter),
  );
  return (
    <>
      <PageTitle
        eyebrow="MATH LIBRARY"
        title="単元から、学びを探そう。"
        description="科目と単元をたどって、必要な動画・教材にすぐアクセス。"
      />
      <nav className="subject-navigation" aria-label="科目選択">
        {subjects.map((s) => (
          <a
            href={`#/library?subject=${s.id}&mode=${mode}`}
            key={s.id}
            aria-current={subject.id === s.id ? "page" : undefined}
            className={subject.id === s.id ? "active" : ""}
          >
            {s.name}
          </a>
        ))}
      </nav>
      <div className="library-controls">
        <div className="library-subject">
          <span className="subject-symbol large">{subject.symbol}</span>
          <div>
            <h2>{subject.name}</h2>
            <p>{subject.summary}</p>
          </div>
        </div>
        <div className="filter-controls">
          <label>
            <ListFilter size={15} />
            <span className="sr-only">分類方法</span>
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
            <span className="sr-only">教材の学習状態</span>
            <select
              aria-label="教材の学習状態"
              value={filter}
              onChange={(e) => update({ state: e.target.value })}
            >
              <option value="all">教材：すべての学習状態</option>
              {Object.entries(statusLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="library-body">
        <section className="library-main">
          {(lessons.length > 0 || filter !== "all") && (
            <div className="section-heading">
              <h2>利用できる教材</h2>
              <span className="muted-text">{lessons.length}テーマ</span>
            </div>
          )}
          {lessons.length ? (
            <>
              <div className="unit-heading">
                <div>
                  <span className="eyebrow">UNIT</span>
                  <h3>二次関数</h3>
                  <p>公式、グラフ、例題で基礎をつなげる。</p>
                </div>
                <ParabolaGraph hero />
              </div>
              <TopicRows list={lessons} learning={learning} />
            </>
          ) : filter !== "all" ? (
            <Empty
              title="条件に合う教材はありません"
              description="教材の学習状態フィルタを変更してみてください。授業動画は下の単元から視聴できます。"
            >
              <button
                className="button secondary small"
                onClick={() => update({ state: "all" })}
              >
                フィルタを解除
              </button>
            </Empty>
          ) : null}
          <div className="section-heading official-heading">
            <div>
              <span className="eyebrow">LESSON LIBRARY</span>
              <h2>単元別の授業動画</h2>
            </div>
            <span className="tag blue">アプリ内で視聴</span>
          </div>
          <p className="section-description">
            単元を開いて授業を選び、動画ごとに学習できます。
          </p>
          {lists.length ? (
            <div className="playlist-list">
              {lists.map((list, i) => (
                <a key={list.id} href={`#/unit/${list.id}?mode=${mode}`}>
                  <span className="playlist-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{list.title}</strong>
                    <span>{unitVideos(list.id).length}本の授業</span>
                  </div>
                  <span className="external-label">
                    視聴する
                    <Play size={15} />
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <Empty
              title="公式一覧の参照先"
              description={
                subject.id === "C"
                  ? "公式サイトでは旧課程の数学B・Ⅲに分類されています。現行課程へ切り替えると対応先を表示します。"
                  : "この区分の動画は、まだ個別登録していません。公式サイトから確認できます。"
              }
            >
              <a
                className="button secondary small"
                href={
                  subject.id === "junior"
                    ? "https://kouki-honda.jp/contents/"
                    : OFFICIAL_SITE
                }
                target="_blank"
                rel="noreferrer"
              >
                公式サイトへ
                <ExternalLink size={14} />
              </a>
            </Empty>
          )}
        </section>
        <aside className="library-aside">
          <span className="eyebrow">SUBJECT GUIDE</span>
          <h3>{mode === "current" ? "現行課程の単元" : "分類について"}</h3>
          {mode === "current" ? (
            <ul>
              {subject.units.map((unit) => (
                <li key={unit}>
                  <span className="tiny-dot" />
                  {unit}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              公式サイトが公開している元の分類を保持しています。旧課程の動画も除外しません。
            </p>
          )}
          <div className="library-info">
            <Info size={18} />
            <p>
              旧数学Bのベクトルは現数学Cからも探せます。元の分類情報は保持しています。
            </p>
          </div>
          <a className="subtle-link" href="#/about">
            収録状況・出典について
            <ArrowRight size={14} />
          </a>
        </aside>
      </div>
    </>
  );
}

function MaterialsPage({ learning }: { learning: LearningStore }) {
  return (
    <>
      <PageTitle
        eyebrow="MATH NOTEBOOK"
        title="理解をつなぐ、数学教材。"
        description="公式の条件から途中式まで。必要なところを、じっくり確かめる。"
      />
      <div className="notebook-banner">
        <BookOpen size={25} />
        <div>
          <strong>動画の隣に、もうひとつの参考書。</strong>
          <p>
            Mathveoが独自に作成した学習補助教材です。動画の書き起こしではありません。
          </p>
        </div>
        <span className="tag blue">数学Ⅰ · 二次関数</span>
      </div>
      <div className="materials-grid">
        {topics.map((t) => (
          <article className="material-preview" key={t.id}>
            <div className="material-preview-head">
              <span className="number-label">0{t.order}</span>
              <span
                className={`status-tag ${learning.get(`topic:${t.id}`).status}`}
              >
                {statusLabels[learning.get(`topic:${t.id}`).status]}
              </span>
            </div>
            <a href={`#/material/${t.id}`}>
              <h2>{t.title}</h2>
              <p>{t.summary}</p>
            </a>
            <MathText latex={t.formulas[0].latex} />
            <div className="material-preview-foot">
              <span>{t.formulas.length}公式 · 基本例題 · 1問チェック</span>
              <a
                href={`#/material/${t.id}`}
                aria-label={`${t.title}の教材を読む`}
              >
                <ArrowRight size={19} />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="material-footnote">
        <CheckCircle2 size={17} />
        <p>
          掲載する公式・例題は、成立条件と計算結果を確認した独自教材です。動画との対応は各動画のページで明示します。
        </p>
      </div>
    </>
  );
}

const materialTabs = [
  { id: "formula", label: "公式", icon: <BookOpen size={16} /> },
  { id: "explanation", label: "解説", icon: <Sparkles size={16} /> },
  { id: "example", label: "例題", icon: <GraduationCap size={17} /> },
  { id: "related", label: "関連動画", icon: <Play size={15} /> },
];

function TopicHeading({
  topic,
  children,
}: {
  topic: Topic;
  children?: ReactNode;
}) {
  return (
    <>
      <nav className="breadcrumb" aria-label="パンくず">
        <a href="#/library?subject=I">数学Ⅰ</a>
        <ChevronRight size={13} />
        <a href="#/library?subject=I">二次関数</a>
        <ChevronRight size={13} />
        <span aria-current="page">{topic.title}</span>
      </nav>
      <div className="topic-heading">
        <div>
          <span className="eyebrow">LESSON 0{topic.order}</span>
          <h1 tabIndex={-1}>{topic.title}</h1>
          <p>{topic.subtitle}</p>
        </div>
        {children}
      </div>
    </>
  );
}

function StudyPage({
  topic,
  route,
  watch,
  learning,
  announce,
}: {
  topic: Topic;
  route: Route;
  watch: boolean;
  learning: LearningStore;
  announce: (text: string) => void;
}) {
  const [tab, setTab] = useState("formula");
  const [sideTab, setSideTab] = useState("formula");
  const links = topicVideos(topic.id);
  const requested = route.query.get("video");
  const link = links.find((l) => l.videoId === requested) ?? links[0];
  const video = link?.video ?? videos[0];
  useEffect(() => {
    if (
      learning.ready &&
      learning.get(`topic:${topic.id}`).status === "unstarted"
    )
      void learning.save(`topic:${topic.id}`, { status: "learning" });
  }, [topic.id, learning.ready]);
  const content = (selected: string) =>
    selected === "formula" ? (
      <FormulaSection topic={topic} announce={announce} />
    ) : selected === "explanation" ? (
      <ExplanationSection topic={topic} />
    ) : selected === "example" ? (
      <ExampleSection
        key={topic.id}
        topic={topic}
        learning={learning}
        announce={announce}
      />
    ) : selected === "notes" ? (
      <LearningControls topic={topic} learning={learning} announce={announce} />
    ) : (
      <RelatedSection topic={topic} />
    );
  return (
    <div className={`study-page ${watch ? "watch-page" : "reading-page"}`}>
      <TopicHeading topic={topic}>
        <div className="topic-actions">
          {watch ? (
            <a href={`#/material/${topic.id}`} className="button secondary">
              <BookOpen size={17} />
              教材を読む
            </a>
          ) : (
            <a href={`#/watch/${topic.id}`} className="button secondary">
              <Play size={17} />
              動画を見る
            </a>
          )}
          <CompleteButton
            topic={topic}
            learning={learning}
            announce={announce}
          />
        </div>
      </TopicHeading>
      {watch ? (
        <div className="watch-layout">
          <section className="watch-main">
            <YouTubePlayer key={video.id} video={video} learning={learning} />
            <div className="video-info">
              <div className="video-info-tags">
                <span className="tag plain">YouTube</span>
                <span
                  className={`tag ${link?.relation === "candidate" ? "muted" : "blue"}`}
                >
                  {link?.relation === "candidate"
                    ? "推定候補・要確認"
                    : "関連教材"}
                </span>
                {learning.get(`video:${video.id}`).playbackEnded && (
                  <span className="tag blue">再生完了</span>
                )}
              </div>
              <h2>{videoPresentation(video).title}</h2>
              <details className="video-evidence">
                <summary>
                  動画・教材の詳細
                  <ChevronRight size={14} />
                </summary>
                <p>元のタイトル：{video.title}</p>
                <p>投稿者：{video.channelTitle}</p>
                <p>
                  {link?.evidence}{" "}
                  掲載教材はMathveoの独自教材です。動画内の問題や説明を再現したものではありません。
                </p>
                <p>
                  タイトル・投稿者：公式oEmbedで確認。説明文・公開日時・再生時間・埋め込み許可：Data
                  APIでの取得前。
                </p>
              </details>
            </div>
            <div className="watch-record">
              <LearningControls
                topic={topic}
                learning={learning}
                announce={announce}
              />
            </div>
            <div className="section-heading">
              <h2>次の学びへ</h2>
              <a href={`#/unit/${QUADRATIC_PLAYLIST}`}>
                この単元の授業動画
                <Play size={14} />
              </a>
            </div>
            <TopicRows
              list={topics.filter((t) => t.id !== topic.id)}
              learning={learning}
              compact
            />
          </section>
          <aside className="watch-material">
            <div className="material-panel-title">
              <BookOpen size={18} />
              <div>
                <strong>理解をつなぐ教材</strong>
                <span>Mathveo 独自の学習補助教材</span>
              </div>
              <a
                className="icon-button"
                href={`#/material/${topic.id}`}
                aria-label="教材を全画面で読む"
              >
                <ExternalLink size={17} />
              </a>
            </div>
            <Tabs
              items={[...materialTabs, { id: "notes", label: "メモ" }]}
              active={sideTab}
              onChange={setSideTab}
              label="動画と一緒に読む教材"
            >
              {content(sideTab)}
            </Tabs>
          </aside>
        </div>
      ) : (
        <div className="reading-layout">
          <article className="reading-main">
            <div className="original-label">
              <BookOpen size={16} />
              Mathveo 独自の学習補助教材
            </div>
            <Tabs
              items={materialTabs}
              active={tab}
              onChange={setTab}
              label="数学教材のセクション"
            >
              {content(tab)}
            </Tabs>
            <div className="reading-bottom">
              <CompleteButton
                topic={topic}
                learning={learning}
                announce={announce}
              />
              <a className="subtle-link" href={`#/watch/${topic.id}`}>
                動画と一緒に学ぶ
                <ArrowRight size={16} />
              </a>
            </div>
          </article>
          <aside className="reading-aside">
            <LearningControls
              topic={topic}
              learning={learning}
              announce={announce}
            />
            <div className="reading-aside-next">
              <h3>二次関数の学習ガイド</h3>
              <TopicRows learning={learning} compact />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SearchPage({
  route,
  learning,
}: {
  route: Route;
  learning: LearningStore;
}) {
  const query = route.query.get("q") ?? "";
  const [value, setValue] = useState(query);
  useEffect(() => setValue(query), [query]);
  const results = searchCatalog(query);
  const count =
    results.topics.length +
    results.videos.length +
    results.subjects.length +
    results.playlists.length;
  const search = (e: FormEvent) => {
    e.preventDefault();
    window.location.hash = `/search?q=${encodeURIComponent(value)}`;
  };
  return (
    <>
      <PageTitle
        eyebrow="FIND YOUR NEXT STEP"
        title="知りたいことを、すぐに。"
        description="動画・単元・公式・解説・例題・科目名をまとめて検索します。"
      />
      <form className="search-page-form" onSubmit={search}>
        <Search size={21} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="平方完成、頂点、最大値…"
          aria-label="数学動画と教材を検索"
        />
        <button className="button primary" type="submit">
          検索
        </button>
      </form>
      {!query.trim() ? (
        <>
          <div className="search-suggestions">
            <span>すぐに探す</span>
            {["平方完成", "三角関数", "微分", "ベクトル"].map((q) => (
              <a href={`#/search?q=${encodeURIComponent(q)}`} key={q}>
                {q}
              </a>
            ))}
          </div>
          <Empty
            title="学びの途中で、気になったら"
            description="二次関数・2次関数、全角・半角などの表記揺れにも対応しています。現在の教材範囲は数学Ⅰ・二次関数です。"
            icon={<Search size={25} />}
          />
        </>
      ) : (
        <>
          <p className="result-count">
            「{query}」の検索結果：{count}件{" "}
            <span>登録済みの動画・単元・教材が対象</span>
          </p>
          {count === 0 && (
            <Empty
              title="見つかりませんでした"
              description="別の言葉で検索してみてください。チャンネル全体の動画は、まだ一括取得していません。"
              icon={<Search size={25} />}
            />
          )}
          {results.topics.length > 0 && (
            <section className="search-result-section">
              <h2>
                数学教材<span>{results.topics.length}</span>
              </h2>
              <TopicRows list={results.topics} learning={learning} />
            </section>
          )}
          {results.videos.length > 0 && (
            <section className="search-result-section">
              <h2>
                授業動画<span>{results.videos.length}</span>
              </h2>
              <div className="search-video-list">
                {results.videos.map((v) => {
                  return (
                    <a
                      className="search-video"
                      href={`#/video/${v.id}`}
                      key={v.id}
                    >
                      <div>
                        <span className="topic-meta">
                          {v.currentSubjects
                            .map(
                              (id) => subjects.find((s) => s.id === id)?.name,
                            )
                            .join("・")}
                          {videoPresentation(v).kind &&
                            ` · ${videoPresentation(v).kind}`}
                        </span>
                        <h3>{videoPresentation(v).title}</h3>
                      </div>
                      <Play size={19} />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
          {results.playlists.length > 0 && (
            <section className="search-result-section">
              <h2>
                単元の単元<span>{results.playlists.length}</span>
              </h2>
              <div className="playlist-list">
                {results.playlists.map((list, i) => (
                  <a key={list.id} href={`#/unit/${list.id}`}>
                    <span className="playlist-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{list.title}</strong>
                      <span>
                        {subjects.find((s) => s.id === list.current)?.name} ·
                        超わかる！授業動画
                      </span>
                    </div>
                    <span className="external-label">
                      視聴する
                      <Play size={15} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
          {results.subjects.length > 0 && (
            <section className="search-result-section">
              <h2>
                科目<span>{results.subjects.length}</span>
              </h2>
              <div className="related-topics">
                {results.subjects.map((s) => (
                  <a key={s.id} href={`#/library?subject=${s.id}`}>
                    {s.name}
                    <ArrowRight size={16} />
                  </a>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function ReviewPage({ learning }: { learning: LearningStore }) {
  const [tab, setTab] = useState("review");
  const review = topics.filter((t) => learning.get(`topic:${t.id}`).review);
  const learned = topics.filter(
    (t) => learning.get(`topic:${t.id}`).status !== "unstarted",
  );
  const notes = topics.filter((t) => learning.get(`topic:${t.id}`).note.trim());
  const list = tab === "review" ? review : tab === "history" ? learned : notes;
  return (
    <>
      <PageTitle
        eyebrow="REFLECT & REMEMBER"
        title="もう一度が、理解を深める。"
        description="気になったテーマと、自分の言葉で残したメモを振り返ろう。"
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
              {review.length}
              <small>テーマ</small>
            </strong>
          </span>
        </div>
        <div>
          <CheckCircle2 size={21} />
          <span>
            学習済み
            <strong>
              {
                topics.filter(
                  (t) => learning.get(`topic:${t.id}`).status === "completed",
                ).length
              }
              <small>テーマ</small>
            </strong>
          </span>
        </div>
        <div>
          <BookOpen size={21} />
          <span>
            メモがある教材
            <strong>
              {notes.length}
              <small>テーマ</small>
            </strong>
          </span>
        </div>
      </div>
      <div className="review-panel">
        <Tabs
          items={[
            { id: "review", label: `復習待ち ${review.length}` },
            { id: "history", label: "学習記録" },
            { id: "notes", label: "学習メモ" },
          ]}
          active={tab}
          onChange={setTab}
          label="学習記録の種類"
        >
          {list.length ? (
            <div className="review-list">
              {list.map((t) => {
                const r = learning.get(`topic:${t.id}`);
                return (
                  <article className="review-item" key={t.id}>
                    <div>
                      <span className="topic-meta">数学Ⅰ / 二次関数</span>
                      <a href={`#/material/${t.id}`}>
                        <h2>{t.title}</h2>
                      </a>
                      <div className="review-item-tags">
                        <span className={`status-tag ${r.status}`}>
                          {statusLabels[r.status]}
                        </span>
                        <span className="tag plain">
                          {understandingLabels[r.understanding]}
                        </span>
                        <span className="muted-text">
                          {new Date(r.updatedAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      {tab === "notes" && (
                        <p className="note-preview">{r.note}</p>
                      )}
                    </div>
                    <a
                      className="button secondary small"
                      href={`#/material/${t.id}`}
                    >
                      教材を開く
                      <ArrowRight size={15} />
                    </a>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title={
                tab === "review"
                  ? "復習リストは、まだ空です"
                  : tab === "history"
                    ? "これから、学びを積み重ねよう"
                    : "自分の言葉を残してみよう"
              }
              description={
                tab === "review"
                  ? "動画や教材のブックマークから登録できます。「要復習」を選んだテーマもここに入ります。"
                  : tab === "history"
                    ? "テーマを開くと、学習中の記録がここに表示されます。"
                    : "動画や教材で書いたメモが、ここにまとまります。"
              }
              icon={
                tab === "review" ? (
                  <Bookmark size={27} />
                ) : (
                  <BookOpen size={27} />
                )
              }
            >
              <a href="#/library?subject=I" className="button primary small">
                学習をはじめる
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

function AboutPage({ learning }: { learning: LearningStore }) {
  return (
    <>
      <PageTitle
        eyebrow="ABOUT MATHVEO"
        title="Mathveoについて"
        description="数学動画と参考書を融合した、新しい数学学習体験。"
      />
      <div className="about-content">
        <section>
          <h2>現在利用できるもの</h2>
          <p>
            数学Ⅰ「二次関数」の3テーマ、独自の公式・解説・例題、公式YouTubeで確認した授業動画を利用できます。サンプルの架空動画は使用していません。
          </p>
          <p>
            公式サイト掲載の45単元から、{registeredInventory.videos.length}
            本の動画を個別登録しました。科目・単元・各授業の順に選び、アプリ内で視聴できます。全チャンネルの公開動画・新着・Shorts・ライブの網羅性と、全数学動画の総数は未確定です。
          </p>
        </section>
        <section>
          <h2>非公式の独立した学習アプリです</h2>
          <p>
            Mathveoは「超わかる！授業動画」およびYouTubeとの提携・公認アプリではありません。動画の権利は各権利者に帰属し、公式YouTubeプレーヤーで再生します。動画ファイルはダウンロード・保存しません。
          </p>
          <p>
            教材はMathveoが独自に作成した補助教材です。動画内の問題や説明との同一性は示していません。「推定候補・要確認」の関連は、動画内容の直接対応を確認していないことを意味します。
          </p>
          <div className="about-links">
            <a href={OFFICIAL_SITE} target="_blank" rel="noreferrer">
              超わかる！公式サイト
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/totoro0419/Mathveo"
              target="_blank"
              rel="noreferrer"
            >
              Mathveo GitHub
              <ExternalLink size={14} />
            </a>
          </div>
        </section>
        <section>
          <h2>学習記録とプライバシー</h2>
          <p>
            学習状態・理解度・復習登録・再生位置・メモは、このブラウザ内に保存します。アカウント登録はありません。ブラウザのデータ削除や端末変更で記録が失われるため、必要に応じて書き出してください。
          </p>
          <button className="button secondary" onClick={learning.exportRecords}>
            <ArrowDownToLine size={17} />
            学習記録をJSONで書き出す
          </button>
          <p>
            YouTubeのサムネイルを表示し、再生操作や動画の視聴画面を開くと公式プレーヤーへ接続します。接続先には動画IDやIPアドレスなどの情報が伝わります。
          </p>
          <div className="about-links">
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
            >
              YouTube利用規約
              <ExternalLink size={14} />
            </a>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Googleプライバシーポリシー
              <ExternalLink size={14} />
            </a>
          </div>
        </section>
        <section>
          <h2>オフラインでの利用</h2>
          <p>
            一度オンラインで読み込み、保存が完了したアプリと教材は、オフラインでも利用できます。動画再生と外部リンクにはインターネット接続が必要です。PWAのインストール可否はブラウザにより異なります。
          </p>
        </section>
      </div>
    </>
  );
}

export function App() {
  const route = useRoute();
  const learning = useLearning();
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [search, setSearch] = useState("");
  const announce = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2800);
  };
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);
  const reviews = topics.filter(
    (t) => learning.get(`topic:${t.id}`).review,
  ).length;
  const activeNav = navId(route.page);
  const topic = getTopic(route.id);
  const playlist = officialPlaylists.find((p) => p.id === route.id);
  const selectedVideo = videos.find((v) => v.id === route.id);
  const topTitle =
    route.page === "watch" ||
    route.page === "playlist" ||
    route.page === "unit" ||
    route.page === "video"
      ? "授業動画"
      : route.page === "material" || route.page === "materials"
        ? "数学教材"
        : (navItems.find((n) => n.id === route.page)?.label ??
          (route.page === "search" ? "検索" : "Mathveoについて"));
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    window.location.hash = `/search?q=${encodeURIComponent(search)}`;
  };
  let page: ReactNode;
  if (route.page === "home") page = <HomePage learning={learning} />;
  else if (route.page === "library")
    page = <LibraryPage route={route} learning={learning} />;
  else if (route.page === "materials")
    page = <MaterialsPage learning={learning} />;
  else if ((route.page === "playlist" || route.page === "unit") && playlist)
    page = (
      <PlaylistStudy
        key={playlist.id}
        playlist={playlist}
        mode={route.query.get("mode") === "official" ? "official" : "current"}
        learning={learning}
      />
    );
  else if (route.page === "video" && selectedVideo)
    page = (
      <VideoStudy
        key={selectedVideo.id}
        video={selectedVideo}
        unitId={route.query.get("unit") ?? ""}
        mode={route.query.get("mode") === "official" ? "official" : "current"}
        learning={learning}
      />
    );
  else if ((route.page === "watch" || route.page === "material") && topic)
    page = (
      <StudyPage
        key={`${route.page}-${topic.id}`}
        route={route}
        topic={topic}
        watch={route.page === "watch"}
        learning={learning}
        announce={announce}
      />
    );
  else if (route.page === "search")
    page = <SearchPage route={route} learning={learning} />;
  else if (route.page === "review") page = <ReviewPage learning={learning} />;
  else if (route.page === "about") page = <AboutPage learning={learning} />;
  else
    page = (
      <>
        <PageTitle
          eyebrow="PAGE NOT FOUND"
          title="このページは見つかりませんでした"
        />
        <Empty
          title="ライブラリから探し直せます"
          description="テーマのURLを確認してください。"
        >
          <a href="#/library" className="button primary">
            ライブラリへ
            <ArrowRight size={17} />
          </a>
        </Empty>
      </>
    );
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        本文へ移動
      </a>
      <aside className="sidebar">
        <a className="brand" href="#/home" aria-label="Mathveo ホーム">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <span>
            Mathveo<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="brand-tagline">数学の学びを、ひとつに。</span>
        <nav className="main-nav" aria-label="メインナビゲーション">
          {navItems.map((n) => (
            <a
              href={n.href}
              className={activeNav === n.id ? "active" : ""}
              aria-current={activeNav === n.id ? "page" : undefined}
              key={n.id}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {n.id === "review" && reviews > 0 && (
                <span className="nav-count">{reviews}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-subjects">
          <span className="nav-section-label">科目</span>
          {subjects.slice(0, 6).map((s) => (
            <a key={s.id} href={`#/library?subject=${s.id}`}>
              <span>{s.short}</span>
              {s.name}
            </a>
          ))}
          <a href="#/library?subject=junior">
            <span>中</span>中学数学
          </a>
          <a href="#/library?subject=special">
            <span>＋</span>総復習・入試
          </a>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-prompt">
            <span className="prompt-mark">
              <Sparkles size={17} />
            </span>
            <strong>「わかる」を、少しずつ。</strong>
            <p>自分のペースで学ぼう。</p>
          </div>
          <a className="sidebar-settings" href="#/about">
            <Settings size={17} />
            アプリ・保存について
          </a>
          <div className="sidebar-version">
            <span className="tiny-dot" />
            初期版 · 数学動画<span>非公式</span>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="mobile-brand">
            <a className="brand" href="#/home">
              <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
              <span>
                Mathveo<span className="brand-dot">.</span>
              </span>
            </a>
          </div>
          <div className="topbar-location">
            <span>学習スペース</span>
            <ChevronRight size={14} />
            <strong>{topTitle}</strong>
          </div>
          <form className="global-search" onSubmit={onSearch}>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="動画・公式・単元を検索"
              aria-label="動画・公式・単元を検索"
            />
            <button type="submit" aria-label="検索する">
              <ArrowRight size={16} />
            </button>
          </form>
          <a
            href="#/search"
            className="mobile-search icon-button"
            aria-label="検索を開く"
          >
            <Search size={21} />
          </a>
          <span
            className={`save-indicator ${learning.saveState}`}
            title={learning.error || "学習記録はこのブラウザに保存されます"}
          >
            {learning.saveState === "saved" ? (
              <Laptop size={15} />
            ) : learning.saveState === "saving" ||
              learning.saveState === "loading" ? (
              <span className="spinner" />
            ) : (
              <Info size={15} />
            )}
            <span>
              {learning.saveState === "saved"
                ? "このブラウザに保存"
                : learning.saveState === "saving"
                  ? "保存中"
                  : learning.saveState === "loading"
                    ? "記録を読み込み中"
                    : "保存を確認"}
            </span>
          </span>
        </header>
        {offline && (
          <div className="offline-banner" role="status">
            <WifiOff size={16} />
            オフライン ·
            教材とメモは引き続き利用できます。動画再生には接続が必要です。
          </div>
        )}
        {learning.error && (
          <div className="storage-error" role="alert">
            <Info size={19} />
            <p>{learning.error}</p>
            <button onClick={learning.retry}>再試行</button>
            <button onClick={learning.exportRecords}>記録を書き出す</button>
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={
            route.page === "watch" ||
            route.page === "playlist" ||
            route.page === "unit" ||
            route.page === "video"
              ? "main-content wide"
              : "main-content"
          }
        >
          {page}
          <footer className="app-footer">
            <span>Mathveo — 数学の学びを、ひとつに。</span>
            <a href="#/about">
              非公式アプリ · 出典・プライバシー
              <ArrowRight size={12} />
            </a>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {navItems.map((n) => (
          <a
            href={n.href}
            key={n.id}
            aria-current={activeNav === n.id ? "page" : undefined}
            className={activeNav === n.id ? "active" : ""}
          >
            <n.icon size={21} />
            <span>
              {n.id === "materials"
                ? "教材"
                : n.id === "review"
                  ? "復習"
                  : n.label}
            </span>
            {n.id === "review" && reviews > 0 && <i>{reviews}</i>}
          </a>
        ))}
      </nav>
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <CheckCircle2 size={18} />
            {notice}
          </>
        )}
      </div>
    </div>
  );
}
