// Tests for the build-time manifest fetch and the catalog merge (FR-11).
// Run with `npm test`. They use a fake GitHub, never the network.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { mergeCatalog, statusLabel } from "./catalog.mjs";
import { isSafeThumbnailPath, loadManifests, manifestProblems } from "./manifests.mjs";

const temp = mkdtempSync(path.join(tmpdir(), "manifests-test-"));
after(() => rmSync(temp, { recursive: true, force: true }));
let run = 0;
const dirs = () => {
  run += 1;
  return { cacheDir: path.join(temp, `cache-${run}`), outputDir: path.join(temp, `out-${run}`) };
};

const manifest = (overrides = {}) => ({
  id: "sd-01",
  title: "Expense Tracker CLI",
  track: "software-developer",
  summary: "A command-line expense tracker.",
  skills: ["Python"],
  repo: "https://github.com/user/sd-01-expense-tracker",
  demo_url: null,
  thumbnail: "docs/media/thumbnail.png",
  demo_media: null,
  run_command: null,
  status: "complete",
  version: "1.0.1",
  ...overrides,
});

const repo = (name, created = "2025-01-01T00:00:00Z") => ({
  name,
  full_name: `user/${name}`,
  html_url: `https://github.com/user/${name}`,
  default_branch: "main",
  created_at: created,
});

// A fake fetch. `routes` maps a URL fragment to a reply: an object (JSON), a
// string (text), a Buffer (bytes) or a number (an HTTP error status).
function fakeGitHub(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const key = Object.keys(routes).find((fragment) => url.includes(fragment));
    const reply = key === undefined ? 404 : routes[key];
    if (typeof reply === "number") {
      return { ok: false, status: reply, headers: new Map([["x-ratelimit-remaining", reply === 403 ? "0" : "5"]]) };
    }
    const body = Buffer.isBuffer(reply) ? reply : Buffer.from(typeof reply === "string" ? reply : JSON.stringify(reply));
    return {
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => JSON.parse(body.toString()),
      text: async () => body.toString(),
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.length),
    };
  };
  return { fetchImpl, calls };
}

const quiet = () => {
  const lines = [];
  return { log: (line) => lines.push(line), lines };
};

describe("manifest schema", () => {
  test("accepts a complete manifest", () => {
    assert.equal(manifestProblems(manifest()), "");
  });
  test("names every problem", () => {
    const problems = manifestProblems(manifest({ track: "design", summary: "" }));
    assert.match(problems, /track/);
    assert.match(problems, /summary/);
  });
  test("requires every key, even when it is null", () => {
    const { version, ...rest } = manifest();
    assert.match(manifestProblems(rest), /version/);
  });
});

describe("thumbnail paths", () => {
  for (const good of ["docs/media/thumbnail.png", "a.JPG", "img/x.webp"]) {
    test(`accepts ${good}`, () => assert.ok(isSafeThumbnailPath(good)));
  }
  for (const bad of ["../secret.png", "/etc/x.png", "docs\\x.png", "notes.txt", "", null]) {
    test(`refuses ${bad}`, () => assert.ok(!isSafeThumbnailPath(bad)));
  }
});

