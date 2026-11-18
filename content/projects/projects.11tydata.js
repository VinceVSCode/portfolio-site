// Eleventy "directory data" file. Eleventy applies these settings to every
// file in content/projects/ (the case-study Markdown files) without each file
// having to repeat them.
//
// The page for a case study is written to projects/<file-name>.html, so
// content/projects/sd-01-expense-tracker.md becomes /projects/sd-01-expense-tracker.html.
export default {
  // Use the case-study layout (src/_includes/case-study.njk) for each page.
  layout: "case-study.njk",
  // permalink decides the output path. Returning false means "build no page".
  // A project marked "hidden" in data/projects.json gets no page.
  permalink: (data) => {
    const project = (data.projects || []).find((item) => item.slug === data.page.fileSlug);
    return project?.hidden ? false : `projects/${data.page.fileSlug}.html`;
  },
};
