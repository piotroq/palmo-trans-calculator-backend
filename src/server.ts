import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import submissionsRouter from './routes/submissions';
import geocodeRouter from './routes/geocode';
import paymentRouter from './routes/payments';
import calculateV2Router from './routes/calculateV2';
import bookingV2Router from './routes/bookingV2';
import bookingsAdminRouter from './routes/bookingsAdmin';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.disable('x-powered-by');
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Routes
app.use('/api/submissions', submissionsRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/payments', paymentRouter);
// IMPORTANT: bookingsAdmin must be BEFORE bookingV2
// because /bookings and /bookings/stats must match before /booking/:number
app.use('/api/v2', bookingsAdminRouter);
app.use('/api/v2', bookingV2Router);
app.use('/api/v2', calculateV2Router);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler (musi być ostatnim middleware)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.SMTP_USER}`);
  console.log(`💳 PayPal Mode: ${process.env.PAYPAL_MODE}`);
});
