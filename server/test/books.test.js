import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// db.js 를 불러오기 전에 메모리 DB 로 지정한다
process.env.DB_PATH = ':memory:';

const { default: request } = await import('supertest');
const { default: app } = await import('../app.js');
const { default: db } = await import('../db.js');

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

// 테스트마다 표를 새로 만들어 샘플 5권이 든 새 DB 상태로 시작한다
beforeEach(() => {
  db.exec('DROP TABLE IF EXISTS books');
  db.exec(schema);
});

test('(a) 목록: GET /api/books 가 200 과 샘플 5권(제목·대여 상태·대여자)을 돌려준다', async () => {
  const res = await request(app).get('/api/books');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 5);
  for (const book of res.body) {
    assert.ok(book.title);
    assert.ok('borrower' in book);
    assert.equal(book.borrower, null);
  }
});

test('(b) 대여: 대여 가능한 책을 빌리면 200 이고 이후 목록에 대여자가 표시된다', async () => {
  const rent = await request(app).post('/api/books/1/rent').send({ name: '홍길동' });
  assert.equal(rent.status, 200);
  assert.equal(rent.body.borrower, '홍길동');

  const list = await request(app).get('/api/books');
  assert.equal(list.body.find((b) => b.id === 1).borrower, '홍길동');
});

test('(c) 핵심 규칙 거부: 대여 중인 책을 다시 빌리면 409 이고 상태·대여자가 바뀌지 않는다', async () => {
  await request(app).post('/api/books/1/rent').send({ name: '홍길동' });
  const before = (await request(app).get('/api/books')).body;

  const res = await request(app).post('/api/books/1/rent').send({ name: '김철수' });
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { error: '이미 대여 중인 책입니다' });

  const after = (await request(app).get('/api/books')).body;
  assert.deepEqual(after, before);
  assert.equal(after.find((b) => b.id === 1).borrower, '홍길동');
});

test('(d) 반납: 대여 중인 책을 반납하면 200 이고 대여 가능으로 돌아가 다시 대여할 수 있다', async () => {
  await request(app).post('/api/books/1/rent').send({ name: '홍길동' });

  const ret = await request(app).post('/api/books/1/return');
  assert.equal(ret.status, 200);

  const list = await request(app).get('/api/books');
  assert.equal(list.body.find((b) => b.id === 1).borrower, null);

  const again = await request(app).post('/api/books/1/rent').send({ name: '김철수' });
  assert.equal(again.status, 200);
  assert.equal(again.body.borrower, '김철수');
});
