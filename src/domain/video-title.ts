import type { VideoRecord } from "./types";

type TitleSource = Pick<VideoRecord, "id" | "title">;
export interface VideoPresentation {
  title: string;
  kind: "授業" | "演習" | "まとめ" | "ポイント" | null;
  part: number | null;
}

/** Editorial display only. The verified provider title and Video ID stay intact. */
export function videoPresentation(video: TitleSource): VideoPresentation {
  const original = video.title;
  const school = /【(?:超わかる！)?(?:高校数学|中学数学)[^】]*】/;
  const marker = school.exec(original);
  let title =
    marker && marker.index > 0
      ? original.slice(0, marker.index)
      : original.replace(school, "").replace(/～超わかる！高校数学.*$/, "");
  const kind = /～演習～|】演習～/.test(original)
    ? "演習"
    : /～授業～|】授業～/.test(original)
      ? "授業"
      : /まとめ/.test(original)
        ? "まとめ"
        : /裏技|小技/.test(original)
          ? "ポイント"
          : null;

  if (video.id === "ssuKwW6MBvo")
    title = "平方完成の裏技：二次関数の頂点を求める";
  else if (video.id === "jTx2zwMW6Ho")
    title = "二次関数：センター試験（2017年）";
  else if (/【実用的】因数分解/.test(original))
    title = "因数分解を効率よく計算する小技";
  else if (/【目から鱗の裏技】分散/.test(original))
    title = "度数分布表から分散を計算する（変量の変換）";
  else if (/【最強裏技】1\/6/.test(original))
    title = "面積公式（1/6・1/3・1/12）";
  else if (/「仮説検定」を世界一/.test(original)) title = "仮説検定";
  else if (/【裏技】3点を通る/.test(original))
    title = "3点を通る二次関数の求め方（裏技）";
  else if (/【瞬殺】円錐の表面積/.test(original))
    title = "円錐の表面積を求める裏技";
  else if (/【裏技】おうぎ形の面積/.test(original))
    title = "弧の長さからおうぎ形の面積を求める（裏技）";
  else {
    const qualifiers: string[] = [];
    title = title.replace(/【([^】]+)】/g, (_match, label: string) => {
      qualifiers.push(label);
      return "";
    });
    if (qualifiers.length) title += `（${qualifiers.join("・")}）`;
  }
  title = title
    .replace(/[０-９]/g, (n) => String(n.charCodeAt(0) - 0xff10))
    .replace(/２次|2次/g, "二次")
    .replace(/１次|1次/g, "一次")
    .replace(/y=ax\^2/g, "y=ax²")
    .replace(/[～~・\s]+$/, "")
    .trim();
  return { title: title || original, kind, part: null };
}

/** Distinguish repeated source topics by order, without guessing video contents. */
export function lessonPresentations(
  videos: TitleSource[],
): VideoPresentation[] {
  const labels = videos.map(videoPresentation);
  const counts = new Map<string, number>();
  const seen = new Map<string, number>();
  const key = (label: VideoPresentation) =>
    `${label.title}\u0000${label.kind ?? ""}`;
  for (const label of labels)
    counts.set(key(label), (counts.get(key(label)) ?? 0) + 1);
  return labels.map((label) => {
    const name = key(label);
    const part = (seen.get(name) ?? 0) + 1;
    seen.set(name, part);
    return { ...label, part: counts.get(name)! > 1 ? part : null };
  });
}

export function lessonLabel(label: VideoPresentation): string {
  return [label.kind, label.part ? `その${label.part}` : null]
    .filter(Boolean)
    .join(" · ");
}
