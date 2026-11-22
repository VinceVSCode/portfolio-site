# Requirements: Personal Project Portfolio Website

> This document is the brief for anyone who works on this project.
> Read it fully before making changes. Keep it up to date when decisions change.

---

## 1. Purpose

Build a simple, fast, personal website owned by a recent computer science graduate.
The site demonstrates the owner's projects to:

- recruiters and hiring managers (fast overview, clear evidence of skills),
- technical reviewers (depth: how problems were approached, what the code looks like, what was learned),
- the general public and peers (interactive demos they can try).

The site is a showcase, not a product. It has no user accounts, no payments, and no backend data store.

---

## 2. Scope: Features Chosen by the Owner

The owner selected the following four concepts. They are combined into one site.

| Concept | Summary | Where it appears |
|---|---|---|
| **A. Classic portfolio** | Landing page with name, short bio, photo, project card grid, contact section, and links to GitHub and LinkedIn. | Home page |
| **B. Project case studies** | One dedicated page per featured project: problem, approach, tech stack, challenges, results, screenshots/diagrams. | `projects/<project-slug>.html` (or equivalent) |
| **C. Interactive demo hub** | Live, runnable, browser-based demos of selected projects (games, visualisers, small ML or data tools). | `demos/` section |
| **F. GitHub-driven stats** | Automatically pulled list of public repositories, languages and recent activity from the GitHub API. | Projects page and/or home page widget |

Features are listed in priority order in section 5.

### 2.1 Additional features selected for implementation

| Concept | Summary | Where it appears |
|---|---|---|
| **Preview deployments** | Each pull request gets a temporary preview URL so changes can be reviewed before they go live. | CI workflow; see FR-8 |
| **Auto-updating local site** | The copy on the home device updates itself when the default branch changes. | Device setup; see FR-9 |
| **Content in JSON or Markdown** | All text content is edited in data and content files, not in HTML. | `data/` and `content/`; see FR-10 |
| **Project list from repository manifests** | The build reads a `portfolio.json` manifest from each project repository, with the manual list as fallback. Decided 2026-11-14, built 2026-11-18. | Projects page and home page; see FR-11 |

---

## 3. Hosting Requirements

### 3.1 Primary: GitHub Pages (public)
- The site must be deployable to **GitHub Pages** at no cost.
- The site must be **fully static** (HTML, CSS, JavaScript, images, JSON). No server-side code is required for the primary deployment.
- Deployment must work from the default branch or a `gh-pages` branch, with the build output in the repository root or a `/docs` folder. Choose one and document it in the README.
- Use relative paths for all internal links and assets so the site works both at a GitHub Pages sub-path (`https://<user>.github.io/<repo>/`) and at the domain root.

### 3.2 Secondary: Local hosting on an owned device (future)
- The site must be servable from a **free device the owner controls** (for example an old laptop, a Raspberry Pi, or a home PC) on the home network, and optionally exposed to the internet later.
- The same static files must be served locally without modification. Do not add features that only work on GitHub Pages.
- Local serving must not require a database or a build step at runtime. The output of the build is served as-is.
- See section 7 for the proposed local hosting approach.

### 3.3 Domain and HTTPS
- GitHub Pages provides HTTPS for `*.github.io`. A custom domain is optional and not required now.
- Local hosting over plain HTTP on a home network is acceptable. Public exposure must use HTTPS (see section 7).

---

## 4. Functional Requirements

### FR-1 Home page
- Shows owner name, a one-sentence headline, a short bio (max ~120 words), and a profile photo (optional).
- Displays a grid of **featured project cards**. Each card shows: title, one-line summary, tags (languages/technologies), and links to "Case study", "Demo" (if any), and "Code".
- Has a clear contact section with email (or a contact form, see section 7), GitHub, and LinkedIn links.
- Provides a link to a downloadable CV/resume (PDF).

