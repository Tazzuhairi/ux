import { get, run } from '../database/db.js';

/**
 * Finds a user by username. Returns undefined if not found.
 */
export function findByUsername(username) {
  return get('SELECT * FROM users WHERE username = ?', [username]);
}

/**
 * Updates a user's password hash.
 */
export function updatePassword(userId, newPasswordHash) {
  run('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, userId]);
}
