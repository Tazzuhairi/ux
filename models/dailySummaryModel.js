import { all, get, run } from '../database/db.js';

/**
 * Records one completed survey against today's row, creating it if
 * this is the day's first visitor, and increments the count for
 * whichever configured rating level this visitor's average matched
 * (works no matter how many levels are configured).
 *
 * @param {string} date - YYYY-MM-DD
 * @param {number} levelId - the matched rating_levels.id
 * @param {number} visitorAverage - this visitor's own average
 */
export function recordVisitor(date, levelId, visitorAverage) {
  const existing = get('SELECT * FROM daily_summary WHERE date = ?', [date]);

  if (!existing) {
    run('INSERT INTO daily_summary (date, visitors, overall_index) VALUES (?, 1, ?)', [
      date,
      visitorAverage,
    ]);
  } else {
    const newVisitors = existing.visitors + 1;
    const newOverallIndex =
      (existing.overall_index * existing.visitors + visitorAverage) / newVisitors;
    run('UPDATE daily_summary SET visitors = ?, overall_index = ? WHERE date = ?', [
      newVisitors,
      newOverallIndex,
      date,
    ]);
  }

  const existingCount = get(
    'SELECT count FROM daily_level_counts WHERE date = ? AND level_id = ?',
    [date, levelId]
  );
  if (existingCount) {
    run('UPDATE daily_level_counts SET count = count + 1 WHERE date = ? AND level_id = ?', [
      date,
      levelId,
    ]);
  } else {
    run('INSERT INTO daily_level_counts (date, level_id, count) VALUES (?, ?, 1)', [
      date,
      levelId,
    ]);
  }
}

export function findByDate(date) {
  return get('SELECT * FROM daily_summary WHERE date = ?', [date]);
}

/**
 * All daily rows within an inclusive date range, ascending - used for
 * "this week" / "this month" totals and the line chart.
 */
export function findRange(startDate, endDate) {
  return all(
    'SELECT * FROM daily_summary WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
}

export function findAll() {
  return all('SELECT * FROM daily_summary ORDER BY date ASC');
}

/**
 * Total count per rating level across ALL recorded days - the basis
 * for the dashboard's satisfaction-distribution pie chart.
 */
export function totalCountsByLevel() {
  return all(`
    SELECT level_id, SUM(count) AS total
    FROM daily_level_counts
    GROUP BY level_id
  `);
}

export function resetAll() {
  run('DELETE FROM daily_summary');
  run('DELETE FROM daily_level_counts');
}
