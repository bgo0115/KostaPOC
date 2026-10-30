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

export default app;
