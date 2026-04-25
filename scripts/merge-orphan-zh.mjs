#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const orphans = JSON.parse(
  execFileSync(process.execPath, ["scripts/extract-new-zh-units.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  })
);
const p1 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/zh-units/orphan-zh-part1.json"), "utf8"));
const p2 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/zh-units/orphan-zh-part2.json"), "utf8"));
const p3 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/zh-units/orphan-zh-part3.json"), "utf8"));
const zhAll = [...p1, ...p2, ...p3];
if (zhAll.length !== orphans.length) {
  console.error(`Mismatch: ${orphans.length} orphans vs ${zhAll.length} zh strings`);
  process.exit(1);
}
const byFile = {};
for (let i = 0; i < orphans.length; i++) {
  const slug = orphans[i].source_id.replace(/-orph-.*/, "");
  if (!byFile[slug]) byFile[slug] = [];
  byFile[slug].push({
    source_id: orphans[i].source_id,
    bm_original: orphans[i].bm_original,
    translate: zhAll[i],
  });
}
for (const [slug, units] of Object.entries(byFile)) {
  const jpath = path.join(ROOT, "data/zh-units", `${slug}.json`);
  const doc = JSON.parse(fs.readFileSync(jpath, "utf8"));
  if (!Array.isArray(doc.units)) {
    console.error("Expected { units: [] } in", jpath);
    process.exit(1);
  }
  const seen = new Set(doc.units.map((x) => x.source_id));
  for (const u of units) {
    if (seen.has(u.source_id)) {
      console.error("Duplicate source_id", u.source_id);
      process.exit(1);
    }
    doc.units.push(u);
    seen.add(u.source_id);
  }
  fs.writeFileSync(jpath, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log("merged", slug, units.length);
}