### FR-2 Projects list page
- Lists all projects, with filter by technology or category (client-side only).
- Shows GitHub-sourced data where available: repository description, primary language, last updated, star count.

### FR-3 Case study pages
- One page per featured project, using a common template.
- Required sections: **Problem**, **Approach**, **Execution instructions** (how to run it: the live demo, or a local, Docker or command-line run, in 10 to 20 lines), **Tech stack**, **Challenges and solutions**, **Results**, **What I learned**.
- Supports images and diagrams with alt text.
- Each page links back to the projects list and to the source repository.

### FR-4 Interactive demo hub
- A `demos/` section that lists each demo with a description, a "Launch" button, and the technology used.
- Each demo runs entirely in the browser (client-side JavaScript, WebAssembly, or a pre-computed model). No demo may require a server.
- Demos must degrade gracefully: if a demo fails to load, show a message and a link to its source code.
- Each demo is self-contained in its own folder, so it can be added or removed without changing other demos.

### FR-5 GitHub integration
- Fetches public repository data from the GitHub REST API (`https://api.github.com/users/<username>/repos`).
- Must cache results (for example in the build output as a JSON file, or in `localStorage` with an expiry) to avoid hitting GitHub's unauthenticated rate limit (60 requests/hour per IP).
- Must work if the API is unavailable: fall back to a static `projects.json` file that the owner maintains manually.
- No GitHub access token may be placed in client-side code.

### FR-6 Contact
- Provides at least one contact method. A contact form is optional and must not store data on the site (see section 7 for options).

### FR-7 Resume
- A downloadable PDF of the owner's CV, linked from the home page and the navigation bar.

### FR-8 Preview deployments
- Every pull request produces a temporary preview of the site, at its own URL, built from the pull request branch.
- The preview link is posted on the pull request so the owner can review it before merging.
- Previews are removed when the pull request is closed or merged.
- The production site (default branch) is never changed by a preview build.
- Preview pages must not be indexed by search engines (`<meta name="robots" content="noindex">`).
- GitHub Pages has no built-in pull request previews, so a tool must be chosen (section 7.5.1).

### FR-9 Auto-updating local site
- Changes merged to the default branch are applied to the copy on the home device without manual steps.
- The local web server serves the new version once the update succeeds.
- If an update or check fails, the last working version remains live.
- The update mechanism must not expose credentials or allow unauthenticated code changes.
- Mechanism options are in section 7.5.2.

### FR-10 Content in JSON or Markdown
- All text content (owner details, project entries, case study bodies, demo entries) lives in `data/*.json` or `content/*.md` files.
- HTML templates and layout code must not contain content that the owner edits regularly.
- Editing content must not require changes to layout code.
- JSON files are validated against a schema, and Markdown files have required front matter, both checked in CI.
- Format options are in section 7.5.3.

### FR-11 Project list from repository manifests (decided 2026-11-14, built 2026-11-18)
- At build time, the site finds the owner's project repositories with the GitHub search `topic:portfolio-project user:<githubUsername>`, using `githubUsername` from `data/site.json`.
- For each repository found, the build reads `portfolio.json` from the default branch. A manifest has these keys: `id` (for example `sd-01`), `title`, `track` (`software-developer` or `machine-learning`), `summary`, `skills`, `repo`, `demo_url` (a URL or `null`), `thumbnail`, `demo_media`, `run_command`, `status`, and `version`.
- Each manifest is validated against a schema stored in `data/schema/`. An invalid manifest is skipped and named in the build log. It is never shown with broken data.
- **Fallback:** `data/projects.json` stays. The build uses it alone, and must not fail, when the username is still a placeholder, when GitHub cannot be reached or rate-limits the build, or when no valid manifest is found.
- When both exist, the manifest supplies the card's title, summary, skills, track, repository link, and demo link. Entries in `data/projects.json` get a new optional `id` field (for example `sd-01`), added to the schema as part of this work. The entry with the same `id` as a manifest supplies the site-only fields (`featured`, `caseStudy`, and `demo`). Projects that are only in `data/projects.json` are still listed.
- Thumbnails are downloaded at build time and published as part of the site, so the Content-Security-Policy does not change. A card whose thumbnail is missing is shown without an image.
- The projects page has a track filter with two values: software developer and machine learning.
- The build may use the token GitHub Actions provides to the workflow. No token is stored in the repository or sent to the browser.
- The site only picks up a new project when it is rebuilt. Rebuild trigger (owner, 2026-11-18): once a day on a schedule, plus a manual "Run workflow" button, in addition to every push to `main`.
- The browser-side GitHub data in FR-5 is unchanged.
- **Do not build this until** `githubUsername` is set and at least one project repository with a manifest exists on GitHub, so it can be tested against real data.

