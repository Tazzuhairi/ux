import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAll, setValue } from '../models/metaModel.js';
import { resetAll as resetStatistics } from '../models/statisticsModel.js';
import { resetAll as resetDailySummary } from '../models/dailySummaryModel.js';
import { resetResponseTimeStats } from '../models/metaModel.js';
import { getDbPath, loadFromBuffer, exportBuffer } from '../database/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../public/images');
const BACKUP_DIR = path.resolve(__dirname, '../backup');
const LOGO_PATH = path.join(IMAGES_DIR, 'logo.png');

export function getSettings(req, res) {
  const meta = getAll();
  res.json({
    success: true,
    data: {
      libraryName: meta.library_name || '',
      libraryLogoPath: meta.library_logo_path || '',
      resultDisplaySeconds: Number(meta.result_display_seconds || 5),
    },
  });
}

/**
 * Same shape as getSettings but intentionally exposed WITHOUT auth:
 * the start screen and survey screen need the library name/logo and
 * the result-display duration, none of which are sensitive.
 */
export function getPublicSettings(req, res) {
  getSettings(req, res);
}

export function updateLibraryName(req, res) {
  const { libraryName } = req.body || {};
  if (!libraryName || typeof libraryName !== 'string') {
    return res.status(400).json({ error: 'BadRequest', message: 'اسم المكتبة مطلوب' });
  }
  setValue('library_name', libraryName.trim());
  res.json({ success: true });
}

export function updateResultDisplaySeconds(req, res) {
  const seconds = Number(req.body?.resultDisplaySeconds);
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 60) {
    return res.status(400).json({ error: 'BadRequest', message: 'المدة يجب أن تكون بين 1 و 60 ثانية' });
  }
  setValue('result_display_seconds', String(seconds));
  res.json({ success: true });
}

/**
 * Accepts a base64 data URL (e.g. "data:image/png;base64,...") and
 * writes it to public/images/logo.png. A JSON-encoded data URL is
 * used instead of a multipart file upload so no extra dependency
 * like multer is needed beyond the libraries already specified.
 */
export function updateLogo(req, res) {
  const { imageDataUrl } = req.body || {};
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(imageDataUrl || '');
  if (!match) {
    return res.status(400).json({ error: 'BadRequest', message: 'صيغة الصورة غير صالحة (PNG أو JPG فقط)' });
  }

  const buffer = Buffer.from(match[2], 'base64');
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  fs.writeFileSync(LOGO_PATH, buffer);

  setValue('library_logo_path', '/images/logo.png');
  res.json({ success: true, data: { libraryLogoPath: '/images/logo.png' } });
}

/**
 * Wipes all recorded satisfaction data (per-question totals, daily
 * summaries, response-time averages) while keeping the question bank,
 * admin account, and library branding intact.
 */
export function resetAllStatistics(req, res) {
  resetStatistics();
  resetDailySummary();
  resetResponseTimeStats();
  setValue('last_submission_at', '');
  res.json({ success: true });
}

/**
 * Saves a timestamped copy of the SQLite database into backup/, and
 * also streams it back as a downloadable file in the same request.
 */
export function createBackup(req, res) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, filename);

  fs.copyFileSync(getDbPath(), backupPath);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(exportBuffer()));
}

/**
 * Restores the database from an uploaded .db file, completely
 * replacing all current data (questions, statistics, users, meta).
 * Expects the raw file bytes as the request body
 * (Content-Type: application/octet-stream).
 */
export function restoreBackup(req, res) {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: 'BadRequest', message: 'لم يتم إرسال أي ملف نسخة احتياطية' });
  }

  try {
    loadFromBuffer(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'BadRequest', message: 'ملف النسخة الاحتياطية غير صالح أو تالف' });
  }
}
