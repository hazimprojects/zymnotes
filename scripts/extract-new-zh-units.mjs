#!/usr/bin/env node
/**
 * For HTML files, find elements with data-zh-unit-id matching *-orph-*
 * and output JSON lines: {source_id, bm_original} with bm from textContent.
 */
import fs from "fs";
import path from "path";

const FILES = [
  "notes/bab-4-1.html",
  "notes/bab-4-2.html",
  "notes/bab-4-3.html",
  "notes/bab-4-4.html",
  "notes/bab-4-5.html",
  "notes/bab-4-6.html",
  "notes/bab-4-7.html",
  "notes/bab-5-1.html",
  "notes/bab-5-2.html",
  "notes/bab-5-3.html",
  "notes/bab-5-4.html",
  "notes/bab-6-1.html",
  "notes/bab-6-2.html",
  "notes/bab-6-3.html",
  "notes/bab-6-4.html",
  "notes/bab-7-1.html",
  "notes/bab-7-2.html",
  "notes/bab-7-3.html",
  "notes/bab-7-4.html",
  "notes/bab-7-5.html",
];

function stripInner(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOrphans(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const re = /<(p|h2)([^>]*data-zh-unit-id="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const id = m[3];
    if (!/-orph-/.test(id)) continue;
    const inner = m[4];
    const bm = stripInner(inner);
    if (bm.length < 2) continue;
    out.push({ source_id: id, bm_original: bm });
  }
  return out;
}

const all = [];
for (const f of FILES) {
  all.push(...extractOrphans(path.join(process.cwd(), f)));
}
console.log(JSON.stringify(all, null, 0));
