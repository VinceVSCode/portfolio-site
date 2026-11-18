// GitHub integration (FR-5). Adds live repository data to the projects page.
// The page already shows the manual data from data/projects.json, so if the
// API is unavailable or rate-limited nothing is lost. No token is used.
// How long saved repository data is reused before asking GitHub again.
const CACHE_TTL_MS = 60 * 60 * 1000; // one hour
// How many recently updated repositories are listed in the "Recently updated" section.
const MAX_REPOS_LISTED = 6;

// The <section id="github-repos"> in projects.njk. Its data-github-user
// attribute holds the GitHub username from data/site.json.
const section = document.getElementById("github-repos");
const user = section?.dataset.githubUser?.trim() ?? "";

// Reads the saved repository list from localStorage. Returns null if nothing
// is saved, the saved value is not in the expected shape, or storage is blocked.
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

// Returns the list of repositories to show: a fresh cached copy if there is
// one, otherwise a new request to the GitHub API. Returns null on failure
// with no cache to fall back on.
const loadRepos = async () => {
  const key = `github-repos:${user}`;
  const cached = readCache(key);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.repos;

  try {
    // Public, unauthenticated request. Only the fields below are kept, and
    // forks and private repositories are dropped.
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

// Formats an ISO date string for display, for example "Mar 4, 2026".
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

// The one-line summary under a repository: "TypeScript · 3 stars · updated ...".
const metaText = (repo) =>
  [
    repo.language,
    `${repo.stars} ${repo.stars === 1 ? "star" : "stars"}`,
    repo.updatedAt ? `updated ${formatDate(repo.updatedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

// Puts the GitHub data on the page in two places: a meta line on each project
// card whose data-repo matches a repository name, and a "Recently updated"
// list at the bottom of the page.
const render = (repos) => {
  const byName = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));

  // Step 1: add a "GitHub: ..." line to matching project cards.
  for (const card of document.querySelectorAll(".card[data-repo]")) {
    const repo = byName.get(card.dataset.repo.toLowerCase());
    const meta = card.querySelector(".gh-meta");
    if (!repo || !meta) continue;
    meta.textContent = `GitHub: ${metaText(repo)}`;
    meta.hidden = false;
  }

  // Step 2: build the list of the most recently pushed repositories.
  const list = section.querySelector(".repo-list");
  const latest = [...repos]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_REPOS_LISTED);
  if (!list || latest.length === 0) return;

  // Elements are built with createElement and textContent (not innerHTML), so
  // repository text from GitHub is never treated as HTML.
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
