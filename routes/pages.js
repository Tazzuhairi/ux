import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuthPage } from '../middleware/requireAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const router = Router();

// Admin-only pages: redirected to /login.html server-side if there is
// no active session, so the URL can't just be opened directly.
router.get('/dashboard.html', requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});
router.get('/report.html', requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, 'report.html'));
});
router.get('/settings.html', requireAuthPage, (req, res) => {
  res.sendFile(path.join(publicDir, 'settings.html'));
});

export default router;
