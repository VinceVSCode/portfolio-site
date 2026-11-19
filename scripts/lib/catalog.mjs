// Merges the hand-written project list (data/projects.json) with the
// manifests found on GitHub (FR-11). The result is the list every page shows.
//
// - An entry in data/projects.json with the same `id` as a manifest is
//   updated from the manifest: title, summary, skills (tags), track
//   (category), repository link and demo link. The entry keeps its site-only
//   fields: slug, featured, caseStudy, demo, hidden, status, and its own
//   image if the manifest has none.
// - Entries without a matching manifest are listed as they are.
// - Manifests without an entry are added after them: the numbered projects
//   (sd-01, ml-02, ...) first, then earlier work, newest repository first.
//   (Creation date, not last push: adding a manifest is itself a push.)

// Track values in manifests, and the label shown on the site.
export const TRACK_LABELS = {
  "software-developer": "Software development",
  "machine-learning": "Machine learning",
};

// Manifest status values, and the badge text shown on the site.
// The badge colour comes from the text: "Complete" is green and
// "First attempt" is gray (see .status-* in assets/css/site.css).
export const STATUS_LABELS = {
  complete: "Complete",
  "in-progress": "In progress",
  "first-attempt": "First attempt",
};

export const statusLabel = (status) =>
  STATUS_LABELS[status] ?? status.replace(/-/g, " ").replace(/^./, (first) => first.toUpperCase());

const NUMBERED_ID = /^(sd|ml)-\d{2}$/;

// The fields a manifest supplies to a card.
function fromManifest({ manifest, repoName, thumbnail }) {
  const fields = {
    title: manifest.title,
    summary: manifest.summary,
    tags: manifest.skills,
    category: TRACK_LABELS[manifest.track],
    codeUrl: manifest.repo,
    repo: repoName,
    source: "manifest",
  };
  if (manifest.demo_url) fields.demoUrl = manifest.demo_url;
  if (thumbnail) {
    fields.thumbnail = thumbnail;
    fields.thumbnailAlt = `Image from the ${manifest.title} project`;
  }
  return fields;
}

// Numbered projects by id, then earlier work by creation date, newest first.
function order(a, b) {
  const aNumbered = NUMBERED_ID.test(a.manifest.id);
  const bNumbered = NUMBERED_ID.test(b.manifest.id);
  if (aNumbered !== bNumbered) return aNumbered ? -1 : 1;
  if (aNumbered) return a.manifest.id.localeCompare(b.manifest.id);
  return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
}

export function mergeCatalog(entries, found) {
  const byId = new Map(found.map((item) => [item.manifest.id, item]));
  const used = new Set();

  const merged = entries.map((entry) => {
    const item = entry.id ? byId.get(entry.id) : undefined;
    if (!item) return { ...entry, source: "manual" };
    used.add(entry.id);
    const fields = fromManifest(item);
    return {
      ...entry,
      ...fields,
      // The entry's own image text describes the picture better.
      thumbnail: fields.thumbnail ?? entry.thumbnail,
      thumbnailAlt: entry.thumbnailAlt ?? fields.thumbnailAlt,
      // A status written on the site (for example "Pending quality review")
      // wins over the manifest's.
      status: entry.status ?? statusLabel(item.manifest.status),
    };
  });

  const slugs = new Set(entries.map((entry) => entry.slug));
  const added = found
    .filter((item) => !used.has(item.manifest.id) && !slugs.has(item.manifest.id))
    .sort(order)
    .map((item) => ({
      slug: item.manifest.id,
      id: item.manifest.id,
      featured: false,
      caseStudy: false,
      ...fromManifest(item),
      status: statusLabel(item.manifest.status),
    }));

  return [...merged, ...added];
}