---

## 5. Priorities

| Priority | Item | Notes |
|---|---|---|
| **P1 (must have)** | Home page with project cards (FR-1) | Core value. |
| **P1** | At least two case study pages (FR-3) | Minimum for credibility. |
| **P1** | Responsive layout (mobile to desktop) | See section 6. |
| **P1** | GitHub Pages deployment working (section 3.1) | Required to publish. |
| **P2 (should have)** | Projects list with filters (FR-2) | |
| **P2** | GitHub API integration with fallback (FR-5) | |
| **P2** | Resume download (FR-7) | |
| **P2** | Preview deployments (FR-8) | Choose tool in section 7.5.1. |
| **P2** | Content in JSON or Markdown (FR-10) | Choose format in section 7.5.3. Affects the build setup, so decide early. |
| **P2** | Project list from repository manifests (FR-11) | Built 2026-11-18. |
| **P3** | Auto-updating local site (FR-9) | Choose mechanism in section 7.5.2. Depends on local hosting. |
| **P3 (nice to have)** | Interactive demo hub (FR-4) with at least one demo | Start with one simple demo. |
| **P3** | Dark mode toggle | |
| **P3** | Local hosting setup (section 7) | Can be done after P1 and P2 are complete. |

---

## 6. Non-Functional Requirements

- **Performance:** Lighthouse performance score of 90 or above on desktop. Pages load in under 2 seconds on a typical broadband connection. Images are compressed (WebP or optimised PNG/JPEG) and sized appropriately.
- **Accessibility:** WCAG 2.1 AA as a target. Semantic HTML, alt text on images, keyboard navigable, sufficient colour contrast, visible focus states.
- **Responsiveness:** Usable from 360 px width (phone) to 1920 px (desktop).
- **Browser support:** Current versions of Chrome, Firefox, Edge, and Safari. No requirement to support Internet Explorer.
- **SEO basics:** Each page has a unique `<title>`, meta description, Open Graph tags, and a sensible heading structure.
- **Privacy:** No third-party trackers or analytics by default. If analytics are added later, they must be privacy-friendly and declared in the page footer.
- **Maintainability:** Plain files, no unnecessary frameworks. Any new dependency must be justified in this document. Content (projects, bio) should be editable without touching layout code, for example in JSON or Markdown files.
- **Security:** No secrets in the repository. No inline scripts that load from untrusted domains. Use `rel="noopener noreferrer"` on external links that open in a new tab.
- **Licensing:** Code licence and content (images, text) licence must be stated by the owner. Third-party assets must be credited.

---

## 7. Proposed Technical Approach

### 7.1 Suggested stack (default unless the owner changes it)
- **Core:** plain HTML, CSS (with CSS custom properties for theming), and vanilla JavaScript (ES modules).
- **Content:** `projects.json` for project metadata, Markdown or HTML files for case studies.
- **Optional build tool:** Astro or Eleventy (11ty) if the number of pages grows. Both output static files and deploy to GitHub Pages. Decide before adding either. Record the decision here.
- **Testing:** a simple link checker and HTML validator run in CI (GitHub Actions). Optional Lighthouse CI.

