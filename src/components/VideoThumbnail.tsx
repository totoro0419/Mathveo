import { useState } from "react";
import type { VideoRecord } from "../domain/types";

/** Provider thumbnail, with a clearly original Mathveo graphic if it cannot load. */
export function VideoThumbnail({
  video,
  className = "",
  alt = "",
  lazy = true,
}: {
  video: VideoRecord;
  className?: string;
  alt?: string;
  lazy?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!failed)
    return (
      <img
        className={className}
        src={video.thumbnail}
        alt={alt}
        loading={lazy ? "lazy" : "eager"}
        onError={() => setFailed(true)}
      />
    );
  return (
    <span
      className={`thumbnail-fallback ${className}`}
      role={alt ? "img" : undefined}
      aria-label={
        alt
          ? `${alt}（サムネイルを読み込めないため、Mathveoのテーマ図を表示）`
          : undefined
      }
      aria-hidden={alt ? undefined : true}
    >
      <svg viewBox="0 0 140 90" fill="none">
        <path d="M16 60H124M45 14V78" stroke="#a8bddf" strokeWidth="1" />
        <path d="M29 16Q73 119 114 16" stroke="#2563eb" strokeWidth="2.5" />
        <circle cx="72" cy="67" r="3" fill="#38bdf8" />
        <path d="m62 33 18 10-18 10V33Z" fill="#2563eb" opacity=".85" />
      </svg>
    </span>
  );
}
