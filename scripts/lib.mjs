import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import YAML from "yaml";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const readYaml = (rel) => YAML.parse(readFileSync(join(ROOT, rel), "utf8"));

export const aladinUrl = (isbn) => `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`;

export function isValidIsbn13(isbn) {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  const sum = [...isbn.slice(0, 12)].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(isbn[12]);
}

// GitHub 앵커 규칙: 소문자화, 공백→하이픈, 영숫자·한글·하이픈·밑줄 외 제거, 중복은 -1, -2
export function anchorer() {
  const seen = new Map();
  return (text) => {
    const base = text.trim().toLowerCase().replace(/\s/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

/** categories.yml + books.yml 을 읽어 검증하고, 렌더링하기 좋은 트리로 돌려준다. */
export function loadData() {
  const groups = readYaml("data/categories.yml");
  const books = readYaml("data/books.yml");
  const tracks = readYaml("data/tracks.yml");
  const errors = [];

  const valid = new Set();
  for (const g of groups) for (const c of g.categories) {
    valid.add(c.name);
    for (const s of c.subs ?? []) valid.add(`${c.name}/${s}`);
  }

  const byIsbn = new Map();
  books.forEach((b, i) => {
    const at = `books.yml #${i + 1} (${b.title ?? "제목 없음"})`;
    for (const f of ["title", "authors", "publisher", "published", "isbn", "category"]) if (b[f] == null || b[f] === "") errors.push(`${at}: '${f}' 가 비어 있어요`);
    b.isbn = String(b.isbn ?? "");
    if (!isValidIsbn13(b.isbn)) errors.push(`${at}: ISBN '${b.isbn}' 이 올바른 ISBN-13 이 아니에요`);
    if (byIsbn.has(b.isbn)) errors.push(`${at}: ISBN 이 '${byIsbn.get(b.isbn).title}' 과 중복돼요`);
    byIsbn.set(b.isbn, b);
    if (!valid.has(b.category)) errors.push(`${at}: 카테고리 '${b.category}' 가 categories.yml 에 없어요`);
    if (!Array.isArray(b.authors) || !b.authors.length) errors.push(`${at}: authors 는 이름 배열이어야 해요`);
    b.published = b.published instanceof Date ? b.published.toISOString().slice(0, 10) : String(b.published);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.published)) errors.push(`${at}: published 는 YYYY-MM-DD 형식이어야 해요`);
  });

  for (const t of tracks) for (const isbn of t.books) if (!byIsbn.has(String(isbn))) errors.push(`tracks.yml '${t.name}': ISBN ${isbn} 이 books.yml 에 없어요`);

  const tree = groups.map((g) => ({
    ...g,
    categories: g.categories.map((c) => ({
      ...c,
      books: books.filter((b) => b.category === c.name),
      subs: (c.subs ?? []).map((s) => ({ name: s, books: books.filter((b) => b.category === `${c.name}/${s}`) })),
    })),
  }));
  return { tree, books, tracks, byIsbn, errors };
}
