import bcrypt from 'bcrypt';
import { exec, get, run } from './db.js';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS statistics (
  question_id INTEGER PRIMARY KEY,
  total_score INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Configurable rating scale: the admin can change how many levels
-- exist and how each is labeled/valued (e.g. 3 levels: جيد/مقبول/ضعيف,
-- or 5 levels: ممتاز/جيد/متوسط/مقبول/ضعيف, or any custom wording such
-- as a Likert agreement scale).
CREATE TABLE IF NOT EXISTS rating_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#1565c0',
  emoji TEXT NOT NULL DEFAULT '🔵',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_summary (
  date TEXT PRIMARY KEY,
  visitors INTEGER NOT NULL DEFAULT 0,
  overall_index REAL NOT NULL DEFAULT 0
);

-- One row per (date, rating_level) pair - replaces the old fixed
-- good/normal/bad columns so the distribution chart and dashboard
-- work correctly no matter how many levels are configured.
CREATE TABLE IF NOT EXISTS daily_level_counts (
  date TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, level_id),
  FOREIGN KEY (level_id) REFERENCES rating_levels(id)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

// Default 3-level scale, matching the requirements document exactly
// (جيدة=3, مقبولة=2, ضعيفة=1). The admin can change the number of
// levels and their wording at any time from Settings.
const DEFAULT_RATING_LEVELS = [
  { label: 'جيدة', value: 3, color: '#2e7d32', emoji: '🟢' },
  { label: 'مقبولة', value: 2, color: '#f9a825', emoji: '🟡' },
  { label: 'ضعيفة', value: 1, color: '#c62828', emoji: '🔴' },
];

// The 12 questions, worded exactly as specified in the requirements
// document (section 8), in their original order.
const DEFAULT_QUESTIONS = [
  'ما مدى سهولة الوصول إلى المصادر والمعلومات التي كنت تبحث عنها؟',
  'ما مدى سهولة استخدام نظام البحث الإلكتروني (الفهرس) للعثور على ما تحتاجه؟',
  'كيف تقيم سرعة إنجاز إجراءات الإعارة والإرجاع؟',
  'ما مدى وضوح الإرشادات واللافتات داخل المكتبة؟',
  'كيف تقيم تعامل الموظفين معك؟',
  'كيف كانت بيئة القراءة والدراسة؟',
  'كيف تقيم الخدمات الرقمية؟',
  'ما مدى ملاءمة أوقات الدوام؟',
  'كيف تقيم خدمة WiFi؟',
  'كيف تقيم توفر قاعات الدراسة الجماعية؟',
  'كيف تقيم توفر أماكن القراءة الفردية؟',
  'كيف تقيم توفر المقابس الكهربائية؟',
];

const DEFAULT_META = {
  library_name: 'المكتبة المركزية',
  library_logo_path: '',
  result_display_seconds: '5',
  total_response_time_ms: '0',
  response_time_count: '0',
  last_submission_at: '',
};

/**
 * Creates all tables if they don't already exist, and seeds the
 * default admin account + question bank + settings ONLY on first run
 * (an empty `users` table is used as the "not yet seeded" signal).
 */
export async function initSchemaAndSeed() {
  exec(SCHEMA_SQL);

  const existingAdmin = get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin@2026', 10);
    run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', passwordHash]);
  }

  const questionCount = get('SELECT COUNT(*) AS count FROM questions');
  if (!questionCount || questionCount.count === 0) {
    DEFAULT_QUESTIONS.forEach((text, index) => {
      const { lastInsertRowid } = run(
        'INSERT INTO questions (question, sort_order, enabled) VALUES (?, ?, 1)',
        [text, index + 1]
      );
      run(
        'INSERT INTO statistics (question_id, total_score, responses_count) VALUES (?, 0, 0)',
        [lastInsertRowid]
      );
    });
  }

  const levelCount = get('SELECT COUNT(*) AS count FROM rating_levels');
  if (!levelCount || levelCount.count === 0) {
    DEFAULT_RATING_LEVELS.forEach((level, index) => {
      run(
        'INSERT INTO rating_levels (label, value, color, emoji, sort_order) VALUES (?, ?, ?, ?, ?)',
        [level.label, level.value, level.color, level.emoji, index + 1]
      );
    });
  }

  Object.entries(DEFAULT_META).forEach(([key, value]) => {
    const existing = get('SELECT key FROM meta WHERE key = ?', [key]);
    if (!existing) {
      run('INSERT INTO meta (key, value) VALUES (?, ?)', [key, value]);
    }
  });
}
