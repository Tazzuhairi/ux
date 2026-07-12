import XLSX from 'xlsx';
import { findAllWithQuestions } from '../models/statisticsModel.js';
import { findAllOrdered, findNearestLevel } from '../models/ratingLevelModel.js';

function buildRows() {
  const levels = findAllOrdered();

  return findAllWithQuestions().map((s) => {
    const average = s.responses_count > 0 ? s.total_score / s.responses_count : null;
    const matchedLevel =
      average !== null && levels.length > 0 ? findNearestLevel(levels, average) : null;

    return {
      questionId: s.question_id,
      question: s.question,
      responsesCount: s.responses_count,
      totalScore: s.total_score,
      average: average !== null ? Number(average.toFixed(2)) : null,
      status: matchedLevel
        ? { label: matchedLevel.label, color: matchedLevel.color, emoji: matchedLevel.emoji }
        : { label: '-', color: '#94a3b8', emoji: '' },
    };
  });
}

/**
 * Full results table (one row per question) for the on-screen report
 * and as the shared source of truth for the CSV/Excel exports below.
 * The status shown per question is whichever configured rating level
 * its average is closest to - works with any scale (3 levels, 5
 * levels, custom wording, etc.), not a hardcoded good/normal/bad.
 */
export function getResults(req, res) {
  res.json({ success: true, data: buildRows() });
}

/**
 * CSV export with a UTF-8 BOM so Arabic text displays correctly when
 * the file is opened directly in Excel.
 */
export function exportCsv(req, res) {
  const rows = buildRows();
  const header = ['رقم السؤال', 'نص السؤال', 'عدد الإجابات', 'المجموع', 'المتوسط', 'الحالة'];

  const lines = [header.join(',')];
  rows.forEach((r, index) => {
    const line = [
      index + 1,
      `"${r.question.replace(/"/g, '""')}"`,
      r.responsesCount,
      r.totalScore,
      r.average ?? '-',
      r.status.label,
    ].join(',');
    lines.push(line);
  });

  const csv = '\uFEFF' + lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="library-satisfaction-report.csv"');
  res.send(csv);
}

/**
 * Excel (.xlsx) export via SheetJS - a real spreadsheet, not just a
 * renamed CSV, with proper column widths and RTL-friendly text.
 */
export function exportExcel(req, res) {
  const rows = buildRows();

  const data = rows.map((r, index) => ({
    'رقم السؤال': index + 1,
    'نص السؤال': r.question,
    'عدد الإجابات': r.responsesCount,
    المجموع: r.totalScore,
    المتوسط: r.average ?? '-',
    الحالة: r.status.label,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 50 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="library-satisfaction-report.xlsx"');
  res.send(buffer);
}
