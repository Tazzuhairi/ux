/**
 * Protects JSON API routes: replies 401 if there is no logged-in
 * admin session, instead of redirecting (the frontend JS decides what
 * to do, e.g. redirect to the login screen itself).
 */
export function requireAuthApi(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', message: 'يجب تسجيل الدخول أولاً' });
}

/**
 * Protects the admin-only HTML pages themselves (dashboard, report,
 * settings): redirects to the login screen if there is no session,
 * so opening the URL directly without logging in doesn't work.
 */
export function requireAuthPage(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login.html');
}
