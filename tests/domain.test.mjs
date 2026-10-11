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
const { topics, videos, videoTopicLinks } = await server.ssrLoadModule(
  "/src/data/catalog.ts",
);
const { officialPlaylists } = await server.ssrLoadModule(
  "/src/data/playlists.ts",
);
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
});
test("old subject metadata stays available alongside the current vector mapping", () => {
  const vector = officialPlaylists.find((p) => p.title === "ベクトル");
  assert.equal(vector.original, "B");
  assert.equal(vector.current, "C");
  const complex = officialPlaylists.find((p) => p.title === "複素数平面");
  assert.equal(complex.original, "III");
  assert.equal(complex.current, "C");
  assert.equal(officialPlaylists.length, 33);
});
test("manual video metadata does not fabricate durations, descriptions or permission", () => {
  for (const video of videos) {
    assert.equal(video.source, "manual-oembed");
    assert.equal(video.description, null);
    assert.equal(video.durationSeconds, null);
    assert.equal(video.embeddable, null);
  }
});

await server.close();
await rm(testCache, { recursive: true, force: true });
