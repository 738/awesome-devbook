// 매주 실행: 모든 책을 알라딘에서 다시 확인해 절판 상태 변화·사라진 책을 보고한다.
// 사용: npm run check-books [-- --apply]   (--apply 면 books.yml 의 out_of_print 를 실제 상태로 고친다)
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fetchAladin } from "./aladin.mjs";
import { ROOT, loadData } from "./lib.mjs";

const apply = process.argv.includes("--apply");
const { books } = loadData();
const missing = [], nowOop = [], backInPrint = [];
for (const b of books) {
  const r = await fetchAladin(b.isbn);
  if (!r.found) missing.push(b);
  else if (r.outOfPrint && !b.out_of_print) nowOop.push(b);
  else if (!r.outOfPrint && b.out_of_print) backInPrint.push(b);
  await new Promise((res) => setTimeout(res, 700)); // 알라딘에 부담 주지 않기
}

const fmt = (list) => list.map((b) => `- ${b.title} (${b.isbn})`).join("\n") || "- 없음";
const report = `## 주간 도서 점검 결과\n\n총 ${books.length}권 확인\n\n### 알라딘에서 찾을 수 없음\n${fmt(missing)}\n\n### 새로 절판됨\n${fmt(nowOop)}\n\n### 다시 판매 중\n${fmt(backInPrint)}\n`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${missing.length + nowOop.length + backInPrint.length > 0}\n`);
writeFileSync(join(ROOT, ".book-check-report.md"), report);

if (apply && (nowOop.length || backInPrint.length)) {
  const path = join(ROOT, "data/books.yml");
  let src = readFileSync(path, "utf8");
  for (const b of nowOop) src = src.replace(new RegExp(`(  isbn: "${b.isbn}"\\n  category: [^\\n]+)`), `$1\n  out_of_print: true`);
  for (const b of backInPrint) src = src.replace(new RegExp(`(  isbn: "${b.isbn}"\\n  category: [^\\n]+)\\n  out_of_print: true`), `$1`);
  writeFileSync(path, src);
  console.log(`books.yml 갱신: 절판 ${nowOop.length}, 재판매 ${backInPrint.length}`);
}
