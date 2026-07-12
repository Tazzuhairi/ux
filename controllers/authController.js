import bcrypt from 'bcrypt';
import { findByUsername, updatePassword } from '../models/userModel.js';

/**
 * Handles admin login: verifies username/password with bcrypt and
 * starts a session on success.
 */
export async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'BadRequest', message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  const user = findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'InvalidCredentials', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'InvalidCredentials', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ success: true });
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true });
  });
}

export function currentUser(req, res) {
  if (req.session && req.session.userId) {
    return res.json({ success: true, data: { username: req.session.username } });
  }
  res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Changes the admin password: requires the current password to match
 * before accepting the new one.
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'BadRequest', message: 'الرجاء تعبئة جميع الحقول' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'BadRequest', message: 'كلمة المرور الجديدة قصيرة جداً (6 أحرف على الأقل)' });
  }

  const user = findByUsername(req.session.username);
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    return res.status(401).json({ error: 'InvalidCredentials', message: 'كلمة المرور الحالية غير صحيحة' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  updatePassword(user.id, newHash);
  res.json({ success: true });
}
