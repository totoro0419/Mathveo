/** Server/CLI-only YouTube Data API v3 collector. Never import this into the UI. */
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CHANNEL_ID = "UCZUPMvvW1ggn4gbSY741LdA";
const API = "https://www.googleapis.com/youtube/v3/";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export function durationSeconds(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    iso ?? "",
  );
  return m && m.slice(1).some((value) => value !== undefined)
    ? Number(m[1] || 0) * 86400 +
        Number(m[2] || 0) * 3600 +
        Number(m[3] || 0) * 60 +
        Number(m[4] || 0)
    : null;
}

export function officialPlaylistIds(source) {
  return new Set(
    Array.from(source.matchAll(/id:\s*["']([^"']+)["']/g), (m) => m[1]),
  );
}

export function createYouTubeClient(key, request = fetch) {
  return async function call(resource, params) {
    const url = new URL(resource, API);
    for (const [k, v] of Object.entries(params))
      if (v != null) url.searchParams.set(k, String(v));
    url.searchParams.set("key", key);
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await request(url, { signal: AbortSignal.timeout(25000) });
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
        throw new Error(`${resource}: ネットワーク接続失敗（3回）`);
      }
      const body = await response.json().catch(() => ({}));
      if (response.ok && !body.error) return body;
      const reason = body.error?.errors?.[0]?.reason ?? "unknown";
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }
      // Do not log URLs, response messages or keys; some providers echo credentials.
      throw new Error(
        `${resource}: HTTP ${response.status}, reason=${String(reason).replace(/[^a-zA-Z0-9_-]/g, "")}`,
      );
    }
  };
}

export async function allPages(call, resource, params) {
  const items = [];
  const seen = new Set();
  let pageToken;
  do {
    const data = await call(resource, { ...params, maxResults: 50, pageToken });
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
    if (pageToken) {
      if (seen.has(pageToken))
        throw new Error(`${resource}: 同一ページトークンが繰り返されました`);
      seen.add(pageToken);
    }
  } while (pageToken);
  return items;
}

export function classify(snippet, playlistIds, mathPlaylistIds) {
  const text = `${snippet.title ?? ""} ${snippet.description ?? ""}`;
  const fromPlaylist = playlistIds.some((id) => mathPlaylistIds.has(id));
  const mathematical =
    /数学|二次|２次|2次|微分|積分|ベクトル|数列|確率|平方|方程式|関数|幾何/.test(
      text,
    );
  const nonMath = /化学|英語|英文|物理|生物/.test(snippet.title ?? "");
  return {
    inclusion:
      fromPlaylist || mathematical
        ? "math-candidate"
        : nonMath
          ? "non-math-candidate"
          : "needs-review",
    classification: "needs-review",
    evidence: fromPlaylist
      ? "公式の数学再生リストに所属。単元は手動確認が必要。"
      : mathematical
        ? "タイトル・説明文に数学語。内容・単元は未確認。"
        : "分類根拠が不足。手動確認が必要。",
  };
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temp = path + ".tmp";
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, path);
}

