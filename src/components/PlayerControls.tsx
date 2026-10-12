import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Captions,
} from "lucide-react";
import type { CaptionSnapshot } from "../domain/player-captions";

export interface PlaybackSnapshot {
  time: number;
  duration: number;
  state: number;
  rate: number;
  rates: number[];
  volume: number;
  muted: boolean;
}

export const initialPlayback: PlaybackSnapshot = {
  time: 0,
  duration: 0,
  state: -1,
  rate: 1,
  rates: [1],
  volume: 100,
  muted: false,
};

export function mediaTime(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}

export function PlayerControls({
  playback,
  ready,
  offline,
  fullscreen,
  captions,
  status,
  seekPreview,
  onToggle,
  onSkip,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onRate,
  onVolume,
  onMute,
  onCaptions,
  onFullscreen,
}: {
  playback: PlaybackSnapshot;
  ready: boolean;
  offline: boolean;
  fullscreen: boolean;
  captions: CaptionSnapshot;
  status: string;
  seekPreview: number | null;
  onToggle: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (seconds: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onRate: (rate: number) => void;
  onVolume: (volume: number) => void;
  onMute: () => void;
  onCaptions: () => void;
  onFullscreen: () => void;
}) {
  const playing = playback.state === 1 || playback.state === 3;
  const time = seekPreview ?? playback.time;
  const volumeOff = playback.muted || playback.volume === 0;
  return (
    <div className="media-controls" role="group" aria-label="Mathveoの動画操作">
      <div className="media-seek-row">
        <span className="media-time">{mediaTime(time)}</span>
        <input
          type="range"
          aria-label="動画の再生位置"
          aria-valuetext={`${mediaTime(time)} / ${playback.duration ? mediaTime(playback.duration) : "長さを読み込み中"}`}
          min={0}
          max={playback.duration || 1}
          step={1}
          value={Math.min(time, playback.duration || 1)}
          disabled={!ready || !playback.duration}
          onPointerDown={onSeekStart}
          onPointerUp={onSeekEnd}
          onPointerCancel={onSeekEnd}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <span className="media-time">
          {playback.duration ? mediaTime(playback.duration) : "—:—"}
        </span>
      </div>
      <div className="media-control-actions">
        <div className="media-playback-group">
          <button
            type="button"
            className="media-button media-play-button"
            aria-label={playing ? "一時停止" : "動画を再生"}
            title={playing ? "一時停止" : "再生"}
            disabled={!ready || (offline && !playing)}
            onClick={onToggle}
          >
            {playing ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            className="media-button media-skip-button"
            aria-label="10秒戻る"
            title="10秒戻る"
            disabled={!ready || !playback.duration}
            onClick={() => onSkip(-10)}
          >
            <RotateCcw size={20} />
            <span>10</span>
          </button>
          <button
            type="button"
            className="media-button media-skip-button"
            aria-label="10秒進む"
            title="10秒進む"
            disabled={!ready || !playback.duration}
            onClick={() => onSkip(10)}
          >
            <RotateCw size={20} />
            <span>10</span>
          </button>
        </div>
        <div className="media-volume-group">
          <button
            type="button"
            className="media-button"
            aria-label={volumeOff ? "音声をオンにする" : "ミュート"}
            aria-pressed={playback.muted}
            title={volumeOff ? "音声をオン" : "ミュート"}
            disabled={!ready}
            onClick={onMute}
          >
            {volumeOff ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={playback.volume}
            aria-label="動画の音量"
            aria-valuetext={`${playback.volume}%`}
            disabled={!ready}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
        </div>
        <button
          type="button"
          className={`media-caption-button${captions.state === "on" ? " active" : ""}`}
          aria-label="字幕"
          aria-pressed={
            captions.state === "on"
              ? true
              : captions.state === "off"
                ? false
                : undefined
          }
          title={
            captions.state === "on"
              ? "字幕をオフにする"
              : captions.state === "off"
                ? "字幕をオンにする"
                : captions.state === "unavailable"
                  ? "字幕操作に対応していません"
                  : "字幕の状態を確認中"
          }
          disabled={!ready || !captions.canToggle}
          onClick={onCaptions}
        >
          <Captions size={19} />
          <span>
            {captions.state === "off"
              ? "字幕オフ"
              : captions.state === "on"
                ? "字幕オン"
                : "字幕"}
          </span>
        </button>
        <div className="media-speed-group">
          <label className="media-speed-select">
            <span className="sr-only">再生速度</span>
            <select
              aria-label="再生速度"
              value={playback.rate}
              disabled={!ready}
              onChange={(event) => onRate(Number(event.target.value))}
            >
              {playback.rates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}×
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`media-speed-quick ${playback.rate === 2 ? "active" : ""}`}
            aria-label="2倍速"
            aria-pressed={playback.rate === 2}
            disabled={!ready || !playback.rates.includes(2)}
            onClick={() => onRate(2)}
          >
            2×
          </button>
        </div>
        <button
          type="button"
          className="media-button media-fullscreen-button"
          aria-label={fullscreen ? "通常表示に戻す" : "動画だけを表示"}
          title={fullscreen ? "通常表示に戻す（Esc）" : "動画だけを表示"}
          onClick={onFullscreen}
        >
          {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
        </button>
      </div>
      {status && (
        <p className="media-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
