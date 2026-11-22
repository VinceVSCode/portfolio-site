// Validates content files (FR-10): JSON against the schemas in data/schema/,
// and Markdown case studies for required front matter and sections (FR-3).
//
// Run with "npm run validate:content". It is the first step of "npm run check".
// It exits with a failure code and lists every problem it finds, so a broken
// data file is caught before the site is built.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import matter from "gray-matter";

// Headings every case study must contain as "## Heading" lines.
const REQUIRED_SECTIONS = [
  "Problem",
  "Approach",
  "Execution instructions",
  "Tech stack",
  "Challenges and solutions",
  "Results",
  "What I learned",
];
// Front matter (the YAML block at the top of a .md file) fields that must be
// present and non-empty.
const REQUIRED_FRONT_MATTER = ["title", "summary"];
const MIN_CASE_STUDIES = 2;

const errors = [];
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const ajv = new Ajv({ allErrors: true }); // allErrors: report all schema problems, not just the first

// Step 1: check each JSON data file against its JSON Schema.
const data = {};
for (const name of ["site", "projects", "demos"]) {
  const file = `data/${name}.json`;
  try {
    data[name] = readJson(file);
  } catch (error) {
    errors.push(`${file}: cannot be read as JSON (${error.message})`);
    continue;
  }
  const validate = ajv.compile(readJson(`data/schema/${name}.schema.json`));
  if (!validate(data[name])) {
    for (const issue of validate.errors) {
      errors.push(`${file}${issue.instancePath || ""}: ${issue.message}`);
    }
  }
}

// Use empty lists if a file failed to load, so the checks below still run.
const projects = Array.isArray(data.projects) ? data.projects : [];
const demos = Array.isArray(data.demos) ? data.demos : [];

// Step 2: slugs are used as IDs in URLs and file names, so they must be unique
// within each list.
for (const [label, list] of [["projects", projects], ["demos", demos]]) {
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item.slug)) errors.push(`data/${label}.json: duplicate slug "${item.slug}"`);
    seen.add(item.slug);
  }
}

// Step 3: cross-references between files. Each reference must point at a file
// or entry that actually exists.
const demoSlugs = new Set(demos.map((demo) => demo.slug));
for (const project of projects) {
  if (project.caseStudy && !existsSync(`content/projects/${project.slug}.md`)) {
    errors.push(`data/projects.json: "${project.slug}" has caseStudy true but content/projects/${project.slug}.md is missing`);
  }
  if (project.thumbnail && !existsSync(project.thumbnail)) {
    errors.push(`data/projects.json: "${project.slug}" thumbnail "${project.thumbnail}" does not exist`);
  }
  if (project.demo && !demoSlugs.has(project.demo)) {
    errors.push(`data/projects.json: "${project.slug}" refers to demo "${project.demo}", which is not in data/demos.json`);
  }
}
for (const demo of demos) {
  if (!existsSync(`demos/${demo.slug}/index.html`)) {
    errors.push(`data/demos.json: demos/${demo.slug}/index.html is missing`);
  }
}
if (data.site?.cvFile && !existsSync(data.site.cvFile)) {
  errors.push(`data/site.json: cvFile "${data.site.cvFile}" does not exist`);
}
if (data.site?.photo && !existsSync(data.site.photo)) {
  errors.push(`data/site.json: photo "${data.site.photo}" does not exist`);
}

// Step 4: Markdown case studies in content/projects/. Each file is named after
// its project slug (for example sd-01-expense-tracker.md).
const caseStudyDir = "content/projects";
const caseStudies = readdirSync(caseStudyDir).filter((file) => file.endsWith(".md"));
const projectSlugs = new Set(projects.map((project) => project.slug));

for (const file of caseStudies) {
  const fullPath = path.posix.join(caseStudyDir, file);
  // matter() splits the front matter (parsed.data) from the Markdown body (parsed.content).
  const parsed = matter(readFileSync(fullPath, "utf8"));
  for (const field of REQUIRED_FRONT_MATTER) {
    if (typeof parsed.data[field] !== "string" || parsed.data[field].trim() === "") {
      errors.push(`${fullPath}: front matter field "${field}" is required`);
    }
  }
  // Collect the text of every "## " heading in the body and check the required ones exist.
  const headings = [...parsed.content.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => match[1]);
  for (const section of REQUIRED_SECTIONS) {
    if (!headings.includes(section)) {
      errors.push(`${fullPath}: required section "## ${section}" is missing`);
    }
  }
  const slug = file.replace(/\.md$/, "");
  if (!projectSlugs.has(slug)) {
    errors.push(`${fullPath}: no project with slug "${slug}" in data/projects.json`);
  }
}
if (caseStudies.length < MIN_CASE_STUDIES) {
  errors.push(`${caseStudyDir}: at least ${MIN_CASE_STUDIES} case studies are required, found ${caseStudies.length}`);
}

// Report every problem found, then exit with a failure code so CI stops.
if (errors.length) {
  console.error(`Content validation failed with ${errors.length} problem(s):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`Content is valid: 3 JSON files, ${caseStudies.length} case studies.`);
