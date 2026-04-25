#!/usr/bin/env node
/**
 * Remove data-zh-mode / data-zh-unit-id / data-zh-display-mode only from
 * <div class="... paper-chip ..."> whose inner HTML marks a person
 * (contains class token kw-tokoh, i.e. <span class="kw kw-tokoh">).
 * Prune matching units from data/zh-units/*.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NOTES = path.join(ROOT, "notes");
const ZH_UNITS = path.join(ROOT, "data", "zh-units");

const removedIds = new Set();

function parseOpeningTag(snippet) {
  const m = snippet.match(/^<([a-zA-Z0-9]+)([^>]*)>/);
  if (!m) return null;
  const rest = m[2];
  const attrs = {};
  const attrRe = /(\w+(?:-\w+)*)=(["'])([^"']*)\2/g;
  let am;
  while ((am = attrRe.exec(rest))) {
    attrs[am[1]] = am[3];
  }
  return { tag: m[1].toLowerCase(), attrs };
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
  return slice.slice(closeIdx + 1, slice.lastIndexOf("</"));
}

function openingTagSlice(html, range) {
  const slice = html.slice(range.start, range.end);
  const closeIdx = slice.indexOf(">");
  return slice.slice(0, closeIdx + 1);
}

function classAttrIncludes(openSlice, needle) {
  const m = openSlice.match(/class\s*=\s*["']([^"']*)["']/i);
  if (!m) return false;
  return m[1].split(/\s+/).includes(needle);
}

function isPersonPaperChip(inner) {
  return /\bkw-tokoh\b/.test(inner);
}

function stripZhAttrsFromOpenTag(openSlice) {
  let s = openSlice;
  s = s.replace(/\s+data-zh-mode\s*=\s*["'][^"']*["']/gi, "");
  s = s.replace(/\s+data-zh-unit-id\s*=\s*["'][^"']*["']/gi, "");
  s = s.replace(/\s+data-zh-display-mode\s*=\s*["'][^"']*["']/gi, "");
  return s;
}

function listBabHtml() {
  return fs
    .readdirSync(NOTES)
    .filter((f) => /^bab-.*\.html$/.test(f))
    .map((f) => path.join(NOTES, f));
}

let htmlFilesChanged = 0;
for (const htmlPath of listBabHtml()) {
  let html = fs.readFileSync(htmlPath, "utf8");
  const ranges = findAllTagRanges(html, "div");
  let changed = false;
  for (let ri = ranges.length - 1; ri >= 0; ri--) {
    const r = ranges[ri];
    const open = openingTagSlice(html, r);
    if (!classAttrIncludes(open, "paper-chip")) continue;
    const inner = innerHtml(html, r);
    if (!isPersonPaperChip(inner)) continue;
    if (!/\bdata-zh-(?:unit-id|mode|display-mode)\b/i.test(open)) continue;
    const parsed = parseOpeningTag(open);
    const id = (parsed?.attrs["data-zh-unit-id"] || "").trim();
    if (id) removedIds.add(id);
    const stripped = stripZhAttrsFromOpenTag(open);
    if (stripped === open) continue;
    const newSlice = stripped + html.slice(r.start + open.length, r.end);
    html = html.slice(0, r.start) + newSlice + html.slice(r.end);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(htmlPath, html, "utf8");
    htmlFilesChanged++;
    console.log("person chips stripped:", path.relative(ROOT, htmlPath));
  }
}

console.log("HTML files modified:", htmlFilesChanged);
console.log("source_ids to remove from JSON:", removedIds.size);

let jsonFilesTouched = 0;
let unitsRemoved = 0;
for (const name of fs.readdirSync(ZH_UNITS)) {
  if (!name.endsWith(".json") || name === "index.json") continue;
  const jpath = path.join(ZH_UNITS, name);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(jpath, "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(data.units)) continue;
  const before = data.units.length;
  data.units = data.units.filter((u) => {
    if (!u || !u.source_id) return true;
    if (removedIds.has(u.source_id)) {
      unitsRemoved++;
      return false;
    }
    return true;
  });
  if (data.units.length !== before) {
    fs.writeFileSync(jpath, JSON.stringify(data, null, 2) + "\n", "utf8");
    jsonFilesTouched++;
    console.log("JSON pruned:", name, before - data.units.length);
  }
}

console.log("JSON files updated:", jsonFilesTouched, "units removed:", unitsRemoved);
