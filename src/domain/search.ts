import { topics, videos, subjects } from "../data/catalog";

export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/２/g, "2")
    .replace(/二次/g, "2次")
    .replace(/数学i\b/g, "数学1")
    .replace(/数学Ⅰ/g, "数学1")
    .replace(/[\s・、。]/g, "");
}

export function searchCatalog(query: string) {
  const tokens = query
    .trim()
    .normalize("NFKC")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeSearch);
  const matches = (s: string) =>
    tokens.every((t) => normalizeSearch(s).includes(t));
  return {
    topics: topics.filter((t) =>
      matches(
        [
          t.title,
          t.summary,
          t.definition,
          ...t.keywords,
          ...t.formulas.map((f) => f.name + f.condition + f.meaning),
          ...t.explanation.map((e) => e.title + e.body),
          ...t.cautions,
          t.example.title,
          t.example.question,
          t.example.expression,
          ...t.example.steps.map((s) => s.text),
          t.example.answerText,
          t.example.check.question,
          t.example.check.explanation,
        ].join(" "),
      ),
    ),
    videos: videos.filter((v) =>
      matches(v.title + " " + (v.description ?? "") + " 数学Ⅰ 二次関数"),
    ),
    subjects: subjects.filter((s) => matches(s.name + " " + s.units.join(" "))),
  };
}
