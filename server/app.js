import express from 'express';
import db from './db.js';

const app = express();

app.use(express.json());

app.get('/api/books', (req, res) => {
  const books = db
    .prepare('SELECT id, title, author, borrower, borrowed_at, loan_days FROM books ORDER BY id')
    .all();
  res.json(books);
});

const COLUMNS = 'id, title, author, borrower, borrowed_at, loan_days';

const findBook = (id) => db.prepare(`SELECT ${COLUMNS} FROM books WHERE id = ?`).get(id);

const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 명세(docs/api.md)의 대여 경로는 /rent 이다
app.post('/api/books/:id/rent', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: '이름을 입력하세요' });
  }

  const days = req.body.days === undefined ? 7 : req.body.days;
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return res.status(400).json({ error: '대여 기간은 1~30일 정수여야 합니다' });
  }

  const book = findBook(req.params.id);
  if (!book) {
    return res.status(404).json({ error: '책을 찾을 수 없습니다' });
  }

  // borrower IS NULL 조건으로 갱신해 이미 대여 중이면 아무것도 바꾸지 않는다
  const result = db
    .prepare('UPDATE books SET borrower = ?, borrowed_at = ?, loan_days = ? WHERE id = ? AND borrower IS NULL')
    .run(name, today(), days, book.id);
  if (result.changes === 0) {
    return res.status(409).json({ error: '이미 대여 중인 책입니다' });
  }

  res.json(findBook(book.id));
});

app.post('/api/books/:id/return', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) {
    return res.status(404).json({ error: '책을 찾을 수 없습니다' });
  }

  const result = db
    .prepare('UPDATE books SET borrower = NULL, borrowed_at = NULL, loan_days = NULL WHERE id = ? AND borrower IS NOT NULL')
    .run(book.id);
  if (result.changes === 0) {
    return res.status(409).json({ error: '대여 중인 책이 아닙니다' });
  }

  res.json(findBook(book.id));
});

export default app;
