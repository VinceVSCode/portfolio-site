// Checks internal links in the built site (_site/). Fails on links to missing
// files, missing #anchors, and root-absolute paths ("/..."), which would break
// at a GitHub Pages sub-path. External links are not fetched here.
//
// Run it after "npm run build" (npm run check:links). It is one of the steps
// in "npm run check" and in the GitHub Actions deploy workflow.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SITE_DIR = "_site"; // the folder Eleventy writes the built site to

if (!existsSync(SITE_DIR)) {
  console.error(`${SITE_DIR}/ not found. Run "npm run build" first.`);
  process.exit(1);
}

// Returns every file path under dir, including files in sub-folders.
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const htmlFiles = walk(SITE_DIR).filter((file) => file.endsWith(".html"));

// Cache of the id="..." values in each HTML file, so a file is read only once
// even when many pages link to its anchors.
const idCache = new Map();
const idsIn = (file) => {
  if (!idCache.has(file)) {
    const html = readFileSync(file, "utf8");
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return idCache.get(file);
};

const errors = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  // Collect every href="..." and src="..." value in the page.
  const links = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((match) => match[1]);

  for (const link of links) {
    // Skip external and non-file links; they are not checked here.
    if (/^(https?:|mailto:|tel:|data:)/i.test(link)) continue;
    checked++;

    if (link.startsWith("/")) {
      errors.push(`${file}: root-absolute path "${link}" (use a relative path)`);
      continue;
    }

    // Split "page.html?x#section" into the file part and the anchor part.
    const [pathPart, fragment] = link.split("#");
    const cleanPath = pathPart.split("?")[0];
    // An empty path ("#top") means the same page; otherwise resolve the link
    // relative to the folder the current HTML file is in.
    let target = cleanPath === "" ? file : path.join(path.dirname(file), decodeURIComponent(cleanPath));

    // A link to a folder ("projects/") points at that folder's index.html.
    if (existsSync(target) && statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    }
    if (!existsSync(target)) {
      errors.push(`${file}: broken link "${link}"`);
      continue;
    }
    // If the link has an anchor, the target page must contain that id.
    if (fragment && target.endsWith(".html") && !idsIn(target).has(fragment)) {
      errors.push(`${file}: anchor "#${fragment}" not found in ${target}`);
    }
  }
}

// Report every problem found, then exit with a failure code so CI stops.
if (errors.length) {
  console.error(`Link check failed with ${errors.length} problem(s):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`Link check passed: ${checked} internal links in ${htmlFiles.length} HTML files.`);