**Decision (2026-11-12):** Eleventy 3 is the build tool. Dependencies and their purpose: `@11ty/eleventy` (build), `html-validate` (HTML check), `ajv` (JSON schema check), `gray-matter` (reads Markdown front matter in the content check). The GitHub integration (FR-5) runs in the browser with a one-hour `localStorage` cache; the pages are built from `data/projects.json`, which is the fallback.

### 7.2 Repository layout (as built, 2026-11-12)

Source files (the `main` branch):

```
portfolio-site/
├── requirements.md          # this file
├── README.md                # how to run, edit content, and deploy
├── eleventy.config.js       # build configuration
├── data/
│   ├── site.json            # owner details
│   ├── projects.json        # manual project data and API fallback
│   ├── demos.json           # demo hub entries
│   └── schema/              # JSON schemas for the files above
├── content/projects/        # one Markdown file per case study
├── src/                     # page templates and layouts
├── demos/<demo-name>/       # each demo is self-contained
├── assets/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── files/               # CV PDF
├── scripts/                 # content and link checks
├── docs/projects/           # plan for the 24 projects to showcase (not part of the built site)
│   └── requirements.md      # the project list
└── .github/workflows/       # deploy and pull request previews
```

Build output (`_site/`, published to the root of the `gh-pages` branch):

```
index.html                   # home page
404.html
projects/index.html          # projects list
projects/<slug>.html         # case studies
demos/index.html             # demo hub
demos/<demo-name>/           # demos
assets/
```

### 7.3 Local hosting: how it will work (future)

The site is static, so any device that can serve files over HTTP can host it. Options, from simplest to most robust:

1. **Built-in static server (quickest for testing).** Run `python -m http.server 8000` from the site folder, or `npx serve`. Access it from the device at `http://localhost:8000`, or from another device on the home network at `http://<device-ip>:8000`. Not suitable for public exposure.
2. **Nginx or Caddy on the device (recommended for a permanent home server).**
   - Install Caddy (automatic HTTPS) or Nginx.
   - Point the web root at the site folder.
   - Caddy can obtain and renew HTTPS certificates automatically if a domain name is pointed at the home IP.
3. **Docker container.** Package the site with an Nginx image so it runs the same way on any machine. Useful if the device runs other services.
4. **Exposure to the internet from home.** Options:
   - Port forwarding on the router with a dynamic DNS service (free tiers exist). Requires caution: keep the OS and the server updated.
   - A **Cloudflare Tunnel** (`cloudflared`) or **Tailscale** (private access only). These avoid opening router ports and are strongly preferred over port forwarding.

**Hardware suggestions:** an old laptop, a Raspberry Pi 4 or 5, or a mini PC. The site itself needs very little CPU, RAM, or storage (under 100 MB including images).

**Requirements the site must meet for local hosting:**
- No hard-coded absolute URLs (use relative paths).
- No dependency on GitHub Pages-only features (such as its 404 page handling). Provide a `404.html` that works on any server.
- Serve with correct MIME types for `.js`, `.json`, `.pdf`, and `.webp`.
- Security headers recommended at the server level: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

### 7.4 Deployment workflow (proposed)
1. Edit content or code in the repository.
2. Push to the default branch.
3. GitHub Actions runs checks (HTML validation, link check) and publishes to GitHub Pages.
4. For local hosting: the device clones the `gh-pages` branch, which holds the built site, and runs a scheduled `git pull`. No build step is needed on the device. See the README.

---

### 7.5 Tool options (decide at implementation)

No tool in this section is chosen yet. At the start of implementation, the owner picks one option per area. Options marked **(recommended)** are the default suggestion. Record the choice in section 10 and in the change log.

#### 7.5.1 Preview deployments (FR-8)

