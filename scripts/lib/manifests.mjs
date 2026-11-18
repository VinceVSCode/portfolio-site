// Build-time project manifests (FR-11).
//
// Finds the owner's repositories that carry the GitHub topic
// "portfolio-project", reads the portfolio.json manifest from each one,
// validates it against data/schema/manifest.schema.json, and downloads its
// thumbnail so the image is published with the site (the Content-Security-
// Policy stays unchanged).
//
// Nothing here may stop the build. If GitHub cannot be reached or rate-limits
// the build, the result is an empty list (or the last saved copy) and the site
// is built from data/projects.json alone. Every skipped repository is named in
// the build log with the reason, prefixed with [manifests].
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";

const API = "https://api.github.com";
// The topic that marks a repository as a portfolio project.
export const TOPIC = "portfolio-project";
// Manifests and thumbnails are saved here between builds (ignored by git).
const DEFAULT_CACHE_DIR = ".cache/manifests";
// Thumbnails are copied here, so the site can link to them.
const DEFAULT_OUTPUT_DIR = "_site/assets/img/manifests";
// The path templates use for those thumbnails.
const PUBLIC_DIR = "assets/img/manifests";
// On a local machine, a saved copy younger than this is reused, so repeated
// builds (and `npm start`, which rebuilds on every change) do not use up the
// GitHub API limit of 60 requests an hour. CI always fetches fresh data.
const CACHE_TTL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
const THUMBNAIL_TYPES = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

const schema = JSON.parse(readFileSync("data/schema/manifest.schema.json", "utf8"));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

// Raised for a GitHub reply that is not 2xx. The message says which request
// failed and why, for example "rate limit reached" or "HTTP 404".
export class GitHubError extends Error {
  constructor(status, url, rateLimited) {
    super(`${rateLimited ? "rate limit reached" : `HTTP ${status}`} for ${url}`);
    this.name = "GitHubError";
    this.status = status;
    this.rateLimited = rateLimited;
  }
}

// True for values not filled in yet, such as "[GITHUB USERNAME]".
const isPlaceholder = (value) =>
  typeof value !== "string" || value.trim() === "" || value.trim().startsWith("[");

// Returns why a manifest is invalid as one line, or "" when it is valid.
export function manifestProblems(manifest) {
  if (validate(manifest)) return "";
  return validate.errors
    .map((error) => `${error.instancePath || "(top level)"} ${error.message}`)
    .join("; ");
}

// A thumbnail path must stay inside the repository and be an image.
export function isSafeThumbnailPath(value) {
  if (typeof value !== "string" || value === "") return false;
  if (value.startsWith("/") || value.includes("\\") || value.split("/").includes("..")) return false;
  return THUMBNAIL_TYPES.includes(path.extname(value).toLowerCase());
}

