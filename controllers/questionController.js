import {
  findAll,
  findById,
  create,
  update,
  remove,
  setEnabled,
  reorder,
} from '../models/questionModel.js';

export function listQuestions(req, res) {
  res.json({ success: true, data: findAll() });
}

export function createQuestion(req, res) {
  const { question } = req.body || {};
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'BadRequest', message: 'نص السؤال مطلوب' });
  }
  const id = create(question.trim());
  res.status(201).json({ success: true, data: { id } });
}

export function updateQuestion(req, res) {
  const id = Number(req.params.id);
  const { question } = req.body || {};
  if (!findById(id)) {
    return res.status(404).json({ error: 'NotFound', message: 'السؤال غير موجود' });
  }
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'BadRequest', message: 'نص السؤال مطلوب' });
  }
  update(id, question.trim());
  res.json({ success: true });
}

export function deleteQuestion(req, res) {
  const id = Number(req.params.id);
  if (!findById(id)) {
    return res.status(404).json({ error: 'NotFound', message: 'السؤال غير موجود' });
  }
  remove(id);
  res.json({ success: true });
}

export function toggleQuestion(req, res) {
  const id = Number(req.params.id);
  const question = findById(id);
  if (!question) {
    return res.status(404).json({ error: 'NotFound', message: 'السؤال غير موجود' });
  }
  setEnabled(id, !question.enabled);
  res.json({ success: true, data: { enabled: !question.enabled } });
}

export function reorderQuestions(req, res) {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'BadRequest', message: 'ترتيب غير صالح' });
  }
  reorder(orderedIds.map(Number));
  res.json({ success: true });
}
