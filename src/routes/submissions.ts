import express from 'express';
import { SubmissionsController } from '../controllers/submissionsController';

const router = express.Router();

router.post('/', SubmissionsController.create);
router.get('/:referenceNumber', SubmissionsController.getByReference);
router.get('/email/:email', SubmissionsController.getByEmail);
router.patch('/:id/status', SubmissionsController.updateStatus);

export default router;
