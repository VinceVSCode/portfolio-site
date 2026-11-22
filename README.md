# Portfolio site

A static personal portfolio website, built with [Eleventy](https://www.11ty.dev/). The full brief is in [requirements.md](requirements.md).

To change the text, see "Edit content" below.

## Licence

The code is under the [MIT licence](LICENSE). The content (text and images) is under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Documents

| File | What it is |
|---|---|
| [requirements.md](requirements.md) | The brief for this website |
| [docs/projects/requirements.md](docs/projects/requirements.md) | The 24 projects to build and showcase |

The 24 projects are built in their own folders and repositories, not in this one.

## Run it locally

You need [Node.js](https://nodejs.org/) (LTS).

```bash
npm install
```

```bash
npm start
```

`npm start` builds the site and serves it at `http://localhost:8080`, rebuilding when files change.

To build once, run `npm run build`. The finished site is written to `_site/`. Any static file server can serve that folder, for example `python -m http.server 8000 --directory _site`.

## Check it

```bash
npm run check
```

This runs, in order:

1. `npm test`: unit tests for the project list built from GitHub manifests (`scripts/lib/*.test.mjs`). They use a fake GitHub and never the network.
2. `npm run validate:content`: validates `data/*.json` against the schemas in `data/schema/` (with `ajv`), and checks that each case study has its front matter and required sections.
3. `npm run build`: builds the site.
4. `npm run validate:html`: validates the built HTML (with `html-validate`).
5. `npm run check:links`: checks internal links and anchors in `_site/`, and rejects root-absolute paths.

## Edit content

All text you edit lives in `data/` and `content/`. You do not need to touch the templates in `src/`.

| To change | Edit |
|---|---|
| Name, headline, bio, photo, email, GitHub username, LinkedIn, CV file, licences | `data/site.json` |
| Project cards (home page and projects list) | `portfolio.json` in each project repository, plus `data/projects.json` (see "Project list" below) |
| Case study text | `content/projects/<slug>.md` |
| Demo hub entries | `data/demos.json` |

Notes:

- **Placeholders.** A value that starts with `[` is treated as "not set". The site shows it as highlighted text and does not turn it into a link.
- **Bio.** Leave `bio` as an empty string (`""`) to show no bio on the home page.
- **Photo.** Put the image in `assets/img/` and set `photo` and `photoAlt` in `data/site.json`. Remove the `photo` line to show no photo.
- **CV.** Put the PDF in `assets/files/` and set `cvFile` in `data/site.json`. If `cvFile` is left out, the site shows no CV link.
- **Add a project.** Usually nothing to do here: see "Project list" below. Add an entry to `data/projects.json` only to give a project a case study, a demo, a status note, or a place on the home page (`featured`).
- **Project images.** Put a project's images in `assets/img/projects/<id>/` (for example `assets/img/projects/sd-01/`). To show one on the card, set `thumbnail` to its path and `thumbnailAlt` to a short description. The card image should be 1200×630 pixels. In a case study, link an image as `../assets/img/projects/<id>/<file>`.
- **Project status.** Set `status` on a project (for example `"Pending quality review"`) to show a short note on its card and case study. `"Complete"` is shown in green, any other value in yellow. Remove the line when it no longer applies.
- **Hide a project or a demo.** Set `"hidden": true` on its entry. A hidden project has no card and no case study page; a hidden demo is not listed and its folder is not published. The two placeholder projects and the sample demo are hidden. A page with nothing to list shows a short message instead.
- **Add a case study.** Create `content/projects/<slug>.md`, with the same slug as the project, and set `caseStudy` to `true` on the project. The file needs `title` and `summary` in its front matter and these seven headings: `## Problem`, `## Approach`, `## Execution instructions`, `## Tech stack`, `## Challenges and solutions`, `## Results`, `## What I learned`. Give every image alt text.
- **Add a demo.** Create a folder `demos/<slug>/` with its own `index.html`, scripts and styles, and add an entry to `data/demos.json`. Each demo is self-contained. To remove a demo, delete its folder and its entry. `demos/sample-sort/` is a placeholder to copy from.
- **GitHub data.** Once `githubUsername` is set, the projects page loads your public repositories from the GitHub API in the visitor's browser and caches them for one hour. A project card shows live GitHub data if its `repo` field matches a repository name. If the API is unavailable, the page shows only the data from `data/projects.json`. No access token is used.

## Repository layout

```
portfolio-site/
├── data/                  # content: site.json, projects.json, demos.json
│   └── schema/            # JSON schemas used by the content check
├── content/projects/      # content: one Markdown file per case study
├── src/                   # page templates and layouts (Nunjucks)
│   └── _includes/
├── assets/                # CSS, JavaScript, images, CV (copied as they are)
├── demos/<slug>/          # self-contained demos (copied as they are)
├── scripts/               # content and link checks
├── docs/projects/         # plan for the 24 projects to showcase (not published)
├── .github/workflows/     # deploy and pull request preview workflows
├── eleventy.config.js
└── _site/                 # build output (not committed)
```

## Project list

The cards come from two places, merged at build time (`data/catalog.js`):

1. **GitHub.** The build searches for your repositories with the topic `portfolio-project` and reads the `portfolio.json` in each one. A manifest that does not match `data/schema/manifest.schema.json` is skipped, and the build log says why (lines starting with `[manifests]`). Thumbnails are downloaded and published with the site.
2. **`data/projects.json`.** An entry with the same `id` as a manifest adds the site-only fields: `slug`, `featured`, `caseStudy`, `demo`, `status`, `hidden`. The manifest supplies the title, summary, skills, track and links. Entries without a manifest are shown as they are.

To add a project: give its repository a valid `portfolio.json` and the topic `portfolio-project`. It appears after the next rebuild: every push to `main`, once a day, or straight away with **Actions > Deploy > Run workflow** on GitHub.

The manifest's `status` sets the badge for projects without an entry: `complete` (green), `in-progress` (yellow), `first-attempt` (gray, used for earlier work).

If GitHub cannot be reached or rate-limits the build, the build uses the last saved copy (in `.cache/`, not committed) or `data/projects.json` alone, and never fails. Locally, a saved copy is reused for one hour. GitHub allows 60 anonymous requests an hour and a build makes about 15; to build more often, run `GITHUB_TOKEN=$(gh auth token) npm run check`, or set `MANIFESTS=off` to skip GitHub. The token is only sent to `api.github.com` and is never written to a file.

## Deploy to GitHub Pages

The site is published at <https://vincevscode.github.io/portfolio-site/>. The one-time setup below is already done; it is kept for reference.

The site is published from the **root of the `gh-pages` branch**. You never edit that branch by hand. The `Deploy` workflow builds the site and pushes the output there on every push to `main`, once a day, and when started by hand. GitHub pauses scheduled workflows in a repository with no activity for 60 days; a push or a manual run starts them again.

One-time setup on GitHub:

1. Create the repository and push the `main` branch.
2. In **Settings > Actions > General > Workflow permissions**, select **Read and write permissions**.
3. Wait for the first `Deploy` run to finish. It creates the `gh-pages` branch.
4. In **Settings > Pages**, set **Source** to **Deploy from a branch**, and choose `gh-pages` and `/ (root)`. Do not choose "GitHub Actions" as the source: pull request previews do not work with it.

### Pull request previews

The `Deploy PR previews` workflow uses [`rossjrw/pr-preview-action`](https://github.com/rossjrw/pr-preview-action). For each pull request it publishes a preview to `pr-preview/pr-<number>/` on the Pages site and comments the link on the pull request. The preview is removed when the pull request is closed or merged. Preview pages carry `noindex`. Pull requests from forks do not get previews.

## Host it on a home device

The home device serves the built site, so it needs Git and a web server, but not Node.js.

1. Clone only the published branch:

   ```bash
   git clone --branch gh-pages --single-branch https://github.com/<user>/<repo>.git portfolio-live
   ```

2. Point a web server at the `portfolio-live` folder. For a quick test, run `python -m http.server 8000 --directory portfolio-live`. For a permanent server, use Caddy or Nginx (see section 7.3 of the requirements), configure it to serve `404.html` for missing pages, and do not serve the `.git` folder.

3. Schedule an update every few minutes. If a pull fails, the files stay as they were, so the last working version remains live.

   Linux (add with `crontab -e`):

   ```
   */5 * * * * git -C /path/to/portfolio-live pull --ff-only --quiet
   ```

   Windows (run once in a terminal):

   ```
   schtasks /Create /TN "Portfolio site update" /SC MINUTE /MO 5 /TR "git -C C:\path\to\portfolio-live pull --ff-only --quiet"
   ```

A public repository needs no credentials for this. Do not store a token on the device. Do not expose the device to the internet without HTTPS (see sections 7.3 and 8 of the requirements).

## Known limits

- `og:image` and `og:url` tags are not set, because they need an absolute URL and the site must work at any address without changes.
- GitHub Pages cannot send security headers, so the Content-Security-Policy is set with a `<meta>` tag. On a home server, also set the headers listed in section 7.3 of the requirements.
- There is no dark mode. It is listed as future work in section 9 of the requirements.
