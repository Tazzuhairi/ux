import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import surveyRoutes from './routes/survey.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import questionsRoutes from './routes/questions.js';
import ratingLevelsRoutes from './routes/ratingLevels.js';
import pageRoutes from './routes/pages.js';

import { initDatabase } from './database/db.js';
import { initSchemaAndSeed } from './database/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, 'public');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); // 10mb to allow base64 logo uploads
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'lss-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Page routes (auth-guarded HTML) must come BEFORE static serving so
// they can intercept dashboard.html / report.html / settings.html.
app.use('/', pageRoutes);
app.use(express.static(publicDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/rating-levels', ratingLevelsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Route not found: ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.userMessage || 'حدث خطأ غير متوقع في الخادم',
  });
});

async function start() {
  await initDatabase();
  await initSchemaAndSeed();

  app.listen(PORT, () => {
    console.log(`Library Satisfaction System running on port ${PORT}`);
    console.log(`Open your browser at: http://localhost:${PORT}`);
    console.log('Default admin login: admin / admin@2026');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
