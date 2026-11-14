// Checks internal links in the built site (_site/). Fails on links to missing
// files, missing #anchors, and root-absolute paths ("/..."), which would break
// at a GitHub Pages sub-path. External links are not fetched here.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SITE_DIR = "_site";

if (!existsSync(SITE_DIR)) {
  console.error(`${SITE_DIR}/ not found. Run "npm run build" first.`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const htmlFiles = walk(SITE_DIR).filter((file) => file.endsWith(".html"));
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
  const links = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((match) => match[1]);

  for (const link of links) {
    if (/^(https?:|mailto:|tel:|data:)/i.test(link)) continue;
    checked++;

    if (link.startsWith("/")) {
      errors.push(`${file}: root-absolute path "${link}" (use a relative path)`);
      continue;
    }

    const [pathPart, fragment] = link.split("#");
    const cleanPath = pathPart.split("?")[0];
    let target = cleanPath === "" ? file : path.join(path.dirname(file), decodeURIComponent(cleanPath));

    if (existsSync(target) && statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    }
    if (!existsSync(target)) {
      errors.push(`${file}: broken link "${link}"`);
      continue;
    }
    if (fragment && target.endsWith(".html") && !idsIn(target).has(fragment)) {
      errors.push(`${file}: anchor "#${fragment}" not found in ${target}`);
    }
  }
}

if (errors.length) {
  console.error(`Link check failed with ${errors.length} problem(s):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`Link check passed: ${checked} internal links in ${htmlFiles.length} HTML files.`);
