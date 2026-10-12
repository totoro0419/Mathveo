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
const { searchCatalog, normalizeSearch } = await server.ssrLoadModule(
  "/src/domain/search.ts",
);

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
