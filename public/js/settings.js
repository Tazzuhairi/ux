// ===================================================================
// LSS - Settings screen logic (public/settings.html)
// ===================================================================

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

const toast = document.getElementById('toast');
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
  setTimeout(() => toast.classList.add('d-none'), 3500);
}

// ---------------- Load current settings ----------------
async function loadSettings() {
  const res = await fetch('/api/settings');
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const json = await res.json();
  document.getElementById('libraryName').value = json.data.libraryName;
  document.getElementById('resultSeconds').value = json.data.resultDisplaySeconds;
  if (json.data.libraryLogoPath) {
    document.getElementById('logoPreview').src = json.data.libraryLogoPath;
    document.getElementById('logoPreview').style.display = '';
  }
}

// ---------------- Library name ----------------
document.getElementById('saveLibraryNameBtn').addEventListener('click', async () => {
  const libraryName = document.getElementById('libraryName').value.trim();
  const res = await fetch('/api/settings/library-name', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libraryName }),
  });
  const json = await res.json();
  showToast(json.success ? 'تم حفظ اسم المكتبة' : json.message, !json.success);
});

// ---------------- Logo ----------------
document.getElementById('saveLogoBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('logoInput');
  const file = fileInput.files[0];
  if (!file) {
    showToast('الرجاء اختيار صورة أولاً', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const res = await fetch('/api/settings/logo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: reader.result }),
    });
    const json = await res.json();
    if (json.success) {
      document.getElementById('logoPreview').src = `${json.data.libraryLogoPath}?t=${Date.now()}`;
      document.getElementById('logoPreview').style.display = '';
      showToast('تم حفظ الشعار');
    } else {
      showToast(json.message, true);
    }
  };
  reader.readAsDataURL(file);
});

// ---------------- Result display duration ----------------
document.getElementById('saveResultSecondsBtn').addEventListener('click', async () => {
  const resultDisplaySeconds = Number(document.getElementById('resultSeconds').value);
  const res = await fetch('/api/settings/result-display-seconds', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultDisplaySeconds }),
  });
  const json = await res.json();
  showToast(json.success ? 'تم حفظ المدة' : json.message, !json.success);
});

// ---------------- Change password ----------------
document.getElementById('changePasswordBtn').addEventListener('click', async () => {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  showToast(json.success ? 'تم تغيير كلمة المرور' : json.message, !json.success);
  if (json.success) {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
  }
});

// ---------------- Reset statistics ----------------
document.getElementById('resetStatsBtn').addEventListener('click', async () => {
  if (!confirm('هل أنت متأكد من إعادة ضبط جميع الإحصاءات؟ لا يمكن التراجع عن هذا الإجراء.')) return;

  const res = await fetch('/api/settings/reset-statistics', { method: 'POST' });
  const json = await res.json();
  showToast(json.success ? 'تمت إعادة ضبط جميع الإحصاءات' : json.message, !json.success);
});

// ---------------- Restore backup ----------------
document.getElementById('restoreInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('استعادة نسخة احتياطية ستستبدل جميع البيانات الحالية. هل تريد المتابعة؟')) {
    e.target.value = '';
    return;
  }

  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/settings/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
  const json = await res.json();
  showToast(json.success ? 'تمت الاستعادة بنجاح' : json.message, !json.success);
  e.target.value = '';
});

// ===================================================================
// Question management
// ===================================================================
const questionsList = document.getElementById('questionsList');

async function loadQuestions() {
  const res = await fetch('/api/questions');
  const json = await res.json();
  renderQuestions(json.data);
}

function renderQuestions(questions) {
  questionsList.innerHTML = '';
  questions.forEach((q, index) => {
    const li = document.createElement('li');
    li.className = `question-item${q.enabled ? '' : ' disabled'}`;
    li.dataset.id = q.id;
    li.innerHTML = `
      <div class="q-actions">
        <button type="button" class="move-up" title="تحريك لأعلى" ${index === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="move-down" title="تحريك لأسفل" ${index === questions.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
      <span class="q-text" contenteditable="true">${q.question}</span>
      <div class="q-actions">
        <button type="button" class="toggle-btn" title="تفعيل/تعطيل">${q.enabled ? '🔓' : '🔒'}</button>
        <button type="button" class="save-btn" title="حفظ التعديل">💾</button>
        <button type="button" class="delete-btn" title="حذف">🗑️</button>
      </div>
    `;
    questionsList.appendChild(li);
  });
}