describe("loadManifests", () => {
  test("finds manifests and publishes the thumbnail", async () => {
    const github = fakeGitHub({
      "search/repositories": { items: [repo("sd-01-expense-tracker")] },
      "contents/portfolio.json": manifest({ repo: "https://github.com/user/sd-01-expense-tracker" }),
      "contents/docs/media/thumbnail.png": Buffer.from([137, 80, 78, 71]),
    });
    const { log } = quiet();
    const found = await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log });
    assert.equal(found.length, 1);
    assert.equal(found[0].thumbnail, "assets/img/manifests/sd-01.png");
    assert.match(github.calls[0].url, /topic%3Aportfolio-project%20user%3Auser/);
  });

  test("skips an invalid manifest and says why", async () => {
    const github = fakeGitHub({
      "search/repositories": { items: [repo("bad")] },
      "contents/portfolio.json": manifest({ track: "design", repo: "https://github.com/user/bad" }),
    });
    const { log, lines } = quiet();
    const found = await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log });
    assert.deepEqual(found, []);
    assert.ok(lines.some((line) => line.includes("user/bad: skipped, invalid manifest") && line.includes("track")));
  });

  test("skips a manifest that is not JSON, a missing one, and one pointing elsewhere", async () => {
    const github = fakeGitHub({
      "search/repositories": { items: [repo("broken"), repo("missing"), repo("copied")] },
      "repos/user/broken/contents/portfolio.json": "{ not json",
      "repos/user/missing/contents/portfolio.json": 404,
      "repos/user/copied/contents/portfolio.json": manifest({ thumbnail: null }),
    });
    const { log, lines } = quiet();
    const found = await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log });
    assert.deepEqual(found, []);
    assert.ok(lines.some((line) => line.includes("user/broken") && line.includes("not valid JSON")));
    assert.ok(lines.some((line) => line.includes("user/missing") && line.includes("HTTP 404")));
    assert.ok(lines.some((line) => line.includes("user/copied") && line.includes("another repository")));
  });

  test("a failed thumbnail download keeps the project, without an image", async () => {
    const github = fakeGitHub({
      "search/repositories": { items: [repo("sd-01-expense-tracker")] },
      "contents/portfolio.json": manifest({ repo: "https://github.com/user/sd-01-expense-tracker" }),
      "contents/docs/media": 500,
    });
    const { log } = quiet();
    const found = await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log });
    assert.equal(found.length, 1);
    assert.equal(found[0].thumbnail, null);
  });

  test("a rate limit falls back to data/projects.json only, without failing", async () => {
    const github = fakeGitHub({ "search/repositories": 403 });
    const { log, lines } = quiet();
    const found = await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log });
    assert.deepEqual(found, []);
    assert.ok(lines.some((line) => line.includes("rate limit reached")));
  });

  test("a network error falls back to the last saved copy", async () => {
    const where = dirs();
    const ok = fakeGitHub({
      "search/repositories": { items: [repo("sd-01-expense-tracker")] },
      "contents/portfolio.json": manifest({ repo: "https://github.com/user/sd-01-expense-tracker", thumbnail: null }),
    });
    await loadManifests("user", { ...where, env: {}, fetchImpl: ok.fetchImpl, now: 0, log: () => {} });
    const offline = async () => {
      throw new TypeError("fetch failed");
    };
    const { log, lines } = quiet();
    const found = await loadManifests("user", { ...where, env: { CI: "true" }, fetchImpl: offline, now: 1, log });
    assert.equal(found.length, 1);
    assert.ok(lines.some((line) => line.includes("fetch failed") && line.includes("reusing 1 saved")));
  });

  test("reuses a fresh saved copy locally, but not in CI", async () => {
    const where = dirs();
    const github = fakeGitHub({
      "search/repositories": { items: [] },
    });
    await loadManifests("user", { ...where, env: {}, fetchImpl: github.fetchImpl, now: 1000, log: () => {} });
    await loadManifests("user", { ...where, env: {}, fetchImpl: github.fetchImpl, now: 2000, log: () => {} });
    assert.equal(github.calls.length, 1);
    await loadManifests("user", { ...where, env: { CI: "true" }, fetchImpl: github.fetchImpl, now: 3000, log: () => {} });
    assert.equal(github.calls.length, 2);
    assert.ok(existsSync(path.join(where.cacheDir, "manifests.json")));
    assert.equal(JSON.parse(readFileSync(path.join(where.cacheDir, "manifests.json"), "utf8")).savedAt, 3000);
  });

  test("sends the token when one is given, and never otherwise", async () => {
    const github = fakeGitHub({ "search/repositories": { items: [] } });
    await loadManifests("user", { ...dirs(), env: { GITHUB_TOKEN: "abc" }, fetchImpl: github.fetchImpl, log: () => {} });
    await loadManifests("user", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log: () => {} });
    assert.equal(github.calls[0].init.headers.Authorization, "Bearer abc");
    assert.equal(github.calls[1].init.headers.Authorization, undefined);
  });

  test("does nothing for a placeholder username or MANIFESTS=off", async () => {
    const github = fakeGitHub({});
    const { log } = quiet();
    assert.deepEqual(await loadManifests("[GITHUB USERNAME]", { ...dirs(), env: {}, fetchImpl: github.fetchImpl, log }), []);
    assert.deepEqual(await loadManifests("user", { ...dirs(), env: { MANIFESTS: "off" }, fetchImpl: github.fetchImpl, log }), []);
    assert.equal(github.calls.length, 0);
  });
});

describe("mergeCatalog", () => {
  const entry = {
    slug: "sd-01-expense-tracker",
    id: "sd-01",
    title: "Old title",
    summary: "Old summary",
    category: "Software development",
    tags: ["Old"],
    featured: true,
    caseStudy: true,
    status: "Complete",
    thumbnail: "assets/img/projects/sd-01/thumbnail.png",
    thumbnailAlt: "Terminal output",
    codeUrl: "https://github.com/user/sd-01-expense-tracker",
  };
  const found = (overrides, extra = {}) => ({ manifest: manifest(overrides), repoName: "repo", createdAt: null, thumbnail: null, ...extra });

  test("the manifest updates the matching entry, which keeps its site fields", () => {
    const [card] = mergeCatalog([entry], [found({ title: "New title", skills: ["Python", "OOP"] })]);
    assert.equal(card.title, "New title");
    assert.deepEqual(card.tags, ["Python", "OOP"]);
    assert.equal(card.slug, "sd-01-expense-tracker");
    assert.equal(card.featured, true);
    assert.equal(card.caseStudy, true);
    assert.equal(card.status, "Complete");
    assert.equal(card.thumbnail, entry.thumbnail);
    assert.equal(card.thumbnailAlt, "Terminal output");
  });

  test("a downloaded thumbnail replaces the local one", () => {
    const [card] = mergeCatalog([entry], [found({}, { thumbnail: "assets/img/manifests/sd-01.png" })]);
    assert.equal(card.thumbnail, "assets/img/manifests/sd-01.png");
  });

  test("entries without a manifest stay as they are", () => {
    const manual = { slug: "x", title: "X" };
    assert.deepEqual(mergeCatalog([manual], []), [{ ...manual, source: "manual" }]);
  });

  test("manifests without an entry are added: numbered first, then newest repository", () => {
    const cards = mergeCatalog(
      [],
      [
        found({ id: "older", status: "first-attempt" }, { createdAt: "2024-01-01" }),
        found({ id: "ml-02", track: "machine-learning" }),
        found({ id: "newer", status: "first-attempt" }, { createdAt: "2026-01-01" }),
      ],
    );
    assert.deepEqual(cards.map((card) => card.slug), ["ml-02", "newer", "older"]);
    assert.equal(cards[0].category, "Machine learning");
    assert.equal(cards[1].status, "First attempt");
    assert.equal(cards[1].featured, false);
    assert.equal(cards[1].caseStudy, false);
  });

  test("status labels", () => {
    assert.equal(statusLabel("complete"), "Complete");
    assert.equal(statusLabel("first-attempt"), "First attempt");
    assert.equal(statusLabel("on-hold"), "On hold");
  });
});
