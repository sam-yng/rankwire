#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const BASELINE_VERSION = 1;
const ROOT = process.cwd();
const BASELINE_PATH = ".agents/guardrails/test-baseline.json";
const WAIVERS_PATH = ".agents/guardrails/test-waivers.json";
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);
const TEST_FILE_PATTERN = /\.(test|spec)\.(c|m)?[jt]sx?$/;
const TEST_DIR_PATTERN = /(^|\/)(tests|__tests__)\//;
const SOURCE_FILE_PATTERN = /\.(c|m)?[jt]sx?$/;

function isTestFile(path) {
  const posix = path.replaceAll("\\", "/");
  if (TEST_FILE_PATTERN.test(posix)) return true;
  return TEST_DIR_PATTERN.test(posix) && SOURCE_FILE_PATTERN.test(posix);
}

function count(content, source) {
  const matches = content.match(new RegExp(source, "g"));
  return matches ? matches.length : 0;
}

function measure(content) {
  const markers = new Set();
  if (/\.skip\b|\bxit\b|\bxtest\b|\bxdescribe\b/.test(content)) markers.add("skip");
  if (/\.only\b/.test(content)) markers.add("only");
  if (/\.todo\b/.test(content)) markers.add("todo");
  return {
    testCount: count(content, "(?:^|[^.\\w])(?:it|test)\\s*(?:\\.\\w+)?\\s*\\("),
    assertionCount:
      count(content, "(?:^|[^.\\w])expect\\s*\\(") +
      count(content, "(?:^|[^.\\w])assert(?:\\.\\w+)?\\s*\\("),
    markers: Array.from(markers).sort(),
    hasExit: /(?:process|sys)\s*\.\s*exit\s*\(/.test(content),
  };
}

async function collect(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(path, out);
      continue;
    }
    const rel = relative(ROOT, path).replaceAll("\\", "/");
    if (entry.isFile() && isTestFile(rel)) out.push(rel);
  }
}

async function readGate() {
  try {
    const json = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
    const check = (json.scripts && json.scripts.check) || "";
    const stages = check
      .split("&&")
      .map((part) => {
        const words = part.trim().split(/\s+/);
        return words[words.length - 1] || "";
      })
      .filter((stage) => stage.length > 0);
    return { gateCommand: check, gateStages: stages };
  } catch {
    return { gateCommand: "", gateStages: [] };
  }
}

async function buildSnapshot() {
  const files = {};
  const unreadable = [];
  const paths = [];
  await collect(ROOT, paths);
  for (const path of paths.sort()) {
    try {
      files[path] = measure(await readFile(join(ROOT, path), "utf8"));
    } catch {
      unreadable.push(path);
    }
  }
  const gate = await readGate();
  return {
    version: BASELINE_VERSION,
    gateCommand: gate.gateCommand,
    gateStages: gate.gateStages,
    files,
    unreadable,
  };
}

