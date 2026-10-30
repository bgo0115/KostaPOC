import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 기본 DB 는 실행 위치와 상관없이 server/app.db 로 고정한다
const db = new Database(process.env.DB_PATH || fileURLToPath(new URL('./app.db', import.meta.url)));

db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export default db;
