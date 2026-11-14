// Applies to every case study in this folder.
export default {
  layout: "case-study.njk",
  permalink: (data) => `projects/${data.page.fileSlug}.html`,
};
