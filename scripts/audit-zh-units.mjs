#!/usr/bin/env node
/**
 * Audit notes HTML for elements that get a 中 toggle in zh-mode.js
 * but lack data-zh-unit-id (or id present but missing in JSON).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NOTES = path.join(ROOT, "notes");
const ZH_UNITS = path.join(ROOT, "data", "zh-units");

const FILES = [
  "bab-2-1.html",
  "bab-2-7.html",
  "bab-3-2.html",
  "bab-3-3.html",
  "bab-3-4.html",
  "bab-3-5.html",
  "bab-3-6.html",
  "bab-3-7.html",
  "bab-3-8.html",
  "bab-3-9.html",
  "bab-4-1.html",
  "bab-4-2.html",
  "bab-4-3.html",
  "bab-4-4.html",
  "bab-4-5.html",
  "bab-4-6.html",
  "bab-4-7.html",
  "bab-5-1.html",
  "bab-5-2.html",
  "bab-5-3.html",
  "bab-5-4.html",
  "bab-6-1.html",
  "bab-6-2.html",
  "bab-6-3.html",
  "bab-6-4.html",
  "bab-7-1.html",
  "bab-7-2.html",
  "bab-7-3.html",
  "bab-7-4.html",
  "bab-7-5.html",
];

function loadJsonMap() {
  const index = JSON.parse(fs.readFileSync(path.join(ZH_UNITS, "index.json"), "utf8"));
  const files = index.files || [];
  const map = {};
  for (const jf of files) {
    const p = path.join(ZH_UNITS, jf);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const units = Array.isArray(data.units) ? data.units : [];
    for (const u of units) {
      if (u && u.source_id) map[u.source_id] = u;
    }
  }
  return map;
}

function classAttrIncludes(html, classNeedle) {
  const re = new RegExp(`class\\s*=\\s*["']([^"']*)["']`, "gi");
  let m;
  while ((m = re.exec(html))) {
    const cls = m[1];
    if (cls.split(/\s+/).includes(classNeedle)) return true;
  }
  return false;
}

/** Extract attributes from first opening tag of a snippet */
function parseOpeningTag(snippet) {
  const m = snippet.match(/^<([a-zA-Z0-9]+)([^>]*)>/);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  const rest = m[2];
  const attrs = {};
  const attrRe = /(\w+(?:-\w+)*)=(["'])([^"']*)\2/g;
  let am;
  while ((am = attrRe.exec(rest))) {
    attrs[am[1]] = am[3];
  }
  return { tag, attrs };
}

function findAllTagRanges(html, tagName) {
  const ranges = [];
  const lcTag = tagName.toLowerCase();
  const openNeedle = `<${lcTag}`;
  const closeNeedle = `</${lcTag}>`;
  let pos = 0;
  while (pos < html.length) {
    const start = html.toLowerCase().indexOf(openNeedle, pos);
    if (start === -1) break;
    const afterLt = start + 1;
    const nextChar = html[afterLt + lcTag.length];
    if (nextChar && /[A-Za-z0-9]/.test(nextChar)) {
      pos = start + 2;
      continue;
    }
    const gt = html.indexOf(">", start);
    if (gt === -1) break;
    const openChunk = html.slice(start, gt + 1);
    if (/\/\s*>$/.test(openChunk)) {
      ranges.push({ start, end: gt + 1 });
      pos = gt + 1;
      continue;
    }
    let depth = 1;
    let i = gt + 1;
    while (i < html.length && depth > 0) {
      const rest = html.slice(i);
      const low = rest.toLowerCase();
      const nextOpen = low.indexOf(openNeedle);
      const nextClose = low.indexOf(closeNeedle);
      if (nextClose === -1) break;
      const relOpen = nextOpen === -1 ? Infinity : nextOpen;
      if (relOpen < nextClose) {
        const openStart = i + nextOpen;
        const gt2 = html.indexOf(">", openStart);
        if (gt2 === -1) break;
        const oc = html.slice(openStart, gt2 + 1);
        if (/\/\s*>$/.test(oc)) {
          i = gt2 + 1;
        } else {
          depth++;
          i = gt2 + 1;
        }
      } else {
        depth--;
        i += nextClose + closeNeedle.length;
      }
    }
    ranges.push({ start, end: i });
    pos = start + 1;
  }
  return ranges;
}

function innerHtml(html, range) {
  const slice = html.slice(range.start, range.end);
  const closeIdx = slice.indexOf(">");
  return slice.slice(closeIdx + 1, slice.lastIndexOf(`</`));
}

function openingTagSlice(html, range) {
  const slice = html.slice(range.start, range.end);
  const closeIdx = slice.indexOf(">");
  return slice.slice(0, closeIdx + 1);
}

function auditFile(htmlPath, unitMap) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const base = path.basename(htmlPath, ".html");
  const issues = [];

  const seenIssue = new Set();
  function pushIssue(issue) {
    const key = `${issue.type}|${issue.selector || ""}|${issue.id || ""}|${issue.text.slice(0, 200)}`;
    if (seenIssue.has(key)) return;
    seenIssue.add(key);
    issues.push(issue);
  }

  const checkBlock = (selectorDesc, tag, classNeedle) => {
    const ranges = findAllTagRanges(html, tag);
    for (const r of ranges) {
      const open = openingTagSlice(html, r);
      if (!classAttrIncludes(open, classNeedle)) continue;
      const inner = innerHtml(html, r);
      const parsed = parseOpeningTag(open);
      const id = (parsed?.attrs["data-zh-unit-id"] || "").trim();
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 3) continue;
      if (!id) {
        pushIssue({ type: "missing_id", selector: selectorDesc, text: text.slice(0, 120) });
        continue;
      }
      const u = unitMap[id];
      if (!u || !u.translate || !String(u.translate).trim()) {
        pushIssue({ type: "missing_json", id, text: text.slice(0, 120) });
      }
    }
  };

  checkBlock("point-heading", "p", "point-heading");
  checkBlock("point-line", "p", "point-line");
  // .lead is introductory copy; skip unless we add glossary-style coverage later
  // checkBlock("lead", "p", "lead");

  // paper-chip: opening tag <div class="... paper-chip ...
  const chipRanges = findAllTagRanges(html, "div");
  for (const r of chipRanges) {
    const open = openingTagSlice(html, r);
    if (!classAttrIncludes(open, "paper-chip")) continue;
    const inner = innerHtml(html, r);
    const parsed = parseOpeningTag(open);
    const id = (parsed?.attrs["data-zh-unit-id"] || "").trim();
    const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 320) continue;
    if (!id) {
      pushIssue({ type: "missing_id", selector: "paper-chip", text: text.slice(0, 120) });
      continue;
    }
    const u = unitMap[id];
    if (!u || !u.translate || !String(u.translate).trim()) {
      pushIssue({ type: "missing_json", id, text: text.slice(0, 120) });
    }
  }

  // h2 inside article that is summary or conclusion (one pass — some articles have both classes)
  const wrapRanges = findAllTagRanges(html, "article");
  for (const wr of wrapRanges) {
    const wopen = openingTagSlice(html, wr);
    const isSum = classAttrIncludes(wopen, "summary-paper");
    const isCon = classAttrIncludes(wopen, "conclusion-paper");
    if (!isSum && !isCon) continue;
    const label = isSum && isCon ? "summary/conclusion h2" : isSum ? "summary-paper h2" : "conclusion-paper h2";
    const innerArt = html.slice(wr.start, wr.end);
    const h2Ranges = findAllTagRanges(innerArt, "h2");
    for (const hr of h2Ranges) {
      const offset = wr.start;
      const absR = { start: offset + hr.start, end: offset + hr.end };
      const open = openingTagSlice(html, absR);
      const inner = innerHtml(html, absR);
      const parsed = parseOpeningTag(open);
      const id = (parsed?.attrs["data-zh-unit-id"] || "").trim();
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 3) continue;
      if (!id) {
        pushIssue({ type: "missing_id", selector: label, text: text.slice(0, 120) });
      } else {
        const u = unitMap[id];
        if (!u || !u.translate || !String(u.translate).trim()) {
          pushIssue({ type: "missing_json", id, text: text.slice(0, 120) });
        }
      }
    }
  }

  return { base, issues };
}

const unitMap = loadJsonMap();
let total = 0;
for (const f of FILES) {
  const p = path.join(NOTES, f);
  const { base, issues } = auditFile(p, unitMap);
  if (issues.length) {
    console.log(`\n## ${f} (${issues.length})`);
    for (const it of issues) {
      total++;
      if (it.type === "missing_id") {
        console.log(`  [no id] ${it.selector}: ${it.text}`);
      } else {
        console.log(`  [no zh] ${it.id}: ${it.text}`);
      }
    }
  }
}
console.log(`\nTOTAL ISSUES: ${total}`);
