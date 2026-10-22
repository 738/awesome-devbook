// 알라딘 표지 이미지 주소를 data/covers.json 에 모은다. (이미지는 저장하지 않고 주소만 — 알라딘 CDN 이 CORS 를 허용한다)
// 사용: npm run covers          (없는 것만 채움)
//       npm run covers -- --all (전부 다시 확인)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fetchAladin } from "./aladin.mjs";
import { ROOT, loadData } from "./lib.mjs";

const all = process.argv.includes("--all");
const path = join(ROOT, "data/covers.json");
const covers = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
const { books } = loadData();
let added = 0, missing = 0;
for (const b of books) {
  if (!all && covers[b.isbn]) continue;
  const r = await fetchAladin(b.isbn);
  if (r.cover) { covers[b.isbn] = r.cover; added++; } else missing++;
  await new Promise((res) => setTimeout(res, 500));
}
const sorted = Object.fromEntries(Object.entries(covers).filter(([k]) => books.some((b) => b.isbn === k)).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(path, JSON.stringify(sorted, null, 1) + "\n");
console.log(`표지 ${Object.keys(sorted).length}/${books.length} · 이번에 추가 ${added} · 못 찾음 ${missing}`);