| Option | What it does | Cost | Notes |
|---|---|---|---|
| **A. `rossjrw/pr-preview-action` on GitHub Pages (recommended)** | Publishes each pull request to a sub-folder of the Pages site (for example `pr-preview/pr-<number>/`) and comments the link on the pull request. | Free | Keeps everything on GitHub. Check the action's current README before use. |
| **B. Netlify deploy previews** | Builds and hosts each pull request automatically. | Free tier | Easiest setup. Adds a third-party host and an account. |
| **C. Cloudflare Pages branch previews** | Gives each branch its own preview URL. | Free tier | Similar to B. Adds a third-party host and an account. |

#### 7.5.2 Auto-updating local site (FR-9)

| Option | What it does | Notes |
|---|---|---|
| **A. Scheduled `git pull` (recommended)** | A cron job (Linux) or Task Scheduler task (Windows) runs `git pull` every few minutes. | Simple. Needs no open ports and no extra software. The web server serves the new files immediately. |
| **B. Self-hosted GitHub Actions runner** | A runner on the device executes a deploy job on each push. | Updates immediately, but runs repository code on the device. Use only for private repositories, or restrict who can trigger jobs. |
| **C. Webhook receiver** | A small service on the device receives a GitHub webhook and runs `git pull`. | Needs an inbound endpoint (a Cloudflare Tunnel works) and verification of each request's secret. |

For any option, keep the last working version if a pull or check fails. Deploying into a new folder and then switching a symlink is one way to do this.

#### 7.5.3 Content in JSON or Markdown (FR-10)

| Option | What it does | Build step | Notes |
|---|---|---|---|
| **A. Plain JSON with vanilla JavaScript** | Page scripts load `data/*.json` and fill in the HTML. | None | Works on GitHub Pages and locally with no tooling. Markdown case studies need an in-browser converter such as `marked`. |
| **B. Jekyll** | GitHub Pages builds Markdown and data files natively. | Built into GitHub Pages | Zero configuration on GitHub Pages. Locally it needs Ruby, or serve the built output folder. |
| **C. Eleventy (11ty) (recommended)** | Reads JSON and Markdown and outputs plain HTML. | Node.js, run in GitHub Actions | Flexible and small. Needs a build before deployment and before local serving. |
| **D. Astro** | Content collections with schema validation for Markdown and JSON. | Node.js | Strong validation and modern tooling. Steeper learning curve. |
| **E. Hugo** | Very fast single-binary generator for Markdown sites. | Single binary | Very fast. Themes take time to learn. |

#### 7.5.4 Supporting checks (for any choice)

| Purpose | Suggested tool |
|---|---|
| HTML validation | `html-validate` or the W3C Nu validator |
| Broken link check | `lychee` |
| JSON content validation | `ajv`, against a schema stored in `data/schema/` |
| Accessibility audit | `axe-core` (deferred, see section 9) |

## 8. Limitations and Constraints

- **GitHub Pages:** static only; no server-side code, no databases, no custom response headers (so CSP must be set with a `<meta>` tag on that platform), limited to about 1 GB per site and soft bandwidth limits.
- **GitHub API:** unauthenticated rate limit of 60 requests per hour per IP. Client-side calls must be cached.
- **Contact forms:** a static site cannot process form submissions itself. Options are a third-party form service (review its privacy terms), a `mailto:` link, or a serverless function (outside the scope of the free static setup).
- **Interactive demos:** must run in the browser. Heavy machine learning models or long-running computations must be pre-computed or reduced in size.
- **Local hosting:** home internet connections often have dynamic IP addresses, limited upload bandwidth, and occasional outages. The device must stay powered and connected for the site to be reachable. Home ISPs may restrict inbound traffic.
- **Security risk of local hosting:** exposing a home device to the internet increases attack surface. Keep the operating system and server software updated, use HTTPS, and prefer tunnels over open ports.
- **Content ownership:** the owner is responsible for ensuring images, text, and code they publish are licensed for public use, and that CV information is accurate and acceptable to share publicly.
- **Personal data:** avoid publishing home addresses, personal phone numbers, or identifiers that are not intended to be public.

---

## 9. Future Implementations (not in current scope)

