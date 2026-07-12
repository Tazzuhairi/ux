// ===================================================================
// LSS - Report screen logic (public/report.html)
//
// PDF export uses the browser's native print-to-PDF (window.print())
// rather than generating the file with PDFKit on the server. Tested
// directly: PDFKit does not perform Arabic contextual shaping/bidi
// reordering on its own, so Arabic text comes out with disconnected
// letterforms - the browser's own renderer displays Arabic correctly
// with zero extra shaping libraries needed.
// ===================================================================

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

async function loadResults() {
  const res = await fetch('/api/reports/results');
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const json = await res.json();
  const rows = json.data;

  document.getElementById('printHeader').textContent =
    `تقرير نتائج التقييم — بتاريخ ${new Date().toLocaleDateString('ar-IQ')}`;

  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';
  rows.forEach((r, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${r.question}</td>
      <td>${r.responsesCount}</td>
      <td>${r.totalScore}</td>
      <td>${r.average ?? '-'}</td>
      <td><span class="status-badge" style="background:color-mix(in srgb, ${r.status.color} 15%, #ffffff); color:${r.status.color}">${r.status.emoji} ${r.status.label}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

loadResults();
