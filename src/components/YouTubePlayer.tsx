import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Play, RotateCcw, WifiOff } from "lucide-react";
import type { LearningStore } from "../hooks/useLearning";
import type { VideoRecord } from "../domain/types";
import { VideoThumbnail } from "./VideoThumbnail";

interface Player {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  pauseVideo(): void;
}
interface YoutubeApi {
  Player: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => Player;
}
declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YoutubeApi> | null = null;
function loadPlayerApi(): Promise<YoutubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prior = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(() => {
      apiPromise = null;
      reject(new Error("YouTubeへの接続に時間がかかっています。"));
    }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      prior?.();
      clearTimeout(timeout);
      if (window.YT) resolve(window.YT);
    };
    const previous = document.getElementById("youtube-api");
    previous?.remove();
    const script = document.createElement("script");
    script.id = "youtube-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      clearTimeout(timeout);
      apiPromise = null;
      reject(new Error("YouTubeに接続できませんでした。"));
    };
    document.head.append(script);
  });
  return apiPromise;
}

export function YouTubePlayer({
  video,
  learning,
}: {
  video: VideoRecord;
  learning: LearningStore;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const saveRef = useRef(learning.save);
  saveRef.current = learning.save;
  const record = learning.get(`video:${video.id}`);
  const position = useRef(record.position);
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    position.current = record.position;
  }, [record.position]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!started || !container.current) return;
    let disposed = false;
    let player: Player | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let lastPosition = -1;
    let playerReady = false;
    let hasPlaybackStarted = false;
    let readinessTimer: ReturnType<typeof setTimeout> | null = null;
    const persist = (ended = false) => {
      if (
        !playerReady ||
        !player ||
        typeof player.getCurrentTime !== "function" ||
        typeof player.getDuration !== "function"
      )
        return;
      const time = Math.floor(player.getCurrentTime() || 0);
      const duration = Math.floor(player.getDuration() || 0);
      // Leaving while an iframe is still loading must not erase a saved position.
      if (!duration || (time === 0 && !hasPlaybackStarted && !ended)) return;
      if (time === lastPosition && !ended) return;
      lastPosition = time;
      void saveRef.current(`video:${video.id}`, {
        position: time,
        duration,
        playbackEnded: ended,
      });
    };
    const onVisibility = () => {
      if (document.hidden) {
        persist();
        if (player && typeof player.pauseVideo === "function")
          player.pauseVideo();
      }
    };
    setState("loading");
    setError("");
    loadPlayerApi()
      .then((api) => {
        if (disposed || !container.current) return;
        const target = document.createElement("div");
        container.current.replaceChildren(target);
        readinessTimer = setTimeout(() => {
          if (!disposed) {
            setError(
              "YouTubeプレーヤーに接続できませんでした。接続を確認するかYouTubeで視聴してください。",
            );
            setState("error");
          }
        }, 20000);
        player = new api.Player(target, {
          width: "100%",
          height: "100%",
          videoId: video.id,
          playerVars: {
            playsinline: 1,
            controls: 1,
            origin: window.location.origin,
            rel: 0,
          },
          events: {
            onReady: () => {
              if (disposed || !player) return;
              playerReady = true;
              if (readinessTimer) clearTimeout(readinessTimer);
              setState("ready");
              if (position.current > 0 && !record.playbackEnded)
                player.seekTo(position.current, true);
              const iframe = container.current?.querySelector("iframe");
              if (iframe) {
                iframe.title = video.title;
                iframe.setAttribute(
                  "referrerpolicy",
                  "strict-origin-when-cross-origin",
                );
              }
              timer = setInterval(() => {
                if (player?.getPlayerState() === 1) persist();
              }, 2000);
            },
            onStateChange: (event: { data: number }) => {
              if (disposed) return;
              if (event.data === 1) hasPlaybackStarted = true;
              if (event.data === 0) persist(true);
              if (event.data === 2) persist();
            },
            onError: (event: { data: number }) => {
              if (disposed) return;
              if (readinessTimer) clearTimeout(readinessTimer);
              setError(
                event.data === 101 || event.data === 150
                  ? "この動画は外部サイトでの再生が許可されていません。YouTubeで視聴してください。"
                  : event.data === 153
                    ? "YouTubeが再生元を確認できませんでした。YouTubeで視聴するか再試行してください。"
                    : "YouTubeで動画を再生できませんでした。動画の公開状態や接続を確認してください。",
              );
              setState("error");
            },
          },
        });
      })
      .catch((e) => {
        if (!disposed) {
          setError(e.message);
          setState("error");
        }
      });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      if (readinessTimer) clearTimeout(readinessTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      if (player) {
        persist();
        player.destroy();
      }
    };
    // Playback records change every two seconds; they must not rebuild the iframe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, started, attempt]);

  return (
    <div className="youtube-block">
      {!started ? (
        <button
          className="video-cover"
          aria-label={`${video.title} のYouTubeプレーヤーを読み込む`}
          onClick={() => setStarted(true)}
          disabled={!learning.ready || offline}
        >
          <VideoThumbnail
            video={video}
            alt={video.title}
            className="player-thumbnail"
            lazy={false}
          />
          <span className="video-cover-scrim" />
          <span className="video-start">
            <span className="play-circle">
              <Play size={24} fill="currentColor" />
            </span>
            <span>
              {offline ? "接続してから再生" : "YouTubeで授業を見る"}
              <small>
                {record.position > 0 && !record.playbackEnded
                  ? `${Math.floor(record.position / 60)}:${String(record.position % 60).padStart(2, "0")} から再開`
                  : "公式プレーヤーを読み込む"}
              </small>
            </span>
          </span>
        </button>
      ) : (
        <div className="player-wrapper">
          <div ref={container} id={`player-${id}`} className="player-frame" />
          {state === "loading" && (
            <div className="player-loading" role="status">
              <span className="spinner" />
              YouTubeに接続中…
            </div>
          )}
        </div>
      )}
      {offline && (
        <p className="inline-notice">
          <WifiOff size={16} />
          オフラインです。教材と保存済みのメモは利用できます。
        </p>
      )}
      {state === "error" && (
        <div className="player-error" role="alert">
          <p>{error}</p>
          <button
            className="button secondary small"
            onClick={() => setAttempt((a) => a + 1)}
          >
            <RotateCcw size={15} />
            再試行
          </button>
        </div>
      )}
      <div className="player-footer">
        <span>YouTube 公式プレーヤー</span>
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noreferrer"
        >
          YouTubeで開く
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
