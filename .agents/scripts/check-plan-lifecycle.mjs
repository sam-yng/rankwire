import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const requiredDirs = [
  "docs/design-docs",
  "docs/exec-plans/queued",
  "docs/exec-plans/active",
  "docs/exec-plans/completed",
  "docs/exec-plans/archive",
  "docs/references",
  "docs/generated",
];

const errors = [];

for (const dir of requiredDirs) {
  if (!(await isDirectory(join(process.cwd(), dir)))) {
    errors.push(`Missing required docs directory: ${dir}`);
  }
}

for (const file of await listMarkdownFiles(join(process.cwd(), "docs"))) {
  if (file.endsWith("-design.md") && !file.startsWith("docs/design-docs/")) {
    errors.push(`Design artifact is outside docs/design-docs: ${file}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exitCode = 1;
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dir) {
  if (!(await isDirectory(dir))) {
    return [];
  }

  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(path)));
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relative(process.cwd(), path).replaceAll("\\", "/"));
    }
  }
  return files;
}
