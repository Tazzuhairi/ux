import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../database/database.db');

let SQL = null;
let db = null;

/**
 * Initializes the database: loads the WASM SQLite engine, opens the
 * existing database file if present, or creates a fresh one.
 *
 * NOTE ON TECHNOLOGY CHOICE: the requirements document lists `sqlite3`
 * as the database library. That package (and its usual alternative,
 * `better-sqlite3`) are native addons: if no prebuilt binary matches
 * your exact OS/Node combination, npm falls back to compiling from
 * source, which downloads Node header files from nodejs.org - the
 * same category of network failure you already hit with Prisma's
 * engine download. `sql.js` is SQLite compiled to WebAssembly: it is
 * pure JavaScript from npm's point of view, so there is nothing to
 * compile and nothing extra to download after `npm install`. The
 * trade-off is that it keeps the database in memory and must be
 * explicitly saved to disk after writes, which `persist()` below
 * handles automatically after every mutation.
 */
export async function initDatabase() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

/**
 * Writes the current in-memory database to disk. Called after every
 * mutating query so data survives a server restart.
 */
export function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * Runs a mutating statement (INSERT/UPDATE/DELETE/CREATE) and persists
 * the database to disk afterward. Returns the number of changed rows
 * and, for INSERTs, the new row's id.
 */
export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();

  const changes = db.getRowsModified();
  const idResult = db.exec('SELECT last_insert_rowid() AS id');
  const lastInsertRowid = idResult[0]?.values[0][0] ?? null;

  persist();

  return { changes, lastInsertRowid };
}

/**
 * Runs a SELECT and returns the first matching row as a plain object,
 * or undefined if there are no matches.
 */
export function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const hasRow = stmt.step();
  const row = hasRow ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

/**
 * Runs a SELECT and returns all matching rows as plain objects.
 */
export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Executes raw SQL with no parameters (used for schema creation, which
 * can contain multiple semicolon-separated statements).
 */
export function exec(sql) {
  db.exec(sql);
  persist();
}

export function getDbPath() {
  return DB_PATH;
}

/**
 * Replaces the entire in-memory database with the contents of a
 * previously-exported .db file (used by Settings > Restore backup).
 */
export function loadFromBuffer(buffer) {
  db = new SQL.Database(buffer);
  persist();
}

export function exportBuffer() {
  return db.export();
}
