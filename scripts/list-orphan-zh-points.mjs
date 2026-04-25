#!/usr/bin/env node
/**
 * List <p class="point-heading|point-line"> without data-zh-unit-id in opening tag.
 * Output: file_path|line_approx|plain_text_first_line
 */
import fs from "fs";
import path from "path";

const FILES = process.argv.slice(2);
if (!FILES.length) {
  console.error("Usage: node scripts/list-orphan-zh-points.mjs notes/bab-4-1.html ...");
  process.exit(1);
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function findOrphans(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const re = /<p\s+class="(point-heading|point-line)"([^>]*)>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2];
    if (/data-zh-unit-id\s*=/.test(attrs)) continue;
    const start = m.index;
    const openEnd = html.indexOf(">", start) + 1;
    const close = html.indexOf("</p>", openEnd);
    if (close === -1) continue;
    const inner = html.slice(openEnd, close);
    const text = stripTags(inner);
    if (text.length < 3) continue;
    const line = html.slice(0, start).split("\n").length;
    out.push({ cls: m[1], line, text, start, end: close + 5 });
  }
  return out;
}

for (const f of FILES) {
  const orphans = findOrphans(f);
  if (!orphans.length) continue;
  console.log(`\n# ${f} (${orphans.length})`);
  orphans.forEach((o, i) => {
    const slug = path.basename(f, ".html");
    const id = `${slug}-p${o.line}-${i + 1}`;
    console.log(JSON.stringify({ id, cls: o.cls, line: o.line, text: o.text.slice(0, 500) }));
  });
}
