import express from 'express';
import { GeocodeController } from '../controllers/geocodeController';

const router = express.Router();

router.post('/', GeocodeController.geocode);

export default router;
