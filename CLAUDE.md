# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 상태

KOSTA 「Claude Code로 POC 프로젝트 만들기」 실습용 저장소다. 아직 코드가 없고 문서만 있다(`README.md`, `docs/idea.md`, `docs/idea-template.md`). 빌드·린트·테스트 명령은 없으며, `server/`, `client/`, 테스트, 설계 문서는 실습 중에 만든다. 기술 스택·성공 기준·범위는 2차시에 확정하므로, 그 전에는 임의로 정하지 않는다.

## 문서 구조

- `docs/idea.md`: 현재 아이디어(강사 데모 「사내 도서 대여」). 학습자가 자기 POC를 만들면 `docs/idea-template.md` 형식으로 다시 쓴다.
- `docs/idea-template.md`: 아이디어 문서 형식. 이 안의 「POC 범위 규칙」이 새 POC의 제약이다.
  - 스택 고정: Node.js 24, Express 5, better-sqlite3, React + Vite
  - 표 1~2개, API 3~4개, 화면 1개, 샘플 데이터 5건
  - 핵심 규칙 1개를 어기면 HTTP 409로 거부한다(도서 대여라면 대여 중인 책 재대여).
  - 만들지 않는 것: 로그인, 회원, 배포, 결제, 외부 API 연동

## POC 규칙

- 목적: Claude Code 와 git worktree 로 백엔드 · 프론트엔드를 나눠 만들어, 하루 안에 「목록 → 대여 → 이미 빌린 책 거부 → 반납」 흐름이 동작하는지 확인한다.
- 스택: Node.js 24 · Express 5 · better-sqlite3 · React + Vite
- 폴더: `server/` 는 API, `client/` 는 화면, `docs/` 는 문서
- 설계 문서: `docs/SPEC.md` · `docs/design.md` · `docs/tasks.md`
- 만들지 않는 것: 로그인 · 회원 · 배포, 그리고 `docs/idea.md` 에서 핵심이 아닌 기능
- 보고: 작업이 끝나면 바꾼 파일과 내용을 3줄로 알려 준다
- 언어: 답과 문서는 한국어로 쓴다

## 작업 방식

- 작업 위치는 `C:\poc`이다. 백엔드·프론트엔드를 git worktree로 나눠 병렬로 만드는 것이 이번 실습의 목표다. 이미 `.kilo/worktrees/` 아래에 worktree 사본이 있다.
- 문서와 커밋 메시지는 한국어로 쓴다(기존 커밋 `스타터: 아이디어와 실습 안내` 기준).
- `.gitignore`는 `node_modules/`, `*.db*`, `.env`, `dist/`를 제외한다. SQLite DB 파일은 커밋하지 않는다.
