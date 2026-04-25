#!/usr/bin/env node
/**
 * Inject data-zh-mode + data-zh-unit-id into orphan <p class="point-heading|point-line">
 * and orphan <h2> inside <article class="... summary-paper ..."> or conclusion-paper.
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

function slugFromPath(p) {
  return path.basename(p, ".html");
}

function injectParagraphs(html, slug) {
  let h = 0;
  let l = 0;
  return html.replace(
    /<p\s+class="(point-heading|point-line)"([\s\S]*?)>/g,
    (full, cls, inner) => {
      if (/data-zh-unit-id\s*=/.test(inner)) return full;
      const n = cls === "point-heading" ? ++h : ++l;
      const id = `${slug}-orph-${cls === "point-heading" ? "h" : "l"}${n}`;
      const insert = ` data-zh-mode="explain" data-zh-unit-id="${id}"`;
      if (!inner.trim()) {
        return `<p class="${cls}"${insert}>`;
      }
      return `<p class="${cls}"${insert}${inner}>`;
    }
  );
}

function injectSummaryH2(html, slug) {
  let c = 0;
  return html.replace(
    /<article\s+class="([^"]*\b(summary-paper|conclusion-paper)\b[^"]*)"[^>]*>([\s\S]*?)<\/article>/gi,
    (full, artClass, _kind, inner) => {
      const patched = inner.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (hfull, hrest, htext) => {
        if (/data-zh-unit-id\s*=/.test(hrest)) return hfull;
        c++;
        const id = `${slug}-orph-h2-${c}`;
        const insert = ` data-zh-mode="explain" data-zh-unit-id="${id}"`;
        if (!hrest.trim()) {
          return `<h2${insert}>${htext}</h2>`;
        }
        return `<h2${insert}${hrest}>${htext}</h2>`;
      });
      return full.replace(inner, patched);
    }
  );
}

function bumpZhMode(html) {
  return html.replace(/zh-mode\.js\?v=\d+/g, "zh-mode.js?v=41");
}

for (const rel of FILES) {
  const abs = path.join(process.cwd(), rel);
  let html = fs.readFileSync(abs, "utf8");
  const slug = slugFromPath(rel);
  const before = html;
  html = injectParagraphs(html, slug);
  html = injectSummaryH2(html, slug);
  html = bumpZhMode(html);
  if (html !== before) {
    fs.writeFileSync(abs, html, "utf8");
    console.log("patched", rel);
  } else {
    console.log("unchanged", rel);
  }
}