export async function syncCatalog({
  call,
  mathPlaylistIds = new Set(),
  now = new Date(),
  previous = { videos: [] },
}) {
  const fetchedAt = now.toISOString();
  const failures = [];
  const membership = new Map();
  const ids = new Set();
  const channelData = await call("channels", {
    part: "snippet,contentDetails",
    id: CHANNEL_ID,
  });
  const channel = channelData.items?.find((c) => c.id === CHANNEL_ID);
  if (!channel?.contentDetails?.relatedPlaylists?.uploads)
    throw new Error("指定チャンネルの公開アップロード一覧を確認できません。");
  const uploads = await allPages(call, "playlistItems", {
    part: "contentDetails",
    playlistId: channel.contentDetails.relatedPlaylists.uploads,
  });
  for (const item of uploads)
    if (item.contentDetails?.videoId) ids.add(item.contentDetails.videoId);
  const playlists = await allPages(call, "playlists", {
    part: "snippet",
    channelId: CHANNEL_ID,
  });
  // Continue after a failed secondary playlist, but mark inventory incomplete.
  for (const p of playlists) {
    try {
      const items = await allPages(call, "playlistItems", {
        part: "contentDetails",
        playlistId: p.id,
      });
      for (const item of items) {
        const id = item.contentDetails?.videoId;
        if (!id) continue;
        ids.add(id);
        if (!membership.has(id)) membership.set(id, new Set());
        membership.get(id).add(p.id);
      }
    } catch (e) {
      failures.push({
        stage: "playlistItems",
        playlistId: p.id,
        error: e.message,
      });
    }
  }
  const records = new Map();
  const gone = [];
  const failedIds = new Set();
  const allIds = Array.from(ids);
  for (let offset = 0; offset < allIds.length; offset += 50) {
    const batch = allIds.slice(offset, offset + 50);
    try {
      const data = await call("videos", {
        part: "snippet,contentDetails,status",
        id: batch.join(","),
      });
      const found = new Set();
      for (const v of data.items ?? []) {
        found.add(v.id);
        if (
          v.snippet?.channelId !== CHANNEL_ID ||
          v.status?.privacyStatus !== "public"
        )
          continue;
        const playlistIds = Array.from(membership.get(v.id) ?? []);
        const classification = classify(
          v.snippet,
          playlistIds,
          mathPlaylistIds,
        );
        records.set(v.id, {
          id: v.id,
          title: v.snippet.title,
          description: v.snippet.description ?? "",
          channelId: CHANNEL_ID,
          channelTitle: v.snippet.channelTitle,
          publishedAt: v.snippet.publishedAt ?? null,
          durationSeconds: durationSeconds(v.contentDetails?.duration),
          thumbnail:
            v.snippet.thumbnails?.high?.url ??
            v.snippet.thumbnails?.default?.url ??
            "",
          playlistIds,
          embeddable: v.status.embeddable ?? null,
          fetchedAt,
          updatedAt: fetchedAt,
          source: "youtube-data-api",
          originalSubject: "",
          currentSubjects: [],
          classification: classification.classification,
          classificationEvidence: classification.evidence,
          inclusion: classification.inclusion,
        });
      }
      for (const id of batch)
        if (!found.has(id))
          gone.push({ id, reason: "API非返却。削除・非公開の区別は未確定。" });
    } catch (e) {
      for (const id of batch) failedIds.add(id);
      failures.push({ stage: "videos", videoIds: batch, error: e.message });
    }
  }
  // Preserve only recently fetched metadata when this run failed to refresh it.
  // Publicly unavailable items and metadata older than 30 days are not retained.
  const publicRecordsFetched = records.size;
  const expired = [];
  for (const old of previous.videos ?? []) {
    if (records.has(old.id)) continue;
    const age = now.getTime() - Date.parse(old.fetchedAt);
    if (Number.isFinite(age) && age < MAX_AGE && failedIds.has(old.id))
      records.set(old.id, old);
    else expired.push(old.id);
  }
  const videos = Array.from(records.values()).sort((a, b) =>
    String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")),
  );
  const report = {
    fetchedAt,
    complete: failures.length === 0,
    channelId: CHANNEL_ID,
    channelTitle: channel.snippet?.title,
    uploadIdsObserved: new Set(
      uploads.map((i) => i.contentDetails?.videoId).filter(Boolean),
    ).size,
    uniqueIdsObserved: ids.size,
    publicRecordsFetched,
    retainedRecords: records.size,
    mathCandidates: videos.filter((v) => v.inclusion === "math-candidate")
      .length,
    totalMathematicsVideos: null,
    note: "候補の分類確認が完了するまで、数学動画の総数は未確定。UIへの自動公開は行いません。",
    gone,
    expired,
    failures,
  };
  return {
    videos,
    playlists: playlists.map((p) => ({
      id: p.id,
      title: p.snippet?.title ?? "",
    })),
    report,
  };
}

async function main() {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error(
      "未取得: YOUTUBE_API_KEY が未設定です。docs/youtube-sync.md のサーバー用設定を確認してください。ブラウザ用 VITE_ 変数には設定しないでください。",
    );
    process.exitCode = 2;
    return;
  }
  const file = resolve("data/youtube-catalog.json");
  let previous = { videos: [] };
  try {
    previous = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT")
      throw new Error(
        "既存カタログJSONを読み込めません。先にファイルを確認してください。",
      );
  }
  // Expire stored API data before network work, including when that work fails.
  const fresh = (previous.videos ?? []).filter(
    (v) =>
      Number.isFinite(Date.parse(v.fetchedAt)) &&
      Date.now() - Date.parse(v.fetchedAt) < MAX_AGE,
  );
  if (
    fresh.length !== (previous.videos ?? []).length ||
    (previous.playlists?.length &&
      (!previous.updatedAt ||
        Date.now() - Date.parse(previous.updatedAt) >= MAX_AGE))
  ) {
    previous = {
      ...previous,
      videos: fresh,
      playlists:
        previous.updatedAt &&
        Date.now() - Date.parse(previous.updatedAt) < MAX_AGE
          ? previous.playlists
          : [],
    };
    await atomicJson(file, previous);
  }
  // Official playlist links are a reference set, not a claim of full channel coverage.
  const source = await readFile("src/data/playlists.ts", "utf8");
  const mathPlaylistIds = officialPlaylistIds(source);
  const result = await syncCatalog({
    call: createYouTubeClient(process.env.YOUTUBE_API_KEY),
    previous,
    mathPlaylistIds,
  });
  await atomicJson(file, {
    videos: result.videos,
    playlists: result.playlists,
    updatedAt: result.report.fetchedAt,
  });
  await atomicJson(resolve("data/sync-report.json"), result.report);
  console.log(JSON.stringify(result.report, null, 2));
  if (!result.report.complete) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch(async (e) => {
    await atomicJson(resolve("data/sync-report.json"), {
      fetchedAt: new Date().toISOString(),
      complete: false,
      failures: [{ stage: "sync", error: e.message }],
    }).catch(() => {});
    console.error(`取得失敗: ${e.message}`);
    process.exitCode = 1;
  });
}
