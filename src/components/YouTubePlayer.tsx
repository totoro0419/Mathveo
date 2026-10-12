import { useEffect, useId, useRef, useState } from "react";
import { Play, RotateCcw, WifiOff } from "lucide-react";
import type { LearningStore } from "../hooks/useLearning";
import type { VideoRecord } from "../domain/types";
import { VideoThumbnail } from "./VideoThumbnail";
import { PlayerControls, initialPlayback } from "./PlayerControls";
import type { PlaybackSnapshot } from "./PlayerControls";

interface Player {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  pauseVideo(): void;
  playVideo(): void;
  getPlaybackRate(): number;
  getAvailablePlaybackRates(): number[];
  setPlaybackRate(rate: number): void;
  getVolume(): number;
  setVolume(volume: number): void;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
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
  autoLoad = false,
}: {
  video: VideoRecord;
  learning: LearningStore;
  autoLoad?: boolean;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [playback, setPlayback] = useState<PlaybackSnapshot>(initialPlayback);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const seeking = useRef(false);
  const desiredSeek = useRef(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlNotice, setControlNotice] = useState("");
  const lastVolume = useRef(100);
  const [started, setStarted] = useState(autoLoad);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const saveRef = useRef(learning.save);
  saveRef.current = learning.save;
  const record = learning.get(`video:${video.id}`);
  const position = useRef(record.position);
  const recordRef = useRef(record);
  recordRef.current = record;
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
    const update = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    if (!started || !container.current) return;
    let disposed = false;
    let player: Player | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let lastPosition = -1;
    let lastSavedAt = 0;
    const syncControls = () => {
      if (disposed || !playerReady || !player) return;
      const rates = player.getAvailablePlaybackRates();
      const snapshot: PlaybackSnapshot = {
        time: Math.max(0, player.getCurrentTime() || 0),
        duration: Math.max(0, player.getDuration() || 0),
        state: player.getPlayerState(),
        rate: player.getPlaybackRate() || 1,
        rates: Array.isArray(rates) && rates.length ? rates : [1],
        volume: player.getVolume(),
        muted: player.isMuted(),
      };
      setPlayback((previous) => {
        const time = seeking.current ? previous.time : snapshot.time;
        if (
          previous.time === time &&
          previous.duration === snapshot.duration &&
          previous.state === snapshot.state &&
          previous.rate === snapshot.rate &&
          previous.volume === snapshot.volume &&
          previous.muted === snapshot.muted &&
          previous.rates.join() === snapshot.rates.join()
        )
          return previous;
        return { ...snapshot, time };
      });
    };
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
    setControlNotice("");
    setPlayback(initialPlayback);
    setSeekPreview(null);
    seeking.current = false;
    loadPlayerApi()
      .then((api) => {
        if (disposed || !container.current) return;
        const target = document.createElement("iframe");
        target.title = video.title;
        target.referrerPolicy = "strict-origin-when-cross-origin";
        target.allow =
          "autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope; clipboard-write; web-share";
        target.allowFullscreen = true;
        const params = new URLSearchParams({
          enablejsapi: "1",
          controls: "0",
          playsinline: "1",
          autoplay: "0",
          origin: window.location.origin,
          rel: "0",
          hl: "ja",
          iv_load_policy: "3",
        });
        target.src = `https://www.youtube.com/embed/${video.id}?${params}`;
        container.current.replaceChildren(target);
        readinessTimer = setTimeout(() => {
          if (!disposed) {
            setError(
              "YouTubeプレーヤーに接続できませんでした。接続を確認して再試行してください。",
            );
            setState("error");
          }
        }, 20000);
        player = new api.Player(target, {
          width: "100%",
          height: "100%",
          events: {
            onReady: () => {
              if (disposed || !player) return;
              playerReady = true;
              playerRef.current = player;
              if (readinessTimer) clearTimeout(readinessTimer);
              setState("ready");
              if (position.current > 0 && !recordRef.current.playbackEnded)
                player.seekTo(position.current, true);
              const iframe = container.current?.querySelector("iframe");
              if (iframe) {
                iframe.title = video.title;
                iframe.setAttribute(
                  "referrerpolicy",
                  "strict-origin-when-cross-origin",
                );
              }
              syncControls();
              timer = setInterval(() => {
                syncControls();
                if (
                  player?.getPlayerState() === 1 &&
                  Date.now() - lastSavedAt >= 2000
                ) {
                  persist();
                  lastSavedAt = Date.now();
                }
              }, 500);
            },
            onStateChange: (event: { data: number }) => {
              if (disposed) return;
              if (event.data === 1) hasPlaybackStarted = true;
              if (event.data === 0) persist(true);
              if (event.data === 2) persist();
              if (event.data === 1) setControlNotice("");
              syncControls();
            },
            onPlaybackRateChange: () => {
              if (!disposed) syncControls();
            },
            onAutoplayBlocked: () => {
              if (!disposed)
                setControlNotice(
                  "ブラウザが再生を保留しました。もう一度再生ボタンを押してください。",
                );
            },
            onError: (event: { data: number }) => {
              if (disposed) return;
              if (readinessTimer) clearTimeout(readinessTimer);
              setError(
                event.data === 101 || event.data === 150
                  ? "この動画は埋め込み再生が許可されていません。別の授業を選んでください。"
                  : event.data === 153
                    ? "YouTubeが再生元を確認できませんでした。再試行してください。"
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
      playerRef.current = null;
      if (player) {
        persist();
        player.destroy();
      }
    };
    // Playback records change every two seconds; they must not rebuild the iframe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, started, attempt]);

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player || state !== "ready") return;
    if (player.getPlayerState() === 1 || player.getPlayerState() === 3)
      player.pauseVideo();
    else player.playVideo();
  };
  const seekTo = (seconds: number, commit = true) => {
    const player = playerRef.current;
    if (!player || state !== "ready" || !playback.duration) return;
    const time = Math.max(0, Math.min(playback.duration, seconds));
    desiredSeek.current = time;
    setSeekPreview(time);
    player.seekTo(time, commit);
    if (commit) {
      setPlayback((previous) => ({ ...previous, time }));
      setSeekPreview(null);
    }
  };
  const changeRate = (rate: number) => {
    if (state === "ready" && playback.rates.includes(rate))
      playerRef.current?.setPlaybackRate(rate);
  };
  const changeVolume = (volume: number) => {
    const player = playerRef.current;
    if (!player || state !== "ready") return;
    if (volume > 0) lastVolume.current = volume;
    player.setVolume(volume);
    if (volume > 0 && player.isMuted()) player.unMute();
    setPlayback((previous) => ({
      ...previous,
      volume,
      muted: volume > 0 ? false : previous.muted,
    }));
  };
  const toggleMute = () => {
    const player = playerRef.current;
    if (!player || state !== "ready") return;
    const unmute = player.isMuted() || player.getVolume() === 0;
    const volume =
      unmute && player.getVolume() === 0
        ? lastVolume.current
        : player.getVolume();
    if (unmute) {
      player.unMute();
      if (player.getVolume() === 0) player.setVolume(volume);
    } else player.mute();
    setPlayback((previous) => ({ ...previous, muted: !unmute, volume }));
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === root.current)
        await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setControlNotice("このブラウザでは全画面表示を開始できませんでした。");
    }
  };

  return (
    <div className="youtube-block mathveo-player" ref={root}>
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
              {offline ? "接続してから再生" : "授業動画を読み込む"}
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
        </div>
      )}
      {started && (
        <PlayerControls
          playback={playback}
          ready={state === "ready"}
          offline={offline}
          fullscreen={fullscreen}
          fullscreenAvailable={Boolean(document.fullscreenEnabled)}
          status={
            state === "loading"
              ? "プレーヤーを読み込み中…"
              : playback.state === 3
                ? "動画を読み込み中…"
                : controlNotice
          }
          seekPreview={seekPreview}
          onToggle={togglePlayback}
          onSkip={(seconds) => seekTo(playback.time + seconds)}
          onSeekStart={() => {
            seeking.current = true;
            desiredSeek.current = playback.time;
          }}
          onSeek={(seconds) => seekTo(seconds, !seeking.current)}
          onSeekEnd={() => {
            seeking.current = false;
            seekTo(desiredSeek.current, true);
          }}
          onRate={changeRate}
          onVolume={changeVolume}
          onMute={toggleMute}
          onFullscreen={() => void toggleFullscreen()}
        />
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
    </div>
  );
}
