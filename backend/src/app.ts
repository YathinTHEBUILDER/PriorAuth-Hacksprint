import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/api.js';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local hackathon demo
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Root and Health check endpoints
app.get(['/', '/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Prior Authorization Assistant Backend API',
    version: '1.0.0-hackathon',
    aiMode: process.env.AI_API_KEY ? 'Live External LLM' : 'Deterministic Clinical NLP Engine (Demo Mode)',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Centralized 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint '${req.originalUrl}' not found.` });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
});

export default app;
