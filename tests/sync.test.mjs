import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  allPages,
  durationSeconds,
  syncCatalog,
  CHANNEL_ID,
  officialPlaylistIds,
} from "../scripts/sync-youtube.mjs";

test("ISO 8601 durations are parsed without inventing missing data", () => {
  assert.equal(durationSeconds("PT2M58S"), 178);
  assert.equal(durationSeconds("P1DT3H4M5S"), 97445);
  assert.equal(durationSeconds("PT0S"), 0);
  assert.equal(durationSeconds("P0D"), 0);
  assert.equal(durationSeconds("P"), null);
  assert.equal(durationSeconds(undefined), null);
});
test("pagination follows tokens and rejects a repeating-token response", async () => {
  assert.equal(
    officialPlaylistIds(await readFile("src/data/playlists.ts", "utf8")).size,
    33,
  );
  const items = await allPages(
    async (_r, p) =>
      p.pageToken ? { items: [2] } : { items: [1], nextPageToken: "next" },
    "playlistItems",
    {},
  );
  assert.deepEqual(items, [1, 2]);
  await assert.rejects(
    allPages(
      async () => ({ items: [], nextPageToken: "same" }),
      "playlistItems",
      {},
    ),
    /繰り返/,
  );
});
const video = (id, title) => ({
  id,
  snippet: {
    title,
    description: "",
    channelId: CHANNEL_ID,
    channelTitle: "超わかる！授業動画",
    publishedAt: "2026-10-01T00:00:00Z",
    thumbnails: { high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } },
  },
  contentDetails: { duration: "PT2M58S" },
  status: { privacyStatus: "public", embeddable: true },
});
test("uploads and playlists deduplicate by video ID; titles produce review candidates", async () => {
  let fetchedIds;
  const call = async (resource, p) => {
    if (resource === "channels")
      return {
        items: [
          {
            id: CHANNEL_ID,
            contentDetails: { relatedPlaylists: { uploads: "uploads" } },
            snippet: { title: "超わかる！授業動画" },
          },
        ],
      };
    if (resource === "playlists")
      return { items: [{ id: "math", snippet: { title: "数学Ⅰ" } }] };
    if (resource === "playlistItems")
      return p.playlistId === "uploads" && !p.pageToken
        ? {
            items: [{ contentDetails: { videoId: "first" } }],
            nextPageToken: "next",
          }
        : {
            items: [
              {
                contentDetails: {
                  videoId: p.playlistId === "math" ? "first" : "chem",
                },
              },
            ],
          };
    if (resource === "videos") {
      fetchedIds = p.id;
      return {
        items: [video("first", "数学Ⅰ 平方完成"), video("chem", "化学の基礎")],
      };
    }
    throw new Error("Unexpected resource");
  };
  const result = await syncCatalog({
    call,
    mathPlaylistIds: new Set(["math"]),
    now: new Date("2026-10-11T12:00:00Z"),
  });
  assert.equal(fetchedIds, "first,chem");
  assert.equal(result.videos.length, 2);
  assert.deepEqual(result.videos.find((v) => v.id === "first").playlistIds, [
    "math",
  ]);
  assert.equal(
    result.videos.find((v) => v.id === "first").classification,
    "needs-review",
  );
  assert.equal(
    result.videos.find((v) => v.id === "chem").inclusion,
    "non-math-candidate",
  );
  assert.equal(result.report.totalMathematicsVideos, null);
  assert.equal(result.report.publicRecordsFetched, 2);
});
test("a failed video batch is reported; only fresh previous metadata survives", async () => {
  const call = async (resource) => {
    if (resource === "channels")
      return {
        items: [
          {
            id: CHANNEL_ID,
            contentDetails: { relatedPlaylists: { uploads: "uploads" } },
          },
        ],
      };
    if (resource === "playlists") return { items: [] };
    if (resource === "playlistItems")
      return {
        items: ["fresh", "expired"].map((id) => ({
          contentDetails: { videoId: id },
        })),
      };
    throw new Error("HTTP 503");
  };
  const previous = {
    videos: [
      { id: "fresh", fetchedAt: "2026-10-10T00:00:00Z" },
      { id: "expired", fetchedAt: "2026-08-01T00:00:00Z" },
    ],
  };
  const result = await syncCatalog({
    call,
    previous,
    now: new Date("2026-10-11T00:00:00Z"),
  });
  assert.equal(result.report.complete, false);
  assert.equal(result.report.failures.length, 1);
  assert.equal(result.report.publicRecordsFetched, 0);
  assert.equal(result.report.retainedRecords, 1);
  assert.deepEqual(
    result.videos.map((v) => v.id),
    ["fresh"],
  );
  assert.deepEqual(result.report.expired, ["expired"]);
});
