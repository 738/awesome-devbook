// ISBN 으로 books.yml 에 붙여넣을 항목을 만든다.  사용: npm run lookup -- 9791158391409 [ISBN ...]
import { fetchAladin } from "./aladin.mjs";
import { isValidIsbn13, loadData } from "./lib.mjs";

const isbns = process.argv.slice(2).map((s) => s.replace(/-/g, ""));
if (!isbns.length) { console.error("사용법: npm run lookup -- <ISBN-13> [ISBN-13 ...]"); process.exit(1); }
const { byIsbn } = loadData();
const q = (s) => JSON.stringify(s);
for (const isbn of isbns) {
  if (!isValidIsbn13(isbn)) { console.error(`# ${isbn}: 올바른 ISBN-13 이 아니에요`); continue; }
  if (byIsbn.has(isbn)) { console.error(`# ${isbn}: 이미 '${byIsbn.get(isbn).title}' 로 등록돼 있어요`); continue; }
  const b = await fetchAladin(isbn);
  if (!b.found) { console.error(`# ${isbn}: 알라딘에서 찾지 못했어요 ${b.error ?? ""}`); continue; }
  console.log([
    `- title: ${q(b.title)}`,
    `  subtitle: ""  # 부제가 없으면 이 줄을 지우세요`,
    `  authors: [${b.authors.map(q).join(", ")}]`,
    `  publisher: ${q(b.publisher)}`,
    `  published: ${b.published}`,
    `  isbn: "${isbn}"`,
    `  category: ""  # data/categories.yml 의 이름 (하위 분류는 "프론트엔드/리액트" 처럼)`,
    ...(b.outOfPrint ? ["  out_of_print: true"] : []),
  ].join("\n"));
}
