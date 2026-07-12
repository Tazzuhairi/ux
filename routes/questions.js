import { Router } from 'express';
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestion,
  reorderQuestions,
} from '../controllers/questionController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', requireAuthApi, listQuestions);
router.post('/', requireAuthApi, createQuestion);
router.put('/reorder', requireAuthApi, reorderQuestions);
router.put('/:id', requireAuthApi, updateQuestion);
router.delete('/:id', requireAuthApi, deleteQuestion);
router.patch('/:id/toggle', requireAuthApi, toggleQuestion);

export default router;
