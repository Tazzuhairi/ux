// ===================================================================
// LSS - Dashboard logic (public/dashboard.html)
// ===================================================================

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.toLocaleDateString('ar-IQ')} ${d.toLocaleTimeString('ar-IQ')}`;
}

async function loadSummary() {
  const res = await fetch('/api/dashboard/summary');
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const json = await res.json();
  const d = json.data;

  document.getElementById('statToday').textContent = d.participantsToday;
  document.getElementById('statWeek').textContent = d.participantsThisWeek;
  document.getElementById('statMonth').textContent = d.participantsThisMonth;
  document.getElementById('statOverall').textContent = d.overallIndex ?? '-';
  document.querySelector('#statOverall').nextElementSibling.textContent =
    d.scaleMax ? `مؤشر الرضا العام (من ${d.scaleMax})` : 'مؤشر الرضا العام';

  document.getElementById('bestService').textContent = d.bestService
    ? `${d.bestService.question} (${d.bestService.average})`
    : 'لا توجد بيانات بعد';
  document.getElementById('weakestService').textContent = d.weakestService
    ? `${d.weakestService.question} (${d.weakestService.average})`
    : 'لا توجد بيانات بعد';
  document.getElementById('lastSubmission').textContent = formatDateTime(d.lastSubmissionAt);
  document.getElementById('avgResponseTime').textContent =
    d.averageResponseSeconds !== null ? `${d.averageResponseSeconds} ثانية` : '-';
}

async function loadCharts() {
  const res = await fetch('/api/dashboard/charts');
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const json = await res.json();
  const d = json.data;

  const summaryRes = await fetch('/api/dashboard/summary');
  const summaryJson = await summaryRes.json();
  const yMax = summaryJson.data.scaleMax || 3;

  new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
      labels: d.distribution.map((l) => `${l.emoji} ${l.label}`),
      datasets: [
        {
          data: d.distribution.map((l) => l.count),
          backgroundColor: d.distribution.map((l) => l.color),
        },
      ],
    },
    options: { responsive: true },
  });

  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: d.perQuestion.map((q, i) => `س${i + 1}`),
      datasets: [
        {
          label: 'المتوسط (من 3)',
          data: d.perQuestion.map((q) => q.average),
          backgroundColor: '#1565c0',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: yMax } },
      plugins: { legend: { display: false } },
    },
  });

  new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: d.dailyVisitors.map((r) => r.date),
      datasets: [
        {
          label: 'عدد المشاركين',
          data: d.dailyVisitors.map((r) => r.visitors),
          borderColor: '#1565c0',
          backgroundColor: 'rgba(21,101,192,0.15)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

loadSummary();
loadCharts();
