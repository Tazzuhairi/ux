import { Router } from 'express';
import { getQuestions, submitSurvey } from '../controllers/surveyController.js';

const router = Router();

router.get('/questions', getQuestions);
router.post('/submit', submitSurvey);

export default router;
