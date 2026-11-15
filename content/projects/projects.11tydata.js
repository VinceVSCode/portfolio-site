// Applies to every case study in this folder.
export default {
  layout: "case-study.njk",
  // A project marked "hidden" in data/projects.json gets no page.
  permalink: (data) => {
    const project = (data.projects || []).find((item) => item.slug === data.page.fileSlug);
    return project?.hidden ? false : `projects/${data.page.fileSlug}.html`;
  },
};
