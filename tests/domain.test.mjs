import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import katex from "katex";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testCache = await mkdtemp(join(tmpdir(), "mathveo-vite-test-"));
const server = await createServer({
  configFile: false,
  cacheDir: testCache,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
const { topics, videos, videoTopicLinks, subjects } =
  await server.ssrLoadModule("/src/data/catalog.ts");
const { officialPlaylists } = await server.ssrLoadModule(
  "/src/data/playlists.ts",
);
const { unitVideos, registeredInventory } = await server.ssrLoadModule(
  "/src/data/video-library.ts",
);
const { videoPresentation, lessonPresentations, lessonLabel } =
  await server.ssrLoadModule("/src/domain/video-title.ts");
const { searchCatalog, normalizeSearch, rankVideos } =
  await server.ssrLoadModule("/src/domain/search.ts");
const {
  learningEntries,
  resumeEntry,
  unitMaterials,
  videoMaterials,
  subjectProgress,
  primaryUnit,
  supplementalVideos,
} = await server.ssrLoadModule("/src/domain/library.ts");
const { defaultRecord } = await server.ssrLoadModule("/src/domain/types.ts");

test("all published formulas and worked examples render as strict KaTeX", () => {
  for (const t of topics) {
    assert.equal(t.validation, "verified");
    const latex = [
      ...t.formulas.map((f) => f.latex),
      ...t.explanation.flatMap((e) => (e.latex ? [e.latex] : [])),
      t.example.expression,
      ...t.example.steps.map((s) => s.latex),
      t.example.answer,
      t.example.check.expression,
    ];
    for (const expression of latex)
      assert.doesNotThrow(() =>
        katex.renderToString(expression, {
          throwOnError: true,
          strict: "error",
          trust: false,
        }),
      );
  }
});
test("video IDs are unique and all many-to-many relationships resolve", () => {
  assert.equal(new Set(videos.map((v) => v.id)).size, videos.length);
  assert.equal(new Set(topics.map((t) => t.id)).size, topics.length);
  for (const link of videoTopicLinks) {
    assert.ok(videos.find((v) => v.id === link.videoId));
    assert.ok(topics.find((t) => t.id === link.topicId));
    assert.notEqual(link.relation, "direct");
    assert.ok(link.evidence);
  }
  assert.ok(
    videoTopicLinks.filter((l) => l.videoId === "ssuKwW6MBvo").length > 1,
  );
});
test("search normalizes Japanese width and quadratic notation; indexes example prose", () => {
  assert.equal(normalizeSearch("２次関数"), normalizeSearch("二次関数"));
  assert.equal(searchCatalog("２次関数").topics.length, 3);
  assert.ok(
    searchCatalog("最小値").topics.find((t) => t.id === "maximum-minimum"),
  );
  assert.ok(
    searchCatalog("定数の 5").topics.find((t) => t.id === "completing-square"),
  );
  assert.ok(
    searchCatalog("開区間").topics.find((t) => t.id === "maximum-minimum"),
  );
  assert.equal(searchCatalog("存在しない数学語abcdef").topics.length, 0);
  assert.ok(
    searchCatalog("一次関数").playlists.find((p) => p.title === "１次関数"),
  );
  assert.ok(
    searchCatalog("正負の数").playlists.find(
      (p) => p.title === "正の数と負の数",
    ),
  );
  assert.ok(
    searchCatalog("数学2 三角関数").playlists.find((p) => p.current === "II"),
  );
});
test("old subject metadata stays available alongside the current vector mapping", () => {
  const vector = officialPlaylists.find((p) => p.title === "ベクトル");
  assert.equal(vector.original, "B");
  assert.equal(vector.current, "C");
  const complex = officialPlaylists.find((p) => p.title === "複素数平面");
  assert.equal(complex.original, "III");
  assert.equal(complex.current, "C");
  assert.equal(officialPlaylists.length, 45);
  assert.equal(new Set(officialPlaylists.map((p) => p.id)).size, 45);
  assert.equal(
    officialPlaylists.filter((p) => p.current === "junior").length,
    12,
  );
  for (const p of officialPlaylists) {
    assert.ok(subjects.find((s) => s.id === p.original));
    assert.ok(subjects.find((s) => s.id === p.current));
  }
});
test("manual video metadata does not fabricate durations, descriptions or permission", () => {
  for (const video of videos) {
    assert.ok(
      ["manual-oembed", "youtube-oembed", "youtube-iframe-api"].includes(
        video.source,
      ),
    );
    assert.equal(video.description, null);
    assert.equal(video.durationSeconds, null);
    assert.equal(video.embeddable, null);
  }
});

test("every imported unit resolves all individual videos, including later lessons", () => {
  assert.equal(registeredInventory.units.length, 45);
  assert.equal(registeredInventory.videos.length, 1022);
  const ids = new Set(registeredInventory.videos.map((v) => v.id));
  assert.equal(ids.size, registeredInventory.videos.length);
  for (const unit of registeredInventory.units) {
    assert.ok(officialPlaylists.some((p) => p.id === unit.id));
    assert.ok(unit.videoIds.length > 1, "a unit must expose later lessons");
    const lessons = unitVideos(unit.id);
    assert.deepEqual(
      lessons.map((v) => v.id),
      unit.videoIds,
    );
    for (const video of lessons) {
      assert.match(video.id, /^[A-Za-z0-9_-]{11}$/);
      assert.ok(video.playlistIds.includes(unit.id));
      assert.ok(video.title.trim());
    }
  }
  const trig = officialPlaylists.find(
    (p) => p.current === "II" && p.title === "三角関数",
  );
  const later = unitVideos(trig.id)[1];
  assert.ok(searchCatalog(later.title).videos.some((v) => v.id === later.id));
});

test("all 1024 video IDs survive; supplemental videos do not displace official lessons", () => {
  assert.equal(videos.length, 1024);
  for (const imported of registeredInventory.videos) {
    assert.deepEqual(
      videos.find((video) => video.id === imported.id),
      imported,
    );
  }
  const exercise = videos.find((video) => video.id === "P84CrKaIob0");
  assert.equal(unitVideos(primaryUnit(exercise).id)[5].id, exercise.id);
  assert.deepEqual(
    new Set(supplementalVideos("I").map((video) => video.id)),
    new Set(["ssuKwW6MBvo", "jTx2zwMW6Ho"]),
  );
  assert.ok(
    supplementalVideos("special").some((video) => video.id === "jTx2zwMW6Ho"),
  );
});

test("search ranks direct title matches first and does not depend on registration order", () => {
  const forward = rankVideos("平方完成", videos);
  const reversed = rankVideos("平方完成", [...videos].reverse());
  assert.deepEqual(
    forward.map((video) => video.id),
    reversed.map((video) => video.id),
  );
  assert.equal(videoPresentation(forward[0]).title, "平方完成");
  assert.ok(primaryUnit(forward[0]));
  assert.notEqual(forward[0].id, "P84CrKaIob0");
  assert.notEqual(forward[0].id, "ssuKwW6MBvo");
  assert.equal(rankVideos("2017")[0].id, "jTx2zwMW6Ho");
  assert.equal(searchCatalog(" ").videos.length, 0);
});

test("history reads existing video and topic keys without changing notes or positions", () => {
  const trig = officialPlaylists.find(
    (unit) => unit.current === "II" && unit.title === "三角関数",
  );
  const video = unitVideos(trig.id)[1];
  const videoKey = `video:${video.id}`;
  const topicKey = `topic:${topics[0].id}`;
  const records = {
    [videoKey]: {
      ...defaultRecord(videoKey),
      status: "learning",
      position: 83,
      duration: 189,
      note: "既存のメモ",
      review: true,
      updatedAt: 100,
    },
    [topicKey]: {
      ...defaultRecord(topicKey),
      status: "learning",
      updatedAt: 200,
    },
  };
  const before = JSON.stringify(records);
  const entries = learningEntries(records);
  assert.equal(entries.length, 2);
  assert.equal(resumeEntry(entries).key, videoKey);
  assert.ok(resumeEntry(entries).href.includes(video.id));
  assert.ok(resumeEntry(entries).href.includes(trig.id));
  assert.equal(
    entries.find((entry) => entry.key === videoKey).record.position,
    83,
  );
  assert.equal(
    entries.find((entry) => entry.key === videoKey).record.note,
    "既存のメモ",
  );
  assert.equal(JSON.stringify(records), before);
  assert.equal(learningEntries({}).length, 0);
  assert.equal(resumeEntry([]), undefined);
});

test("materials attach by unit ID and progress counts unique videos rather than three prototype topics", () => {
  const quadratic = officialPlaylists.find((unit) => unit.title === "２次関数");
  assert.equal(unitMaterials(quadratic.id).length, 3);
  assert.equal(videoMaterials(unitVideos(quadratic.id)[4]).length, 3);
  const currentC = officialPlaylists.filter((unit) => unit.current === "C");
  const allIds = new Set(
    currentC.flatMap((unit) => unitVideos(unit.id).map((video) => video.id)),
  );
  const completedKey = `video:${[...allIds][0]}`;
  const records = {
    [completedKey]: {
      ...defaultRecord(completedKey),
      status: "completed",
      updatedAt: 100,
    },
  };
  assert.equal(subjectProgress("C", records).total, allIds.size);
  assert.equal(subjectProgress("C", records).completed, 1);
  assert.equal(subjectProgress("B", records, "official").completed, 1);
  assert.equal(unitMaterials(currentC[0].id).length, 0);
});

test("editorial titles keep the source and distinguish lessons without guessing", () => {
  const title =
    "【慶応大】平方完成【超わかる！高校数学Ⅰ・A】～演習～２次関数＃６";
  const video = { id: "P84CrKaIob0", title };
  assert.equal(videoPresentation(video).title, "平方完成（慶応大）");
  assert.equal(videoPresentation(video).kind, "演習");
  assert.equal(video.title, title);
  const duplicate = [
    { id: "first", title: "二項定理【高校数学】式と証明＃１" },
    { id: "second", title: "二項定理【高校数学】式と証明＃２" },
  ];
  const labels = lessonPresentations(duplicate);
  assert.equal(labels[0].kind, null);
  assert.equal(lessonLabel(labels[0]), "その1");
  assert.equal(lessonLabel(labels[1]), "その2");
  const power = {
    id: "power",
    title: "xⁿの導関数の公式【高校数学】微分法＃３",
  };
  assert.equal(videoPresentation(power).title, "xⁿの導関数の公式");
  for (const video of videos) {
    const label = videoPresentation(video);
    assert.ok(label.title.trim());
    assert.ok(!label.title.includes("超わかる！"));
  }
});

await server.close();
await rm(testCache, { recursive: true, force: true });
