import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';

const db = new Database(process.env.DB_PATH || 'app.db');

db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export default db;
