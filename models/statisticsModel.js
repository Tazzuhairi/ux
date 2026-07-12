import { all, run } from '../database/db.js';

/**
 * Adds one more rating to a question's running total (called once
 * per answered question when a survey is submitted).
 */
export function addRating(questionId, rating) {
  run(
    `UPDATE statistics
     SET total_score = total_score + ?, responses_count = responses_count + 1
     WHERE question_id = ?`,
    [rating, questionId]
  );
}

/**
 * All statistics rows joined with their question text - the basis for
 * the dashboard's "best/weakest service" and the full results table.
 */
export function findAllWithQuestions() {
  return all(`
    SELECT q.id AS question_id, q.question AS question, q.sort_order AS sort_order,
           s.total_score AS total_score, s.responses_count AS responses_count
    FROM questions q
    LEFT JOIN statistics s ON s.question_id = q.id
    ORDER BY q.sort_order ASC
  `);
}

/**
 * Resets every question's running totals back to zero (used by
 * Settings > "إعادة ضبط جميع الإحصاءات").
 */
export function resetAll() {
  run('UPDATE statistics SET total_score = 0, responses_count = 0');
}
