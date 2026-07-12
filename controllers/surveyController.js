import { findAllEnabled, findById } from '../models/questionModel.js';
import { addRating } from '../models/statisticsModel.js';
import { recordVisitor } from '../models/dailySummaryModel.js';
import { recordResponseTime, setValue } from '../models/metaModel.js';
import { findAllOrdered, findNearestLevel } from '../models/ratingLevelModel.js';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the active question bank, in display order, for the public
 * survey screen to step through one at a time.
 */
export function getQuestions(req, res) {
  const questions = findAllEnabled().map((q) => ({ id: q.id, text: q.question }));
  res.json({ success: true, data: questions });
}

/**
 * Validates and processes one completed survey: updates the
 * per-question running totals, today's daily summary/level counts,
 * and the running average response-time - all in one request,
 * submitted once after the last question is answered.
 *
 * Ratings are validated against whatever rating scale is CURRENTLY
 * configured (not a hardcoded 1-3 range), so changing the scale in
 * Settings takes effect immediately for the next submission.
 */
export function submitSurvey(req, res) {
  const { answers, durationMs } = req.body || {};

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'BadRequest', message: 'لا توجد إجابات لحفظها' });
  }

  const levels = findAllOrdered();
  if (levels.length === 0) {
    return res.status(500).json({ error: 'ServerError', message: 'لا يوجد مقياس تقييم مُعرَّف' });
  }
  const validValues = new Set(levels.map((l) => l.value));

  for (const a of answers) {
    const question = findById(Number(a?.questionId));
    if (!question || !question.enabled) {
      return res.status(400).json({ error: 'BadRequest', message: 'أحد الأسئلة غير معروف أو غير نشط' });
    }
    if (!validValues.has(Number(a?.rating))) {
      return res.status(400).json({ error: 'BadRequest', message: 'قيمة تقييم غير صالحة ضمن الإجابات' });
    }
  }

  answers.forEach((a) => {
    addRating(Number(a.questionId), Number(a.rating));
  });

  const sum = answers.reduce((s, a) => s + Number(a.rating), 0);
  const average = sum / answers.length;
  const matchedLevel = findNearestLevel(levels, average);

  recordVisitor(todayDate(), matchedLevel.id, average);

  if (Number.isFinite(Number(durationMs)) && Number(durationMs) > 0) {
    recordResponseTime(Number(durationMs));
  }

  setValue('last_submission_at', new Date().toISOString());

  res.status(201).json({
    success: true,
    data: {
      average: Number(average.toFixed(2)),
      level: {
        id: matchedLevel.id,
        label: matchedLevel.label,
        emoji: matchedLevel.emoji,
        color: matchedLevel.color,
      },
    },
  });
}
