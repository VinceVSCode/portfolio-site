// GitHub integration (FR-5). Adds live repository data to the projects page.
// The page already shows the manual data from data/projects.json, so if the
// API is unavailable or rate-limited nothing is lost. No token is used.
const CACHE_TTL_MS = 60 * 60 * 1000; // one hour
const MAX_REPOS_LISTED = 6;

const section = document.getElementById("github-repos");
const user = section?.dataset.githubUser?.trim() ?? "";

const readCache = (key) => {
  try {
    const cached = JSON.parse(localStorage.getItem(key));
    return cached && Array.isArray(cached.repos) ? cached : null;
  } catch {
    return null;
  }
};

const writeCache = (key, repos) => {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), repos }));
  } catch {
    // Storage may be full or blocked. The data is still shown for this visit.
  }
};

const loadRepos = async () => {
  const key = `github-repos:${user}`;
  const cached = readCache(key);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.repos;

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=100`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const repos = (await response.json())
      .filter((repo) => !repo.fork && !repo.private)
      .map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        updatedAt: repo.pushed_at || repo.updated_at,
      }));
    writeCache(key, repos);
    return repos;
  } catch {
    // Fall back to an expired cache if there is one.
    return cached ? cached.repos : null;
  }
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const metaText = (repo) =>
  [
    repo.language,
    `${repo.stars} ${repo.stars === 1 ? "star" : "stars"}`,
    repo.updatedAt ? `updated ${formatDate(repo.updatedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const render = (repos) => {
  const byName = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));

  for (const card of document.querySelectorAll(".card[data-repo]")) {
    const repo = byName.get(card.dataset.repo.toLowerCase());
    const meta = card.querySelector(".gh-meta");
    if (!repo || !meta) continue;
    meta.textContent = `GitHub: ${metaText(repo)}`;
    meta.hidden = false;
  }

  const list = section.querySelector(".repo-list");
  const latest = [...repos]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_REPOS_LISTED);
  if (!list || latest.length === 0) return;

  for (const repo of latest) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = repo.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;
    item.append(link);

    if (repo.description) {
      const description = document.createElement("p");
      description.textContent = repo.description;
      item.append(description);
    }
    const meta = document.createElement("p");
    meta.className = "note";
    meta.textContent = metaText(repo);
    item.append(meta);
    list.append(item);
  }
  section.hidden = false;
};

// Skip while the username is still a placeholder such as "[GITHUB USERNAME]".
if (section && user && !user.startsWith("[")) {
  const repos = await loadRepos();
  if (repos) render(repos);
}