- Dark mode and theme persistence.
- Multi-language support (for example English and Greek).
- Blog section using Markdown posts (idea 5 from the brainstorm, deferred).
- Academic section for thesis, publications, and posters (idea 4, deferred).
- Automated GitHub contribution graph or commit-activity chart.
- Search across projects and case studies.
- Custom domain with HTTPS, managed by Caddy or Cloudflare.
- Simple, privacy-friendly analytics (for example a self-hosted tool such as Umami or GoatCounter) running on the same home device.
- Accessibility audit with automated checks (axe-core) in CI.

---

## 10. Open Decisions (to be confirmed by the owner)

1. Deployment source: repository root or `/docs` folder for GitHub Pages?
2. Build tool: plain HTML (default) or Astro/Eleventy?
3. Owner's name, headline, bio, and photo.
4. Contact method: email link, form service, or both?
5. Which projects are featured as case studies (at least two)?
6. Which project is the first interactive demo?
7. Home-hosting target device and operating system.
8. Whether the site will eventually use a custom domain.
9. Tool choices in section 7.5: preview deployments (7.5.1), auto-updating local site (7.5.2), and content format (7.5.3). To be decided at implementation.
10. How the site gets its project list (added 2026-11-14, **decided: option B**, see 10.1 and FR-11). The owner's project plan proposes that the site finds projects by GitHub topic and reads a `portfolio.json` manifest from each repository at build time, with thumbnails and a track filter (software developer or machine learning). The site as built reads the hand-edited `data/projects.json` and adds GitHub data in the browser (FR-5). Options:
    - **A. Keep the manual list (current).** Add each finished project to `data/projects.json` by hand. No change to the site.
    - **B. Build-time manifests, with the manual list as fallback.** The build fetches the manifests and writes them into the site; `data/projects.json` is used if GitHub cannot be reached. Needs new requirements for the fetch, thumbnails (copied into the site at build time, so the Content-Security-Policy stays unchanged), and the track filter.
    - **C. Manifests only, as the plan is written.** No manual list. The build fails or shows nothing if GitHub cannot be reached, which conflicts with the fallback in FR-5.

    The owner chose B on 2026-11-14. It is specified in FR-11 and was built on 2026-11-18.

Record each decision here with the date once it is made.

### 10.1 Decisions made

| # | Decision | Date |
|---|---|---|
| 1 | Deployment source: root of a `gh-pages` branch. GitHub Actions builds the site and pushes the output there. | 2026-11-12 |
| 2 | Build tool: Eleventy (11ty). | 2026-11-12 |
| 3 | Owner's name, headline, bio, and photo: clearly marked placeholders for now. **Still open** until the owner supplies them. | 2026-11-12 |
| 4 | Contact method: email link only (plus GitHub and LinkedIn links). No form service. | 2026-11-12 |
| 5 | Featured case studies: two placeholder projects for now. **Still open** until the owner names real projects. | 2026-11-12 |
| 6 | First interactive demo: one clearly marked placeholder demo for now. **Still open** until the owner picks a project. | 2026-11-12 |
| 7 | Home-hosting device and operating system: undecided. Setup is documented for both Linux and Windows. **Still open.** | 2026-11-12 |
| 8 | Custom domain: undecided. The site uses relative paths so either works. **Still open.** | 2026-11-12 |
| 9 | Tool choices: preview deployments use `rossjrw/pr-preview-action` (7.5.1 A); the local site updates by scheduled `git pull` (7.5.2 A); content format is Eleventy (7.5.3 C). | 2026-11-12 |
| 10 | Project list: option B, build-time manifests with `data/projects.json` as fallback (FR-11). Built 2026-11-18. Rebuild trigger: daily schedule plus a manual button (owner, 2026-11-18). | 2026-11-14, 2026-11-18 |

---

## 11. Glossary

