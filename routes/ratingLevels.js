import { Router } from 'express';
import {
  listPublic,
  listAdmin,
  createLevel,
  updateLevel,
  deleteLevel,
  reorderLevels,
} from '../controllers/ratingLevelController.js';
import { requireAuthApi } from '../middleware/requireAuth.js';

const router = Router();

// Public: the survey screen needs this to render the right number of
// answer buttons with the configured labels/colors/emoji.
router.get('/public', listPublic);

router.get('/', requireAuthApi, listAdmin);
router.post('/', requireAuthApi, createLevel);
router.put('/reorder', requireAuthApi, reorderLevels);
router.put('/:id', requireAuthApi, updateLevel);
router.delete('/:id', requireAuthApi, deleteLevel);

export default router;
