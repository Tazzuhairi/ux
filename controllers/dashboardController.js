import { findAllWithQuestions } from '../models/statisticsModel.js';
import { findRange, findAll as findAllDailySummary, totalCountsByLevel } from '../models/dailySummaryModel.js';
import { getValue } from '../models/metaModel.js';
import { findAllOrdered as findAllLevels } from '../models/ratingLevelModel.js';

function todayDate() {
  return new Date();
}

function toDateString(d) {
  return d.toISOString().slice(0, 10);
}

function sumVisitors(rows) {
  return rows.reduce((s, r) => s + r.visitors, 0);
}

/**
 * Builds all figures shown on the admin dashboard: participant counts
 * (today / rolling 7 days / calendar month-to-date), the overall
 * satisfaction index, best/weakest service, the last submission time,
 * and the average response duration. `scaleMax` is included so the
 * dashboard can label the index correctly (e.g. "من 3" or "من 5")
 * whatever rating scale is currently configured.
 */
export function getSummary(req, res) {
  const today = todayDate();
  const todayStr = toDateString(today);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // rolling 7-day window incl. today
  const weekRows = findRange(toDateString(sevenDaysAgo), todayStr);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRows = findRange(toDateString(monthStart), todayStr);

  const todayRows = findRange(todayStr, todayStr);

  const stats = findAllWithQuestions();
  const withResponses = stats.filter((s) => s.responses_count > 0);

  let overallIndex = null;
  if (withResponses.length > 0) {
    const totalScore = withResponses.reduce((s, r) => s + r.total_score, 0);
    const totalResponses = withResponses.reduce((s, r) => s + r.responses_count, 0);
    overallIndex = Number((totalScore / totalResponses).toFixed(2));
  }

  let bestService = null;
  let weakestService = null;
  if (withResponses.length > 0) {
    const withAverage = withResponses.map((r) => ({
      question: r.question,
      average: r.total_score / r.responses_count,
    }));
    bestService = withAverage.reduce((a, b) => (b.average > a.average ? b : a));
    weakestService = withAverage.reduce((a, b) => (b.average < a.average ? b : a));
  }

  const totalResponseMs = Number(getValue('total_response_time_ms') || 0);
  const responseCount = Number(getValue('response_time_count') || 0);
  const avgResponseSeconds =
    responseCount > 0 ? Number((totalResponseMs / responseCount / 1000).toFixed(1)) : null;

  const levels = findAllLevels();
  const scaleMax = levels.length > 0 ? Math.max(...levels.map((l) => l.value)) : null;

  res.json({
    success: true,
    data: {
      participantsToday: sumVisitors(todayRows),
      participantsThisWeek: sumVisitors(weekRows),
      participantsThisMonth: sumVisitors(monthRows),
      overallIndex,
      scaleMax,
      bestService: bestService ? { question: bestService.question, average: Number(bestService.average.toFixed(2)) } : null,
      weakestService: weakestService ? { question: weakestService.question, average: Number(weakestService.average.toFixed(2)) } : null,
      lastSubmissionAt: getValue('last_submission_at') || null,
      averageResponseSeconds: avgResponseSeconds,
    },
  });
}

/**
 * Chart data for the dashboard's three Chart.js charts: satisfaction
 * distribution (pie - one slice per CONFIGURED rating level, however
 * many there are), per-question averages (bar), and daily visitor
 * counts for the last 30 days (line).
 */
export function getChartData(req, res) {
  const levels = findAllLevels();
  const counts = totalCountsByLevel();
  const countByLevelId = new Map(counts.map((c) => [c.level_id, c.total]));

  const distribution = levels.map((l) => ({
    label: l.label,
    emoji: l.emoji,
    color: l.color,
    count: countByLevelId.get(l.id) || 0,
  }));

  const stats = findAllWithQuestions();
  const perQuestion = stats.map((s) => ({
    question: s.question,
    average: s.responses_count > 0 ? Number((s.total_score / s.responses_count).toFixed(2)) : 0,
  }));

  const today = todayDate();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const last30 = findRange(toDateString(thirtyDaysAgo), toDateString(today));

  res.json({
    success: true,
    data: {
      distribution,
      perQuestion,
      dailyVisitors: last30.map((r) => ({ date: r.date, visitors: r.visitors })),
    },
  });
}
