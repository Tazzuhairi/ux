import { all, get, run } from '../database/db.js';

export function getValue(key) {
  const row = get('SELECT value FROM meta WHERE key = ?', [key]);
  return row ? row.value : null;
}

export function setValue(key, value) {
  const existing = get('SELECT key FROM meta WHERE key = ?', [key]);
  if (existing) {
    run('UPDATE meta SET value = ? WHERE key = ?', [value, key]);
  } else {
    run('INSERT INTO meta (key, value) VALUES (?, ?)', [key, value]);
  }
}

/**
 * Returns every meta row as a plain { key: value } object - convenient
 * for the Settings screen and the dashboard.
 */
export function getAll() {
  const rows = all('SELECT * FROM meta');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Folds one more survey-completion duration into the running average
 * response time shown on the dashboard.
 */
export function recordResponseTime(durationMs) {
  const totalMs = Number(getValue('total_response_time_ms') || 0) + durationMs;
  const count = Number(getValue('response_time_count') || 0) + 1;
  setValue('total_response_time_ms', String(totalMs));
  setValue('response_time_count', String(count));
}

export function resetResponseTimeStats() {
  setValue('total_response_time_ms', '0');
  setValue('response_time_count', '0');
}
