import express from 'express';
import { SubmissionsController } from '../controllers/submissionsController';

const router = express.Router();

// GET /api/submissions — lista wszystkich
router.get('/', SubmissionsController.getAll);

// POST /api/submissions — utwórz nowe
router.post('/', SubmissionsController.create);

// GET /api/submissions/:referenceNumber — pobierz po numerze ref
router.get('/:referenceNumber', SubmissionsController.getByReference);

// GET /api/submissions/email/:email — pobierz po emailu
router.get('/email/:email', SubmissionsController.getByEmail);

// PATCH /api/submissions/:id/status — zmień status
router.patch('/:id/status', SubmissionsController.updateStatus);

export default router;
