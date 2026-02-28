import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import submissionsRouter from './routes/submissions';
import geocodeRouter from './routes/geocode';
import paymentRouter from './routes/payments';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: '.env.local' });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/submissions', submissionsRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/payments', paymentRouter);

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
