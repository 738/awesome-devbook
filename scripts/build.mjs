// data/*.yml → README.md, docs/books.json
// 사용: npm run build  (README 갱신) / npm run check  (README 가 데이터와 다르면 실패 — CI 용)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadData, aladinUrl, anchorer } from "./lib.mjs";

const check = process.argv.includes("--check");
const { tree, books, tracks, byIsbn, errors } = loadData();
if (errors.length) {
  console.error(`데이터 오류 ${errors.length}건:\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

const line = (b) => {
  const name = b.subtitle ? `${b.title} | ${b.subtitle}` : b.title;
  const oop = b.out_of_print ? "(**절판**) " : "";
  return `- ${oop}[${name}](${aladinUrl(b.isbn)}) - ${b.authors.join(", ")} · ${b.publisher} · ${b.published.slice(0, 4)}`;
};

const anchor = anchorer();
// 본문보다 먼저 나오는 제목들 — 앵커 중복 번호가 GitHub 과 같아지도록 먼저 등록
for (const h of ["개요", "어디서부터 읽을까?", "목차"]) anchor(h);
const toc = [];
const body = [];
for (const g of tree) {
  toc.push(`- [${g.group}](#${anchor(g.group)})`);
  body.push(`## ${g.group}`, "");
  if (g.description) body.push(`> ${g.description}`, "");
  for (const c of g.categories) {
    const count = c.books.length + c.subs.reduce((n, s) => n + s.books.length, 0);
    toc.push(`  - [${c.name}](#${anchor(c.name)}) <sub>${count}</sub>`);
    body.push(`### ${c.name}`, "");
    if (c.books.length) body.push(...c.books.map(line), "");
    for (const s of c.subs) {
      anchor(s.name);
      body.push(`#### ${s.name}`, "", ...s.books.map(line), "");
    }
  }
  body.push("**[⬆ 맨 위로 이동](#목차)**", "", "");
}

const trackMd = tracks.flatMap((t) => [
  `<details><summary><b>${t.name}</b> — ${t.description}</summary>`,
  "",
  ...t.books.map((isbn, i) => {
    const b = byIsbn.get(String(isbn));
    return `${i + 1}. [${b.title}](${aladinUrl(b.isbn)}) - ${b.authors.join(", ")}${b.out_of_print ? " (절판)" : ""}`;
  }),
  "",
  "</details>",
  "",
]);

const oop = books.filter((b) => b.out_of_print).length;
const recent = books.filter((b) => b.published >= "2023").length;
const categories = tree.reduce((n, g) => n + g.categories.length, 0);

const tpl = readFileSync(join(ROOT, "scripts/README.template.md"), "utf8");
const readme = tpl
  .replace("{{STATS}}", `📚 **${books.length}권** · ${categories}개 분야 · 2023년 이후 출간 ${recent}권 · 절판 표기 ${oop}권`)
  .replace("{{TRACKS}}", trackMd.join("\n").trim())
  .replace("{{TOC}}", toc.join("\n"))
  .replace("{{BODY}}", body.join("\n").trim());

const coverPath = join(ROOT, "data/covers.json");
const covers = existsSync(coverPath) ? JSON.parse(readFileSync(coverPath, "utf8")) : {};

const json = JSON.stringify(
  {
    groups: tree.map((g) => ({ group: g.group, categories: g.categories.map((c) => ({ name: c.name, subs: c.subs.map((s) => s.name) })) })),
    tracks,
    books: books.map((b) => ({ ...b, url: aladinUrl(b.isbn), cover: covers[b.isbn] ?? null })),
  },
  null,
  1,
);

const targets = [
  ["README.md", readme],
  ["docs/books.json", json + "\n"],
];
if (check) {
  const stale = targets.filter(([f, c]) => {
    try { return readFileSync(join(ROOT, f), "utf8") !== c; } catch { return true; }
  });
  if (stale.length) {
    console.error(`생성 파일이 데이터와 달라요: ${stale.map(([f]) => f).join(", ")}\n→ \`npm run build\` 를 실행하고 결과를 함께 커밋해 주세요.`);
    process.exit(1);
  }
  console.log(`OK — ${books.length}권, 생성 파일 최신 상태`);
} else {
  mkdirSync(join(ROOT, "docs"), { recursive: true });
  for (const [f, c] of targets) writeFileSync(join(ROOT, f), c);
  console.log(`README.md · docs/books.json 생성 — ${books.length}권`);
}
