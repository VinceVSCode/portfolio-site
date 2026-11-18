// Eleventy configuration. Eleventy reads this file before every build and
// uses it to decide where pages come from, which helper functions templates
// can call, and where the built site is written.
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";

// Inline script for 404.html. It is inlined because a 404 page can be served
// at any URL depth, where a relative <script src> would not resolve.
// Its hash is added to that page's Content-Security-Policy.
const notFoundScript = readFileSync("src/_includes/not-found.js", "utf8")
  .replace(/\r\n/g, "\n")
  .trim();
const notFoundScriptHash =
  "sha256-" + createHash("sha256").update(notFoundScript).digest("base64");

// Used by the isPlaceholder filter. Treats empty, missing and "[...]" values
// (the template text the owner has not replaced yet) as not filled in.
const isPlaceholder = (value) =>
  typeof value !== "string" || value.trim() === "" || value.trim().startsWith("[");

// Eleventy calls this function with its config object. Everything registered
// here (copies, hooks, globals, filters) is available to the whole build.
export default function (eleventyConfig) {
  // Static files copied as they are into _site/ (no processing).
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("demos");
  eleventyConfig.addPassthroughCopy(".nojekyll"); // stops GitHub Pages running Jekyll

  // Demos marked "hidden" in data/demos.json are not published. Their folder is
  // copied by the passthrough above, so it is deleted again after the build.
  eleventyConfig.on("eleventy.after", ({ directories }) => {
    for (const demo of JSON.parse(readFileSync("data/demos.json", "utf8"))) {
      if (demo.hidden) {
        rmSync(`${directories.output}demos/${demo.slug}`, { recursive: true, force: true });
      }
    }
  });

  // Global values available to every template as variables.
  // PREVIEW=1 marks pull request preview builds (adds noindex, FR-8).
  eleventyConfig.addGlobalData("isPreview", process.env.PREVIEW === "1");
  // The 404 page's inline script and its hash, used by base.njk for the CSP.
  eleventyConfig.addGlobalData("notFoundScript", notFoundScript);
  eleventyConfig.addGlobalData("notFoundScriptHash", notFoundScriptHash);

  // Relative prefix from a page to the site root, so the site works at a
  // domain root, at a GitHub Pages sub-path, and in a preview sub-folder.
  // Example: "/projects/" -> "../", "/" -> "./".
  eleventyConfig.addFilter("rootPath", (url) => {
    const segments = String(url).split("/").filter(Boolean);
    if (!String(url).endsWith("/")) segments.pop();
    return segments.length ? "../".repeat(segments.length) : "./";
  });

  // True for values the owner has not filled in yet, such as "[EMAIL ADDRESS]".
  eleventyConfig.addFilter("isPlaceholder", isPlaceholder);

  // Entries the owner has not hidden (projects and demos).
  eleventyConfig.addFilter("visible", (list) => (list || []).filter((item) => !item.hidden));

  // Returns the item in a list whose slug matches, e.g. one project by its slug.
  eleventyConfig.addFilter("findBySlug", (list, slug) =>
    (list || []).find((item) => item.slug === slug)
  );

  // Technologies of one project, matched by the technology filter buttons.
  eleventyConfig.addFilter("projectTerms", (project) => project.tags || []);

  // Unique technologies, for the technology filter buttons.
  eleventyConfig.addFilter("filterTerms", (projects) => {
    const terms = new Set();
    for (const project of projects || []) {
      for (const tag of project.tags || []) terms.add(tag);
    }
    return [...terms].sort((a, b) => a.localeCompare(b));
  });

  // Unique tracks (categories), for the track filter buttons (FR-11).
  eleventyConfig.addFilter("trackTerms", (projects) =>
    [...new Set((projects || []).map((project) => project.category).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    )
  );

  // Folder settings. Source lives in "." and the built site goes to _site/.
  // Pages (.njk, .md) are templates; Markdown is not run through Nunjucks, but
  // HTML pages are, so {{ }} in .njk files is processed.
  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      data: "data",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
