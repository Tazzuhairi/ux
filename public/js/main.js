// ===================================================================
// LSS - Start screen logic (public/index.html)
// ===================================================================

async function loadBranding() {
  try {
    const res = await fetch('/api/settings/public');
    const json = await res.json();
    if (json.success && json.data.libraryName) {
      document.getElementById('libraryNameLabel').textContent = json.data.libraryName;
    }
    if (json.success && json.data.libraryLogoPath) {
      const img = document.querySelector('.logo-img');
      img.src = json.data.libraryLogoPath;
      img.style.display = '';
    }
  } catch (err) {
    console.error('LSS: failed to load branding settings', err);
  }
}

document.getElementById('startBtn').addEventListener('click', () => {
  window.location.href = 'survey.html';
});

loadBranding();