async function readBaseline() {
  try {
    const parsed = JSON.parse(await readFile(join(ROOT, BASELINE_PATH), "utf8"));
    if (typeof parsed.version !== "number" || typeof parsed.files !== "object")
      return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeBaseline(snapshot) {
  const recorded = {
    version: snapshot.version,
    gateCommand: snapshot.gateCommand,
    gateStages: snapshot.gateStages,
    files: snapshot.files,
  };
  const abs = join(ROOT, BASELINE_PATH);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, JSON.stringify(recorded, null, 2) + "\n");
}

function runDetectors(baseline, snapshot) {
  const out = [];
  for (const path of Object.keys(baseline.files)) {
    const before = baseline.files[path];
    const after = snapshot.files[path];
    if (!after) {
      out.push({
        kind: "delete",
        subject: path,
        severity: "error",
        file: path,
        message: "Test file deleted: " + path,
      });
      continue;
    }
    const newMarkers = after.markers.filter((m) => before.markers.indexOf(m) === -1);
    if (newMarkers.length)
      out.push({
        kind: "skip",
        subject: path,
        severity: "error",
        file: path,
        message:
          "Test reduction marker added in " + path + ": " + newMarkers.join(", "),
      });
    if (after.testCount < before.testCount)
      out.push({
        kind: "reduce-tests",
        subject: path,
        severity: "error",
        file: path,
        message:
          "Test count dropped in " +
          path +
          ": " +
          before.testCount +
          " -> " +
          after.testCount,
      });
    if (after.assertionCount < before.assertionCount)
      out.push({
        kind: "reduce-assertions",
        subject: path,
        severity: "error",
        file: path,
        message:
          "Assertion count dropped in " +
          path +
          ": " +
          before.assertionCount +
          " -> " +
          after.assertionCount,
      });
    if (after.hasExit && !before.hasExit)
      out.push({
        kind: "exit",
        subject: path,
        severity: "error",
        file: path,
        message: "Harness short-circuit introduced in " + path,
      });
  }
  const dropped = baseline.gateStages.filter(
    (s) => snapshot.gateStages.indexOf(s) === -1,
  );
  if (dropped.length)
    out.push({
      kind: "gate",
      subject: "(gate)",
      severity: "error",
      file: undefined,
      message: "Gate stage removed: " + dropped.join(", "),
    });
  for (const path of snapshot.unreadable)
    out.push({
      kind: "delete",
      subject: path,
      severity: "warning",
      file: path,
      message: "Test file could not be read: " + path,
    });
  return out;
}

async function loadWaivers() {
  let raw;
  try {
    raw = await readFile(join(ROOT, WAIVERS_PATH), "utf8");
  } catch {
    return { ok: true, entries: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Waiver file is not valid JSON." };
  }
  if (!Array.isArray(parsed))
    return { ok: false, error: "Waiver file must be a JSON array." };
  for (const e of parsed) {
    if (
      !e ||
      typeof e !== "object" ||
      typeof e.file !== "string" ||
      typeof e.reason !== "string" ||
      e.reason.trim() === "" ||
      !Array.isArray(e.allow) ||
      e.allow.length === 0
    )
      return { ok: false, error: "An entry is missing file, reason, or allow." };
  }
  return { ok: true, entries: parsed };
}

function parseToken(message) {
  const m = message.match(/\[test-waiver:\s*([^\]]*)\]/i);
  if (!m) return null;
  const reason = m[1].trim();
  return reason ? { reason } : null;
}

function expired(e, now) {
  if (!e.expires) return false;
  const t = new Date(e.expires).getTime();
  return Number.isNaN(t) || t < now;
}

function sanctionReason(reduction, waivers, token, now) {
  for (const e of waivers) {
    if (
      e.file === reduction.subject &&
      e.allow.indexOf(reduction.kind) !== -1 &&
      !expired(e, now)
    )
      return e.reason;
  }
  return token ? token.reason : null;
}

async function main() {
  const args = process.argv.slice(2);
  const snapshot = await buildSnapshot();
  if (args.indexOf("--update-baseline") !== -1) {
    await writeBaseline(snapshot);
    console.log("Recorded test-integrity baseline.");
    return;
  }
  const baseline = await readBaseline();
  if (!baseline) {
    console.log(
      "warning: no test baseline recorded; run with --update-baseline to record one.",
    );
    return;
  }
  const reductions = runDetectors(baseline, snapshot);
  const waivers = await loadWaivers();
  const ci = args.indexOf("--commit-msg");
  let token = null;
  if (ci !== -1 && args[ci + 1]) {
    try {
      token = parseToken(await readFile(args[ci + 1], "utf8"));
    } catch {}
  }
  const entries = waivers.ok ? waivers.entries : [];
  const now = Date.now();
  let hasError = false;
  const out = [];
  if (!waivers.ok) {
    hasError = true;
    out.push("error: " + WAIVERS_PATH + " - Malformed waiver file: " + waivers.error);
  }
  for (const r of reductions) {
    const label = r.file || "(gate)";
    if (r.severity !== "error") {
      out.push(r.severity + ": " + label + " - " + r.message);
      continue;
    }
    const reason = sanctionReason(r, entries, token, now);
    if (reason)
      out.push("info: " + label + " - " + r.message + " (waived: " + reason + ")");
    else {
      hasError = true;
      out.push("error: " + label + " - " + r.message);
    }
  }
  if (out.length === 0) {
    console.log("Test integrity intact.");
    return;
  }
  for (const line of out) {
    if (hasError) console.error(line);
    else console.log(line);
  }
  if (hasError) {
    console.error(
      "Fix the cause, or record a waiver in .agents/guardrails/ and re-run --update-baseline.",
    );
    process.exitCode = 1;
  }
}

main();
