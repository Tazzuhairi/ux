import { Router } from 'express';
import express from 'express';
import {
  getSettings,
  getPublicSettings,
  updateLibraryName,
  updateResultDisplaySeconds,
  updateLogo,
  resetAllStatistics,
  createBackup,
  restoreBackup,
} from '../controllers/settingController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

// Public: the start/survey screens need the library name/logo and the
// result-display duration, none of which are sensitive information.
router.get('/public', getPublicSettings);

router.get('/', requireAuthApi, getSettings);
router.put('/library-name', requireAuthApi, updateLibraryName);
router.put('/result-display-seconds', requireAuthApi, updateResultDisplaySeconds);
router.put('/logo', requireAuthApi, updateLogo);
router.post('/reset-statistics', requireAuthApi, resetAllStatistics);
router.get('/backup', requireAuthApi, createBackup);

// Raw binary body just for the restore endpoint (the uploaded .db file
// itself), instead of adding a multipart-upload dependency like multer.
router.post(
  '/restore',
  requireAuthApi,
  express.raw({ type: 'application/octet-stream', limit: '50mb' }),
  restoreBackup
);

export default router;
