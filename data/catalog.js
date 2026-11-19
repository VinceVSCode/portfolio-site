// Global data "catalog": the project list every page shows (FR-11).
// It is data/projects.json merged with the portfolio.json manifests of the
// repositories that carry the "portfolio-project" topic on GitHub. If GitHub
// cannot be used, it is data/projects.json alone. See scripts/lib/.
import { readFileSync } from "node:fs";
import { mergeCatalog } from "../scripts/lib/catalog.mjs";
import { loadManifests } from "../scripts/lib/manifests.mjs";

export default async function () {
  const site = JSON.parse(readFileSync("data/site.json", "utf8"));
  const entries = JSON.parse(readFileSync("data/projects.json", "utf8"));
  return mergeCatalog(entries, await loadManifests(site.githubUsername));
}
