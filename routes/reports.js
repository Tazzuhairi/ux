import { Router } from 'express';
import { getResults, exportCsv, exportExcel } from '../controllers/reportController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

router.get('/results', requireAuthApi, getResults);
router.get('/export/csv', requireAuthApi, exportCsv);
router.get('/export/excel', requireAuthApi, exportExcel);

export default router;
