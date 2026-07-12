import { Router } from 'express';
import { getSummary, getChartData } from '../controllers/dashboardController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

router.get('/summary', requireAuthApi, getSummary);
router.get('/charts', requireAuthApi, getChartData);

export default router;
