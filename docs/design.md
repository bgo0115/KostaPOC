# 설계 — 사내 도서 대여 POC

`docs/SPEC.md` 의 성공 기준 (a)~(d)를 만족하기 위한 설계다. 백엔드(`server/`)와 프론트엔드(`client/`)는 3절의 API 명세를 계약으로 삼아 git worktree 로 나눠 만든다.

## 1. 폴더 구조

```
package.json          루트. workspaces: ["server", "client"], 실행 스크립트
server/
  package.json        express, better-sqlite3
  app.js              Express 앱 생성(라우트 · DB 연결). listen 하지 않고 export
  server.js           app 을 불러 3000 포트로 listen
client/
  package.json        react, react-dom, vite
  vite.config.js      포트 5173, /api → http://localhost:3000 proxy
  index.html
  src/main.jsx
  src/App.jsx
docs/                 idea.md, SPEC.md, design.md
```

- `app.js` 와 `server.js` 를 나눠, 앱을 포트 없이 불러 쓸 수 있게 한다.
- DB 파일(`app.db`)은 `.gitignore` 의 `*.db*` 규칙으로 커밋되지 않는다.

## 2. DB (SQLite · better-sqlite3)

- 파일 경로: 환경 변수 `DB_PATH`, 없으면 `app.db`
- 표 1개: `books`

| 열 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 책 번호 |
| title | TEXT NOT NULL | 책 이름 |
| author | TEXT NOT NULL | 저자 |
| borrower | TEXT (NULL 허용) | 빌려간 사람 이름. NULL 이면 대여 가능 |
| borrowed_at | TEXT (NULL 허용) | 빌린 날짜 `YYYY-MM-DD`. 서버가 대여 시 오늘 날짜로 기록 |
| loan_days | INTEGER (NULL 허용) | 대여 기간(일). 대여 시 입력, 기본 7 |

- 대여 중이면 `borrower` · `borrowed_at` · `loan_days` 가 모두 값이 있다. 반납하면 세 열을 모두 NULL 로 되돌린다.
- 반납 예정일은 저장하지 않고 `borrowed_at + loan_days` 로 화면에서 계산한다.
- 샘플 데이터: 표가 비어 있을 때만 책 5권을 넣는다(서버를 다시 시작해도 중복되지 않는다). 5권 모두 대여 가능 상태로 시작한다.
- 핵심 규칙은 「`borrower` 가 NULL 인 행만 갱신」하는 한 번의 UPDATE 로 처리하고, 변경된 행이 0개이면 409 로 판정한다. 확인과 갱신이 나뉘지 않아 동시에 두 요청이 와도 한 명만 빌린다.

## 3. API (4개)

서버는 모든 경로를 `/api` 접두사로 받는다. Vite proxy 가 `/api` 요청을 그대로 3000 포트에 전달하기 때문이다. `docs/SPEC.md` 의 `/books` 표기는 이 접두사를 생략한 것이다.

요청 · 응답 본문은 JSON 이다. 오류는 항상 `{"error": "한국어 메시지"}` 형태다.

### GET /api/books — 목록 조회

- 요청: 본문 없음
- 응답 200:

```json
[
  {"id": 1, "title": "클린 코드", "author": "로버트 마틴", "borrower": null, "borrowed_at": null, "loan_days": null},
  {"id": 2, "title": "실용주의 프로그래머", "author": "데이비드 토머스", "borrower": "홍길동", "borrowed_at": "2026-10-30", "loan_days": 14}
]
```

### POST /api/books/:id/rent — 대여

- 요청: `{"name": "홍길동", "days": 14}` (`days` 를 생략하면 7)
- 응답 200: 갱신된 책 1권

```json
{"id": 1, "title": "클린 코드", "author": "로버트 마틴", "borrower": "홍길동", "borrowed_at": "2026-10-30", "loan_days": 14}
```

- 오류
  - 400: `{"error": "이름을 입력하세요"}` — `name` 이 없거나 공백뿐일 때(앞뒤 공백은 제거)
  - 400: `{"error": "대여 기간은 1~30일 정수여야 합니다"}`
  - 404: `{"error": "책을 찾을 수 없습니다"}` — 없는 `:id`
  - 409: `{"error": "이미 대여 중인 책입니다"}` — **핵심 규칙 위반**. 책의 상태와 대여자는 바뀌지 않는다.

### POST /api/books/:id/return — 반납

- 요청: 본문 없음(이름 확인 없이 누구나 반납)
- 응답 200: 갱신된 책 1권

```json
{"id": 1, "title": "클린 코드", "author": "로버트 마틴", "borrower": null, "borrowed_at": null, "loan_days": null}
```

- 오류
  - 404: `{"error": "책을 찾을 수 없습니다"}`
  - 409: `{"error": "대여 중인 책이 아닙니다"}` — 이미 대여 가능한 책을 반납하려 할 때

### GET /api/health — 상태 확인

- 응답 200: `{"ok": true}`

### 성공 기준 대응

| 성공 기준 | 설계 |
|---|---|
| (a) 목록 | `GET /api/books` 200, 샘플 5권 |
| (b) 대여 | `POST .../rent` 200, 목록에 대여자 · 빌린 날 · 기간 표시 |
| (c) 거부 | `POST .../rent` 를 대여 중인 책에 다시 호출하면 409 + 메시지, 화면에 메시지 표시 |
| (d) 반납 | `POST .../return` 200, 이후 같은 책 재대여 성공 |

## 4. 화면 (1개)

`client/src/App.jsx` 한 화면에 모두 둔다.

- 목록: 마운트 시 `GET /api/books` 로 불러와 책마다 책 이름 · 저자 · 상태를 보여 준다. 대여 가능이면 「대여 가능」, 대여 중이면 「○○ 대여 중 · 빌린 날 · 반납 예정일」.
- 입력칸: 이름, 대여 기간(일, 기본 7)
- 버튼: 책마다 1개. 대여 가능하면 「대여」, 대여 중이면 「반납」
- 오류 안내: API 가 오류를 돌려주면 화면 위쪽에 `error` 메시지를 그대로 표시한다. 성공하면 메시지를 지우고 목록을 다시 불러온다.
- fetch 는 `/api/...` 상대 경로만 쓴다(포트를 코드에 적지 않는다).

## 5. 포트 · 실행

| 대상 | 포트 | 비고 |
|---|---|---|
| 서버 | 3000 | `PORT` 로 바꿀 수 있고 기본값 3000 |
| 화면 | 5173 | Vite 개발 서버. `/api` 는 proxy 로 `http://localhost:3000` 에 전달 |

- 루트에서 workspace 별로 실행한다(예: `npm run dev -w server`, `npm run dev -w client`).
- worktree 분담: 백엔드는 `server/`, 프론트엔드는 `client/` 만 수정해 충돌을 피한다.
