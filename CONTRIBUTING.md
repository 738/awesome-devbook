# 기여 방법

기여해 주셔서 감사합니다 :) 이 리스트는 `data/books.yml` 이 원본이고, `README.md` 와 웹페이지는 스크립트가 생성합니다.

## 코드 없이 추천하기

[책 추천 이슈](https://github.com/738/awesome-devbook/issues/new?template=book-request.yml)에 ISBN, 분야, 추천 이유만 남겨 주세요. 메인테이너가 반영합니다.

## PR 로 직접 추가하기

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run lookup -- 9791158391409      # 알라딘에서 책 정보를 읽어 books.yml 항목을 만들어 줍니다
```

1. 출력된 항목을 `data/books.yml` 의 알맞은 분야 자리에 붙여넣고 `category` 를 채웁니다.
   - 분야 이름은 `data/categories.yml` 에 있는 이름을 씁니다. 하위 분류는 `프론트엔드/리액트` 처럼 적습니다.
   - 맞는 분야가 없다면 `data/categories.yml` 에 새 분야를 추가해 주세요. (목차는 2단계까지만)
2. 제목·부제를 표지 표기대로 다듬습니다. 판매용 문구(수상 내역, "개정판" 같은 표기)는 부제에서 빼 주세요.
3. `npm run build` 로 README.md 와 docs/books.json 을 다시 만듭니다.
4. 세 파일을 함께 커밋하고 Pull Request 를 생성합니다.

## 원칙

- **국내에 정식 출간된 책**만 받습니다. ISBN-13 으로 관리합니다.
- 같은 책의 여러 판은 **최신판 하나**만 둡니다. 개정판이 나오면 구판을 교체해 주세요.
- 절판된 책은 대체할 책이 없을 때만 남기고 `out_of_print: true` 로 표시합니다. 절판 여부는 매주 자동 점검됩니다.
- 시리즈는 대표 권 하나를 등록하고 제목에 `시리즈` 를 붙입니다.

CI 가 ISBN 체크섬, 중복, 분야 이름, README 동기화를 검사합니다. 실패하면 메시지대로 고친 뒤 다시 푸시해 주세요.
