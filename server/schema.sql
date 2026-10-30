CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  borrower    TEXT,
  borrowed_at TEXT,
  loan_days   INTEGER
);

-- 표가 비어 있을 때만 샘플 5권을 넣는다
INSERT INTO books (title, author)
SELECT title, author FROM (
  SELECT '클린 코드' AS title, '로버트 마틴' AS author
  UNION ALL SELECT '실용주의 프로그래머', '데이비드 토머스'
  UNION ALL SELECT '리팩터링', '마틴 파울러'
  UNION ALL SELECT '이펙티브 자바', '조슈아 블로크'
  UNION ALL SELECT '소프트웨어 장인', '산드로 만쿠소'
)
WHERE NOT EXISTS (SELECT 1 FROM books);