- **Static site:** a website made of files that are served as they are, with no server-side processing.
- **Case study:** a detailed page explaining one project from problem to result.
- **Reverse proxy:** a server (such as Caddy or Nginx) that receives web requests and forwards or serves them, often handling HTTPS.
- **Tunnel:** a secure outbound connection from a home device to a provider, which makes the site reachable without opening router ports.
- **GitHub Pages:** GitHub's free static hosting service.

---

## 12. Change Log

| Date | Change |
|---|---|
| 2026-11-12 | Initial requirements created. |
| 2026-11-12 | Added section 2.1 (selected features), FR-8 to FR-10, section 7.5 (tool options), and moved preview deployments, auto-update and content format out of the future list. |
| 2026-11-12 | Owner decisions recorded in section 10.1: Eleventy, `rossjrw/pr-preview-action`, scheduled `git pull`, `gh-pages` branch root, email-link contact, placeholders for owner details, case studies and first demo. |
| 2026-11-12 | First build of the site. Sections 7.1, 7.2 and 7.4 updated to match what was built. |
| 2026-11-14 | Added the owner's project plan in `docs/projects/` (the list of 24 projects). Added open decision 10 (how the site gets its project list). Section 7.2 updated. |
| 2026-11-14 | Owner chose option B for decision 10. Added FR-11 (project list from repository manifests, with the manual list as fallback), a row in section 2.1, and a P2 row in section 5. Not built yet. |
| 2026-11-15 | Added the first two real projects (SD-01 expense tracker, ML-01 tabular prediction) to `data/projects.json`, each with a case study. Project cards can now show an image: optional `thumbnail` and `thumbnailAlt` fields, plus an optional `id` that FR-11 will use to match an entry to its manifest. Project images live in `assets/img/projects/<id>/`. The two placeholder projects are still listed (decision 5 stays open). The "What I learned" sections are placeholders for the owner. The code links do not open until the repositories are pushed. |
| 2026-11-15 | Owner details set in `data/site.json`: name, headline, site description, photo, email, GitHub username and LinkedIn link. The bio is empty at the owner's request, so `bio` may now be an empty string and the home page then shows no bio. `cvFile` is now optional and is left out until the owner provides a PDF without the phone number; the site shows no CV link meanwhile. GitHub and LinkedIn are shown as buttons in the Contact section. The owner decided to host on GitHub Pages first and on a home PC later (decision 7 device still open). Still placeholders: the two licences, the "What I learned" sections, and the two placeholder projects. |
| 2026-11-15 | Decision 5 and 6 (owner): the two placeholder projects and the sample demo are hidden, not deleted, with a new optional `hidden` field; a page with nothing to list shows a short message. Projects can carry a `status` note; SD-01 and ML-01 show "Pending quality review", and their "What I learned" sections will be written after that review. Decision 3 (owner): code licence MIT, content licence CC BY 4.0; `LICENSE` added. The CV is published as a PDF with the phone number removed. |
| 2026-11-18 | FR-11 built. The build finds repositories with the topic `portfolio-project`, validates each `portfolio.json` against `data/schema/manifest.schema.json`, downloads thumbnails into the site, and merges the result with `data/projects.json` (`data/catalog.js`, `scripts/lib/`). Without GitHub it falls back to the last saved copy or to `data/projects.json` alone. The projects page has a track filter next to the technology filter. Owner decisions: rebuild daily and on demand; ten earlier repositories added with a manifest and the topic, shown with a gray "First attempt" badge. Manifest ids may now be any short name; `sd-NN` and `ml-NN` stay reserved for the planned projects. `npm test` (Node's test runner) is part of `npm run check`. |
| 2026-11-22 | Case studies gain a required "Execution instructions" section after "Approach": how to run the project (live demo, or local, Docker or command-line run) in 10 to 20 lines. Added to SD-01 and ML-01; the content check now requires it. |
| 2026-11-22 | ML-01 passed its quality review (version 1.0.1): status set to Complete (green). Its case study asks for Python 3.12 or newer and says the scripts work in the folder they are started from. |
