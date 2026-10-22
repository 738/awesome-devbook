// 알라딘 상품 페이지에서 책 정보를 읽는다. (공개 API 키 없이 동작하도록 페이지의 구조화 데이터를 사용)
const UA = "Mozilla/5.0 (compatible; awesome-devbook-bot; +https://github.com/738/awesome-devbook)";
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// 알라딘은 번역서에 원어 이름을 함께 싣는다. 한글 이름이 있으면 원어 표기는 뺀다.
const koreanFirst = (names) => (names.some((n) => /[가-힣]/.test(n)) ? names.filter((n) => /[가-힣]/.test(n)) : names);

export async function fetchAladin(isbn, { retries = 2 } = {}) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(`https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`, { headers: { "user-agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const pick = (re) => html.match(re)?.[1];
      const found = pick(/"isbn"\s*:\s*"(\d{13})"/) ?? pick(/books:isbn" content="(\d{13})"/);
      if (!found) return { isbn, found: false };
      const og = decode(pick(/og:title" content="([^"]+)"/) ?? "");
      const authorsRaw = decode(pick(/og:author" content="([^"]*)"/) ?? "");
      return {
        isbn,
        found: true,
        title: og.split(" | ")[0].trim(),
        authors: koreanFirst(authorsRaw.split(",").map((a) => a.trim()).filter(Boolean)),
        publisher: decode(pick(/PublisherSearch=[^"]+">([^<]+)</) ?? "").trim(),
        published: pick(/"datePublished"\s*:\s*"([\d-]+)"/),
        outOfPrint: html.includes("절판되었습니다"),
      };
    } catch (e) {
      if (i >= retries) return { isbn, found: false, error: String(e) };
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}