document.getElementById('addQuestionBtn').addEventListener('click', async () => {
  const input = document.getElementById('newQuestionText');
  const question = input.value.trim();
  if (!question) return;

  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const json = await res.json();
  if (json.success) {
    input.value = '';
    loadQuestions();
  } else {
    showToast(json.message, true);
  }
});

questionsList.addEventListener('click', async (e) => {
  const li = e.target.closest('.question-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('save-btn')) {
    const newText = li.querySelector('.q-text').textContent.trim();
    const res = await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newText }),
    });
    const json = await res.json();
    showToast(json.success ? 'تم حفظ التعديل' : json.message, !json.success);
  }

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('حذف هذا السؤال نهائياً؟')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    loadQuestions();
  }

  if (e.target.classList.contains('toggle-btn')) {
    await fetch(`/api/questions/${id}/toggle`, { method: 'PATCH' });
    loadQuestions();
  }

  if (e.target.classList.contains('move-up') || e.target.classList.contains('move-down')) {
    const items = Array.from(questionsList.querySelectorAll('.question-item'));
    const ids = items.map((item) => item.dataset.id);
    const index = ids.indexOf(id);
    const swapWith = e.target.classList.contains('move-up') ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;

    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    await fetch('/api/questions/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids }),
    });
    loadQuestions();
  }
});

loadSettings();
loadQuestions();

// ===================================================================
// Rating scale management
// ===================================================================
const levelsList = document.getElementById('levelsList');

async function loadLevels() {
  const res = await fetch('/api/rating-levels');
  const json = await res.json();
  renderLevels(json.data);
}

function renderLevels(levels) {
  levelsList.innerHTML = '';
  levels.forEach((level, index) => {
    const li = document.createElement('li');
    li.className = 'level-item';
    li.dataset.id = level.id;
    li.innerHTML = `
      <div class="q-actions">
        <button type="button" class="move-up" title="تحريك لأعلى" ${index === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="move-down" title="تحريك لأسفل" ${index === levels.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
      <span class="level-swatch" style="background:${level.color}"></span>
      <span class="level-emoji">${level.emoji}</span>
      <span class="level-label" contenteditable="true">${level.label}</span>
      <span class="level-value" contenteditable="true">${level.value}</span>
      <div class="q-actions">
        <button type="button" class="save-btn" title="حفظ التعديل">💾</button>
        <button type="button" class="delete-btn" title="حذف">🗑️</button>
      </div>
    `;
    levelsList.appendChild(li);
  });
}

document.getElementById('addLevelBtn').addEventListener('click', async () => {
  const label = document.getElementById('newLevelLabel').value.trim();
  const value = Number(document.getElementById('newLevelValue').value);
  const color = document.getElementById('newLevelColor').value;
  const emoji = document.getElementById('newLevelEmoji').value.trim() || '🔵';

  if (!label || !Number.isFinite(value)) {
    showToast('الرجاء تعبئة النص والقيمة الرقمية', true);
    return;
  }

  const res = await fetch('/api/rating-levels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, value, color, emoji }),
  });
  const json = await res.json();
  if (json.success) {
    document.getElementById('newLevelLabel').value = '';
    document.getElementById('newLevelValue').value = '';
    document.getElementById('newLevelEmoji').value = '';
    loadLevels();
  } else {
    showToast(json.message, true);
  }
});

levelsList.addEventListener('click', async (e) => {
  const li = e.target.closest('.level-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('save-btn')) {
    const label = li.querySelector('.level-label').textContent.trim();
    const value = Number(li.querySelector('.level-value').textContent.trim());
    const color = li.querySelector('.level-swatch').style.backgroundColor;
    const emoji = li.querySelector('.level-emoji').textContent.trim();

    const res = await fetch(`/api/rating-levels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, value, color, emoji }),
    });
    const json = await res.json();
    showToast(json.success ? 'تم حفظ التعديل' : json.message, !json.success);
    if (json.success) loadLevels();
  }

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('حذف هذا المستوى نهائياً؟')) return;
    const res = await fetch(`/api/rating-levels/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) showToast(json.message, true);
    loadLevels();
  }

  if (e.target.classList.contains('move-up') || e.target.classList.contains('move-down')) {
    const items = Array.from(levelsList.querySelectorAll('.level-item'));
    const ids = items.map((item) => item.dataset.id);
    const index = ids.indexOf(id);
    const swapWith = e.target.classList.contains('move-up') ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;

    [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];

    await fetch('/api/rating-levels/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids }),
    });
    loadLevels();
  }
});

loadLevels();
