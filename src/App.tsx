import { useEffect, useMemo, useRef, useState } from "react";
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
import { statusLabels } from "./domain/types";
import { searchCatalog } from "./domain/search";
import { useLearning } from "./hooks/useLearning";
import type { LearningStore } from "./hooks/useLearning";
import { useRoute } from "./hooks/useRoute";
import type { Route } from "./hooks/useRoute";
import { Tabs } from "./components/Tabs";
import { MathText } from "./components/Math";

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
import { registeredInventory } from "./data/video-library";
import { videoPresentation } from "./domain/video-title";
import { learningEntries, videoHref } from "./domain/library";
import { PageTitle, Empty } from "./components/Page";
import { HomePage } from "./components/HomePage";
import { LibraryPage } from "./components/LibraryPage";
import { ReviewPage } from "./components/ReviewPage";

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
          <a
            href={`#/material/${topic.id}`}
            className="topic-row"
            key={topic.id}
          >
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
                {subjects.find((s) => s.id === topic.subject)?.name}
                <span>／</span>
                {topic.unit}
                <span>／</span>独自教材
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
        <a href={`#/library?subject=${topic.subject}`}>
          {subjects.find((s) => s.id === topic.subject)?.name}
        </a>
        <ChevronRight size={13} />
        <a href={`#/unit/${topic.unitIds[0]}`}>{topic.unit}</a>
        <ChevronRight size={13} />
        <span aria-current="page">{topic.title}</span>
      </nav>
      <div className="topic-heading">
        <div>
          <span className="eyebrow">MATHVEO NOTEBOOK</span>
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
  const results = useMemo(() => searchCatalog(query), [query]);
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
          placeholder="三角関数、確率、微分、ベクトル…"
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
            {["確率", "三角関数", "微分", "ベクトル"].map((q) => (
              <a href={`#/search?q=${encodeURIComponent(q)}`} key={q}>
                {q}
              </a>
            ))}
          </div>
          <Empty
            title="学びの途中で、気になったら"
            description="収録済みの動画・単元・科目・独自教材から探せます。全角・半角などの表記揺れにも対応しています。"
            icon={<Search size={25} />}
          />
        </>
      ) : (
        <>
          <p className="result-count">
            「{query}」の検索結果：{count}件{" "}
            <span>検索語との関連度順 · 同順位は公式の授業順</span>
          </p>
          {count === 0 && (
            <Empty
              title="見つかりませんでした"
              description="別の言葉で検索してみてください。チャンネル全体の動画は、まだ一括取得していません。"
              icon={<Search size={25} />}
            />
          )}
          {results.videos.length > 0 && (
            <section className="search-result-section">
              <h2>
                授業動画<span>{results.videos.length}</span>
              </h2>
              <div className="search-video-list">
                {results.videos.map((v) => {
                  return (
                    <a className="search-video" href={videoHref(v)} key={v.id}>
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
                単元<span>{results.playlists.length}</span>
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
          )}{" "}
          {results.topics.length > 0 && (
            <section className="search-result-section">
              <h2>
                数学教材<span>{results.topics.length}</span>
              </h2>
              <TopicRows list={results.topics} learning={learning} />
            </section>
          )}
        </>
      )}
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
  const reviews = learningEntries(learning.records).filter(
    (entry) => entry.record.review,
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
        filter={
          route.query.get("state") && route.query.get("state")! in statusLabels
            ? (route.query.get("state") as keyof typeof statusLabels)
            : "all"
        }
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
  else if (route.page === "review")
    page = <ReviewPage learning={learning} route={route} />;
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
          <img src={`${import.meta.env.BASE_URL}icon-192.png?v=mathveo-f-original`} alt="" />
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
              <img src={`${import.meta.env.BASE_URL}icon-192.png?v=mathveo-f-original`} alt="" />
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
