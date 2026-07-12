import {
  findAllOrdered,
  findById,
  create,
  update,
  remove,
  reorder,
} from '../models/ratingLevelModel.js';

/**
 * Public: the survey screen needs the current scale (labels, values,
 * colors, emoji) to render the right number of answer buttons.
 */
export function listPublic(req, res) {
  const levels = findAllOrdered().map((l) => ({
    id: l.id,
    label: l.label,
    value: l.value,
    color: l.color,
    emoji: l.emoji,
  }));
  res.json({ success: true, data: levels });
}

export function listAdmin(req, res) {
  res.json({ success: true, data: findAllOrdered() });
}

export function createLevel(req, res) {
  const { label, value, color, emoji } = req.body || {};
  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'BadRequest', message: 'نص المستوى مطلوب' });
  }
  if (!Number.isFinite(Number(value))) {
    return res.status(400).json({ error: 'BadRequest', message: 'قيمة المستوى يجب أن تكون رقماً' });
  }
  const id = create({
    label: label.trim(),
    value: Number(value),
    color: color || '#1565c0',
    emoji: emoji || '🔵',
  });
  res.status(201).json({ success: true, data: { id } });
}

export function updateLevel(req, res) {
  const id = Number(req.params.id);
  const { label, value, color, emoji } = req.body || {};
  if (!findById(id)) {
    return res.status(404).json({ error: 'NotFound', message: 'المستوى غير موجود' });
  }
  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'BadRequest', message: 'نص المستوى مطلوب' });
  }
  if (!Number.isFinite(Number(value))) {
    return res.status(400).json({ error: 'BadRequest', message: 'قيمة المستوى يجب أن تكون رقماً' });
  }
  update(id, {
    label: label.trim(),
    value: Number(value),
    color: color || '#1565c0',
    emoji: emoji || '🔵',
  });
  res.json({ success: true });
}

export function deleteLevel(req, res) {
  const id = Number(req.params.id);
  if (!findById(id)) {
    return res.status(404).json({ error: 'NotFound', message: 'المستوى غير موجود' });
  }
  const remaining = findAllOrdered().length;
  if (remaining <= 2) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'يجب أن يبقى مستويان على الأقل في مقياس التقييم',
    });
  }
  remove(id);
  res.json({ success: true });
}

export function reorderLevels(req, res) {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'BadRequest', message: 'ترتيب غير صالح' });
  }
  reorder(orderedIds.map(Number));
  res.json({ success: true });
}
