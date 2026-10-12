import { topics, videos, subjects } from "../data/catalog";
import { officialPlaylists } from "../data/playlists";
import { compareVideoOrder, primaryUnit } from "./library";
import { videoPresentation } from "./video-title";
import type { VideoRecord } from "./types";

export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/二次/g, "2次")
    .replace(/一次/g, "1次")
    .replace(/正の数と負の数/g, "正負の数")
    .replace(/数学iii\b/g, "数学3")
    .replace(/数学ii\b/g, "数学2")
    .replace(/数学i\b/g, "数学1")
    .replace(/[\s・、。]/g, "");
}

function terms(query: string) {
  return query
    .trim()
    .normalize("NFKC")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeSearch);
}

function videoDocument(video: VideoRecord) {
  const display = videoPresentation(video);
  const title = normalizeSearch(display.title);
  const original = normalizeSearch(video.title);
  const units = normalizeSearch(
    video.playlistIds
      .map((id) => officialPlaylists.find((p) => p.id === id)?.title ?? "")
      .join(" "),
  );
  const subject = normalizeSearch(
    video.currentSubjects
      .map((id) => subjects.find((s) => s.id === id)?.name ?? "")
      .join(" "),
  );
  const kind = normalizeSearch(display.kind ?? "");
  const description = normalizeSearch(video.description ?? "");
  return {
    video,
    title,
    original,
    units,
    subject,
    kind,
    text: [title, original, units, subject, kind, description].join(" "),
  };
}
const videoDocuments = videos.map(videoDocument);

/** Exported separately so ranking can also be verified with shuffled inputs. */
export function rankVideos(query: string, candidates: VideoRecord[] = videos) {
  const tokens = terms(query);
  if (!tokens.length) return [];
  const documents =
    candidates === videos ? videoDocuments : candidates.map(videoDocument);
  return documents
    .filter((doc) => tokens.every((token) => doc.text.includes(token)))
    .map((doc) => ({
      ...doc,
      score: tokens.reduce(
        (sum, token) =>
          sum +
          (doc.title === token
            ? 160
            : doc.title.startsWith(token)
              ? 110
              : doc.title.includes(token)
                ? 90
                : doc.original.includes(token)
                  ? 70
                  : doc.units.includes(token)
                    ? 40
                    : doc.kind.includes(token)
                      ? 30
                      : doc.subject.includes(token)
                        ? 20
                        : 5),
        0,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.video.classification === "verified") -
          Number(a.video.classification === "verified") ||
        Number(!!primaryUnit(b.video)) - Number(!!primaryUnit(a.video)) ||
        compareVideoOrder(a.video, b.video),
    )
    .map((doc) => doc.video);
}

const topicDocuments = topics.map((topic) => ({
  topic,
  title: normalizeSearch(topic.title),
  text: normalizeSearch(
    [
      topic.title,
      topic.summary,
      topic.definition,
      ...topic.keywords,
      ...topic.formulas.map((f) => f.name + f.condition + f.meaning),
      ...topic.explanation.map((e) => e.title + e.body),
      ...topic.cautions,
      topic.example.title,
      topic.example.question,
      topic.example.expression,
      ...topic.example.steps.map((step) => step.text),
      topic.example.answerText,
      topic.example.check.question,
      topic.example.check.explanation,
    ].join(" "),
  ),
}));

export function searchCatalog(query: string) {
  const tokens = terms(query);
  if (!tokens.length)
    return { videos: [], playlists: [], subjects: [], topics: [] };
  const matches = (text: string) =>
    tokens.every((token) => normalizeSearch(text).includes(token));
  return {
    videos: rankVideos(query),
    playlists: officialPlaylists.filter((p) =>
      matches(
        [
          p.title,
          subjects.find((s) => s.id === p.current)?.name ?? "",
          subjects.find((s) => s.id === p.original)?.name ?? "",
        ].join(" "),
      ),
    ),
    subjects: subjects.filter((s) => matches(s.name + " " + s.units.join(" "))),
    topics: topicDocuments
      .filter((doc) => tokens.every((token) => doc.text.includes(token)))
      .sort(
        (a, b) =>
          tokens.filter((token) => b.title.includes(token)).length -
            tokens.filter((token) => a.title.includes(token)).length ||
          a.topic.order - b.topic.order ||
          a.topic.id.localeCompare(b.topic.id, "en"),
      )
      .map((doc) => doc.topic),
  };
}