// Asks GitHub for every repository with the topic, reads and checks each
// manifest, and downloads the thumbnails into `thumbnailDir`.
// Throws GitHubError if the search itself fails; a single bad repository is
// only logged and skipped.
export async function fetchManifests(user, { fetchImpl, token, thumbnailDir, log }) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const get = async (url, accept) => {
    const response = await fetchImpl(url, {
      headers: accept ? { ...headers, Accept: accept } : headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const rateLimited =
        (response.status === 403 || response.status === 429) &&
        response.headers?.get?.("x-ratelimit-remaining") === "0";
      throw new GitHubError(response.status, url, rateLimited);
    }
    return response;
  };

  const query = encodeURIComponent(`topic:${TOPIC} user:${user}`);
  const search = await (await get(`${API}/search/repositories?q=${query}&per_page=100`)).json();
  const raw = "application/vnd.github.raw+json";
  const found = [];
  const seenIds = new Set();

  for (const repo of search.items ?? []) {
    const where = repo.full_name;
    let manifest;
    try {
      const url = `${API}/repos/${where}/contents/portfolio.json?ref=${encodeURIComponent(repo.default_branch)}`;
      manifest = JSON.parse(await (await get(url, raw)).text());
    } catch (error) {
      const reason = error instanceof SyntaxError ? `portfolio.json is not valid JSON (${error.message})` : error.message;
      log(`${where}: skipped, ${reason}`);
      continue;
    }

    const problems = manifestProblems(manifest);
    if (problems) {
      log(`${where}: skipped, invalid manifest: ${problems}`);
      continue;
    }
    if (manifest.repo.toLowerCase() !== String(repo.html_url).toLowerCase()) {
      log(`${where}: skipped, its manifest's "repo" (${manifest.repo}) points to another repository`);
      continue;
    }
    if (seenIds.has(manifest.id)) {
      log(`${where}: skipped, the id "${manifest.id}" is already used by another repository`);
      continue;
    }
    seenIds.add(manifest.id);

    let thumbnailFile = null;
    if (manifest.thumbnail !== null) {
      if (!isSafeThumbnailPath(manifest.thumbnail)) {
        log(`${where}: thumbnail "${manifest.thumbnail}" ignored, it must be an image path inside the repository`);
      } else {
        try {
          const url = `${API}/repos/${where}/contents/${manifest.thumbnail
            .split("/")
            .map(encodeURIComponent)
            .join("/")}?ref=${encodeURIComponent(repo.default_branch)}`;
          const bytes = Buffer.from(await (await get(url, raw)).arrayBuffer());
          if (bytes.length > MAX_THUMBNAIL_BYTES) {
            log(`${where}: thumbnail ignored, it is larger than ${MAX_THUMBNAIL_BYTES / 1024 / 1024} MB`);
          } else {
            thumbnailFile = `${manifest.id}${path.extname(manifest.thumbnail).toLowerCase()}`;
            mkdirSync(thumbnailDir, { recursive: true });
            writeFileSync(path.join(thumbnailDir, thumbnailFile), bytes);
          }
        } catch (error) {
          log(`${where}: thumbnail not downloaded (${error.message}); the card is shown without an image`);
        }
      }
    }

    found.push({ manifest, repoName: repo.name, createdAt: repo.created_at ?? null, thumbnailFile });
  }
  return found;
}

// The entry point used by data/catalog.js. Returns a list of
// { manifest, repoName, createdAt, thumbnail }, where thumbnail is a site path
// such as "assets/img/manifests/sd-01.png", or null.
// Never throws: on any failure it falls back to the last saved copy, or [].
export async function loadManifests(user, options = {}) {
  const {
    env = process.env,
    fetchImpl = globalThis.fetch,
    now = Date.now(),
    cacheDir = DEFAULT_CACHE_DIR,
    outputDir = DEFAULT_OUTPUT_DIR,
    log = (message) => console.log(`[manifests] ${message}`),
  } = options;

  if (env.MANIFESTS === "off") {
    log("MANIFESTS=off, using data/projects.json only");
    return [];
  }
  if (isPlaceholder(user)) {
    log("githubUsername is not set in data/site.json, using data/projects.json only");
    return [];
  }

  const cacheFile = path.join(cacheDir, "manifests.json");
  const thumbnailDir = path.join(cacheDir, "thumbnails");
  let cached = null;
  try {
    cached = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (cached.user !== user || !Array.isArray(cached.found)) cached = null;
  } catch {
    cached = null; // no saved copy yet, or it cannot be read
  }

  let found;
  const fresh = cached && !env.CI && now - cached.savedAt < CACHE_TTL_MS;
  if (fresh) {
    found = cached.found;
    log(`reusing ${found.length} manifests saved ${Math.round((now - cached.savedAt) / 60000)} min ago`);
  } else {
    try {
      found = await fetchManifests(user, {
        fetchImpl,
        token: env.GITHUB_TOKEN || env.GH_TOKEN,
        thumbnailDir,
        log,
      });
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify({ user, savedAt: now, found }, null, 2));
      log(`found ${found.length} valid manifests with the topic "${TOPIC}"`);
    } catch (error) {
      if (cached) {
        found = cached.found;
        log(`GitHub could not be used (${error.message}); reusing ${found.length} saved manifests`);
      } else {
        log(`GitHub could not be used (${error.message}); using data/projects.json only`);
        return [];
      }
    }
  }

  // Publish the thumbnails with the site. A missing file means no image.
  return found.map((item) => {
    let thumbnail = null;
    const source = item.thumbnailFile && path.join(thumbnailDir, item.thumbnailFile);
    if (source && existsSync(source)) {
      mkdirSync(outputDir, { recursive: true });
      copyFileSync(source, path.join(outputDir, item.thumbnailFile));
      thumbnail = `${PUBLIC_DIR}/${item.thumbnailFile}`;
    }
    return { manifest: item.manifest, repoName: item.repoName, createdAt: item.createdAt, thumbnail };
  });
}
