/**
 * Calculate V2 Routes
 *
 * POST /api/v2/quick-quote     — Szybka wycena (Step 1 frontend)
 * POST /api/v2/calculate       — Pełna kalkulacja z time windows
 * GET  /api/v2/vehicle-prices  — Ceny wszystkich pojazdów dla dystansu
 * GET  /api/v2/vehicles        — Lista pojazdów z konfiguracją
 * GET  /api/v2/services        — Lista usług dodatkowych
 * GET  /api/v2/time-windows    — Konfiguracja okien czasowych
 */

import { Router, Request, Response } from 'express';
import {
  quickQuote,
  calculatePrice,
  allVehiclePrices,
  isPricingError,
} from '../services/pricingEngine';
import { vehicles, additionalServices, timeWindows } from '../config/pricing';

const router = Router();

// ─── POST /quick-quote ───────────────────────────────────────

router.post('/quick-quote', (req: Request, res: Response) => {
  try {
    const { vehicleId, distanceKm, serviceIds } = req.body;

    if (!vehicleId || !distanceKm) {
      return void res.status(400).json({
        success: false,
        error: 'vehicleId und distanceKm sind erforderlich',
      });
    }

    const result = quickQuote({
      vehicleId,
      distanceKm: Number(distanceKm),
      serviceIds: serviceIds || [],
    });

    if (isPricingError(result)) {
      return void res.status(400).json({ success: false, error: result.message });
    }

    return void res.json({ success: true, data: result });
  } catch (err) {
    console.error('Quick quote error:', err);
    return void res.status(500).json({ success: false, error: 'Preisberechnung fehlgeschlagen' });
  }
});

// ─── POST /calculate ─────────────────────────────────────────

router.post('/calculate', (req: Request, res: Response) => {
  try {
    const {
      vehicleId, distanceKm, serviceIds,
      pickupTimeWindowId, deliveryTimeWindowId, isReverseCharge,
    } = req.body;

    if (!vehicleId || !distanceKm) {
      return void res.status(400).json({
        success: false,
        error: 'vehicleId und distanceKm sind erforderlich',
      });
    }

    const result = calculatePrice({
      vehicleId,
      distanceKm: Number(distanceKm),
      serviceIds: serviceIds || [],
      pickupTimeWindowId: pickupTimeWindowId || 'TW-6H',
      deliveryTimeWindowId: deliveryTimeWindowId || 'TW-6H',
      isReverseCharge: isReverseCharge || false,
    });

    if (isPricingError(result)) {
      return void res.status(400).json({ success: false, error: result.message });
    }

    return void res.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculate error:', err);
    return void res.status(500).json({ success: false, error: 'Preisberechnung fehlgeschlagen' });
  }
});

// ─── GET /vehicle-prices?distanceKm=48 ──────────────────────

router.get('/vehicle-prices', (req: Request, res: Response) => {
  try {
    const distanceKm = Number(req.query.distanceKm);

    if (!distanceKm || distanceKm <= 0) {
      return void res.status(400).json({
        success: false,
        error: 'distanceKm (> 0) ist erforderlich',
      });
    }

    return void res.json({ success: true, data: allVehiclePrices(distanceKm) });
  } catch (err) {
    console.error('Vehicle prices error:', err);
    return void res.status(500).json({ success: false, error: 'Fehler beim Laden der Fahrzeugpreise' });
  }
});

// ─── GET /vehicles ───────────────────────────────────────────

router.get('/vehicles', (_req: Request, res: Response) => {
  return void res.json({
    success: true,
    data: vehicles.map((v) => ({
      id: v.id,
      category: v.category,
      nameDE: v.nameDE,
      maxDimensions: v.maxDimensions,
      maxWeight: v.maxWeight,
      maxPallets: v.maxPallets || null,
      basePrice: v.basePrice,
      pricePerKm: v.pricePerKm,
      availableServices: v.availableServices,
      features: v.features,
    })),
  });
});

// ─── GET /services ───────────────────────────────────────────

router.get('/services', (_req: Request, res: Response) => {
  return void res.json({ success: true, data: additionalServices });
});

// ─── GET /time-windows ───────────────────────────────────────

router.get('/time-windows', (_req: Request, res: Response) => {
  return void res.json({ success: true, data: timeWindows });
});

export default router;
