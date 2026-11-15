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

const isPlaceholder = (value) =>
  typeof value !== "string" || value.trim() === "" || value.trim().startsWith("[");

export default function (eleventyConfig) {
  // Static files copied as they are.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("demos");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // Demos marked "hidden" in data/demos.json are not published.
  eleventyConfig.on("eleventy.after", ({ directories }) => {
    for (const demo of JSON.parse(readFileSync("data/demos.json", "utf8"))) {
      if (demo.hidden) {
        rmSync(`${directories.output}demos/${demo.slug}`, { recursive: true, force: true });
      }
    }
  });

  // PREVIEW=1 marks pull request preview builds (adds noindex, FR-8).
  eleventyConfig.addGlobalData("isPreview", process.env.PREVIEW === "1");
  eleventyConfig.addGlobalData("notFoundScript", notFoundScript);
  eleventyConfig.addGlobalData("notFoundScriptHash", notFoundScriptHash);

  // Relative prefix from a page to the site root, so the site works at a
  // domain root, at a GitHub Pages sub-path, and in a preview sub-folder.
  eleventyConfig.addFilter("rootPath", (url) => {
    const segments = String(url).split("/").filter(Boolean);
    if (!String(url).endsWith("/")) segments.pop();
    return segments.length ? "../".repeat(segments.length) : "./";
  });

  // True for values the owner has not filled in yet, such as "[EMAIL ADDRESS]".
  eleventyConfig.addFilter("isPlaceholder", isPlaceholder);

  // Entries the owner has not hidden (projects and demos).
  eleventyConfig.addFilter("visible", (list) => (list || []).filter((item) => !item.hidden));

  eleventyConfig.addFilter("findBySlug", (list, slug) =>
    (list || []).find((item) => item.slug === slug)
  );

  // Category and technologies of one project, matched by the filter buttons.
  eleventyConfig.addFilter("projectTerms", (project) => [
    project.category,
    ...(project.tags || []),
  ]);

  // Unique technologies and categories, for the project filter buttons.
  eleventyConfig.addFilter("filterTerms", (projects) => {
    const terms = new Set();
    for (const project of projects || []) {
      if (project.category) terms.add(project.category);
      for (const tag of project.tags || []) terms.add(tag);
    }
    return [...terms].sort((a, b) => a.localeCompare(b));
  });

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
