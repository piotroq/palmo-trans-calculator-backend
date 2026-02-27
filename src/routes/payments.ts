import express from 'express';
import { PaymentsController } from '../controllers/paymentsController';

const router = express.Router();

router.post('/create-order', PaymentsController.createOrder);
router.post('/capture', PaymentsController.capturePayment);

export default router;
