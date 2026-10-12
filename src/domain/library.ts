import { subjects, topics, videos } from "../data/catalog";
import { officialPlaylists } from "../data/playlists";
import { unitVideos } from "../data/video-library";
import type { LearningRecord, SubjectId, VideoRecord } from "./types";
import { videoPresentation } from "./video-title";

export type ClassificationMode = "current" | "official";
const videoIndex = new Map(videos.map((video) => [video.id, video]));
const topicIndex = new Map(topics.map((topic) => [topic.id, topic]));
const officialOrder = new Map<string, [number, number]>();
const primaryUnits = new Map<string, (typeof officialPlaylists)[number]>();
officialPlaylists.forEach((unit, unitIndex) => {
  unitVideos(unit.id).forEach((video, lessonIndex) => {
    if (!officialOrder.has(video.id)) {
      officialOrder.set(video.id, [unitIndex, lessonIndex]);
      primaryUnits.set(video.id, unit);
    }
  });
});

export function subjectUnits(
  id: SubjectId,
  mode: ClassificationMode = "current",
) {
  return officialPlaylists.filter(
    (unit) => (mode === "official" ? unit.original : unit.current) === id,
  );
}

export function primaryUnit(video: VideoRecord) {
  return primaryUnits.get(video.id);
}

export function videoHref(
  video: VideoRecord,
  mode: ClassificationMode = "current",
) {
  const unit = primaryUnit(video);
  return `#/video/${video.id}?${unit ? `unit=${unit.id}&` : ""}mode=${mode}`;
}

export function supplementalVideos(id: SubjectId) {
  return videos
    .filter(
      (video) => !primaryUnit(video) && video.currentSubjects.includes(id),
    )
    .sort(compareVideoOrder);
}

export function supplementalLabel(video: VideoRecord) {
  return video.supplementalCategory === "exam"
    ? "入試演習"
    : video.supplementalCategory === "supplement"
      ? "補足講義"
      : "分類要確認";
}

/** Equal relevance follows the official unit/lesson order, never insertion order. */
export function compareVideoOrder(a: VideoRecord, b: VideoRecord) {
  const aOrder = officialOrder.get(a.id) ?? [Number.MAX_SAFE_INTEGER, 0];
  const bOrder = officialOrder.get(b.id) ?? [Number.MAX_SAFE_INTEGER, 0];
  return (
    aOrder[0] - bOrder[0] ||
    aOrder[1] - bOrder[1] ||
    a.id.localeCompare(b.id, "en")
  );
}

export function unitMaterials(id: string) {
  return topics
    .filter((topic) => topic.unitIds.includes(id))
    .sort((a, b) => a.order - b.order);
}

export function videoMaterials(video: VideoRecord) {
  return topics.filter((topic) =>
    topic.unitIds.some((id) => video.playlistIds.includes(id)),
  );
}

export function videoProgress(
  list: VideoRecord[],
  records: Record<string, LearningRecord>,
) {
  const unique = new Set(list.map((video) => video.id));
  const completed = [...unique].filter(
    (id) => records[`video:${id}`]?.status === "completed",
  ).length;
  const started = [...unique].filter((id) => {
    const record = records[`video:${id}`];
    return (
      record &&
      (record.status !== "unstarted" ||
        record.position > 0 ||
        record.playbackEnded)
    );
  }).length;
  return { total: unique.size, completed, started };
}

export function subjectProgress(
  id: SubjectId,
  records: Record<string, LearningRecord>,
  mode: ClassificationMode = "current",
) {
  return videoProgress(
    [
      ...subjectUnits(id, mode).flatMap((unit) => unitVideos(unit.id)),
      ...supplementalVideos(id),
    ],
    records,
  );
}

export interface LearningEntry {
  key: string;
  type: "video" | "topic";
  title: string;
  context: string;
  href: string;
  record: LearningRecord;
}

/** Read existing IndexedDB keys without rewriting or migrating any record. */
export function learningEntries(
  records: Record<string, LearningRecord>,
): LearningEntry[] {
  return Object.values(records)
    .flatMap((record): LearningEntry[] => {
      if (!record.updatedAt) return [];
      if (record.key.startsWith("video:")) {
        const video = videoIndex.get(record.key.slice(6));
        if (!video) return [];
        const unit = primaryUnit(video);
        const subject = subjects.find(
          (s) => s.id === (unit?.current ?? video.currentSubjects[0]),
        );
        return [
          {
            key: record.key,
            type: "video",
            title: videoPresentation(video).title,
            context: `${subject?.name ?? "数学"} · ${unit?.title ?? supplementalLabel(video)}`,
            href: videoHref(video),
            record,
          },
        ];
      }
      if (record.key.startsWith("topic:")) {
        const topic = topicIndex.get(record.key.slice(6));
        if (!topic) return [];
        return [
          {
            key: record.key,
            type: "topic",
            title: topic.title,
            context: `${subjects.find((s) => s.id === topic.subject)?.name ?? "数学"} · ${topic.unit} · 独自教材`,
            href: `#/material/${topic.id}`,
            record,
          },
        ];
      }
      return [];
    })
    .sort(
      (a, b) =>
        b.record.updatedAt - a.record.updatedAt ||
        a.key.localeCompare(b.key, "en"),
    );
}

export function resumeEntry(entries: LearningEntry[]) {
  return (
    entries.find(
      (entry) =>
        entry.type === "video" &&
        entry.record.status !== "completed" &&
        !entry.record.playbackEnded,
    ) ??
    entries.find((entry) => entry.record.status !== "completed") ??
    entries[0]
  );
}

export function playbackLabel(record: LearningRecord) {
  if (record.playbackEnded) return "再生完了";
  if (!record.position) return "";
  const time = `${Math.floor(record.position / 60)}:${String(Math.floor(record.position % 60)).padStart(2, "0")}`;
  return `${time} から再開`;
}
