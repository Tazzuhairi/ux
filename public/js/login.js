// ===================================================================
// LSS - Login screen logic
// ===================================================================

const form = document.getElementById('loginForm');
const errorAlert = document.getElementById('errorAlert');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorAlert.classList.add('d-none');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      errorAlert.textContent = json.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      errorAlert.classList.remove('d-none');
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (err) {
    errorAlert.textContent = 'تعذر الاتصال بالخادم. الرجاء المحاولة مرة أخرى';
    errorAlert.classList.remove('d-none');
  }
});
