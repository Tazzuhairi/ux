import { all, get, run } from '../database/db.js';

/**
 * Active questions only, in display order - used by the public
 * survey screen.
 */
export function findAllEnabled() {
  return all('SELECT * FROM questions WHERE enabled = 1 ORDER BY sort_order ASC');
}

/**
 * All questions (enabled or not), in display order - used by the
 * admin question-management screen.
 */
export function findAll() {
  return all('SELECT * FROM questions ORDER BY sort_order ASC');
}

export function findById(id) {
  return get('SELECT * FROM questions WHERE id = ?', [id]);
}

/**
 * Creates a new question at the end of the current order, and an
 * accompanying zeroed statistics row so aggregation queries never
 * need to special-case "no stats row yet".
 */
export function create(question) {
  const maxOrder = get('SELECT MAX(sort_order) AS maxOrder FROM questions');
  const nextOrder = (maxOrder?.maxOrder || 0) + 1;

  const { lastInsertRowid } = run(
    'INSERT INTO questions (question, sort_order, enabled) VALUES (?, ?, 1)',
    [question, nextOrder]
  );
  run('INSERT INTO statistics (question_id, total_score, responses_count) VALUES (?, 0, 0)', [
    lastInsertRowid,
  ]);
  return lastInsertRowid;
}

export function update(id, question) {
  run('UPDATE questions SET question = ? WHERE id = ?', [question, id]);
}

export function remove(id) {
  run('DELETE FROM statistics WHERE question_id = ?', [id]);
  run('DELETE FROM questions WHERE id = ?', [id]);
}

export function setEnabled(id, enabled) {
  run('UPDATE questions SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
}

/**
 * Replaces the sort_order of every question according to the given
 * ordered array of question ids (used by drag-and-drop reordering in
 * the admin panel).
 */
export function reorder(orderedIds) {
  orderedIds.forEach((id, index) => {
    run('UPDATE questions SET sort_order = ? WHERE id = ?', [index + 1, id]);
  });
}
