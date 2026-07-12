import { all, get, run } from '../database/db.js';

export function findAllOrdered() {
  return all('SELECT * FROM rating_levels ORDER BY sort_order ASC');
}

export function findById(id) {
  return get('SELECT * FROM rating_levels WHERE id = ?', [id]);
}

export function create({ label, value, color, emoji }) {
  const maxOrder = get('SELECT MAX(sort_order) AS maxOrder FROM rating_levels');
  const nextOrder = (maxOrder?.maxOrder || 0) + 1;
  const { lastInsertRowid } = run(
    'INSERT INTO rating_levels (label, value, color, emoji, sort_order) VALUES (?, ?, ?, ?, ?)',
    [label, value, color, emoji, nextOrder]
  );
  return lastInsertRowid;
}

export function update(id, { label, value, color, emoji }) {
  run('UPDATE rating_levels SET label = ?, value = ?, color = ?, emoji = ? WHERE id = ?', [
    label,
    value,
    color,
    emoji,
    id,
  ]);
}

export function remove(id) {
  run('DELETE FROM rating_levels WHERE id = ?', [id]);
}

export function reorder(orderedIds) {
  orderedIds.forEach((id, index) => {
    run('UPDATE rating_levels SET sort_order = ? WHERE id = ?', [index + 1, id]);
  });
}

/**
 * Finds the configured level whose `value` is closest to a given
 * average score - this is how a visitor's overall average (which can
 * fall between two level values, e.g. 2.33) is mapped back to a
 * single level for the result-screen emoji and the daily distribution
 * count. On an exact tie between two levels, the higher value wins
 * (benefit of the doubt), matching the original fixed 3-level
 * thresholds (>=2.5 counted as "good").
 */
export function findNearestLevel(levels, average) {
  let best = levels[0];
  let bestDistance = Math.abs(levels[0].value - average);

  for (const level of levels.slice(1)) {
    const distance = Math.abs(level.value - average);
    if (
      distance < bestDistance ||
      (distance === bestDistance && level.value > best.value)
    ) {
      best = level;
      bestDistance = distance;
    }
  }
  return best;
}
