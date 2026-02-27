import { Request, Response, NextFunction } from 'express';
import {
  createPayPalOrder,
  capturePayPalOrder,
} from '../services/paypalService';
import { ApiError } from '../middleware/errorHandler';

// Mock submissions (później z bazy)
const payments = new Map();

export class PaymentsController {
  static async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { submissionId, amount, returnUrl, cancelUrl } = req.body;

      if (!submissionId || !amount) {
        throw new ApiError(400, 'Brak wymaganych parametrów');
      }

      const paypalOrder = await createPayPalOrder(
        submissionId,
        amount,
        returnUrl || 'http://localhost:5173/payment-success',
        cancelUrl || 'http://localhost:5173/payment-cancel'
      );

      payments.set(paypalOrder.id, { submissionId, amount });

      res.json({
        success: true,
        orderId: paypalOrder.id,
        links: paypalOrder.links,
      });
    } catch (error) {
      next(error);
    }
  }

  static async capturePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        throw new ApiError(400, 'Brak orderId');
      }

      const captureResult = await capturePayPalOrder(orderId);

      if (captureResult.status !== 'COMPLETED') {
        throw new ApiError(400, 'Płatność nie została potwierdzona');
      }

      res.json({
        success: true,
        message: 'Płatność potwierdzona',
      });
    } catch (error) {
      next(error);
    }
  }
}
