/**
 * PALMO-TRANS Calculator v2 — Calculate Route
 *
 * POST /api/v2/calculate      — pełna kalkulacja
 * POST /api/v2/quick-quote    — szybka wycena (krok 1)
 * GET  /api/v2/vehicles       — lista pojazdów
 * GET  /api/v2/services       — lista usług dodatkowych
 * GET  /api/v2/timeslots      — dostępne okna czasowe
 */

import express, { Request, Response } from 'express';
import {
  calculatePrice,
  calculateQuickQuote,
  isPricingError,
  type PriceCalculationRequest,
  type QuickQuoteRequest,
} from '../services/pricingEngine';
import { allVehicles, getVehiclesByCategory } from '../config/vehicles';
import {
  additionalServices,
  getServicesForCategory,
  timeWindows,
  shipmentCategories,
  paymentMethods,
} from '../config/services';

const router = express.Router();

// ─── POST /api/v2/calculate ───────────────────────────────────

router.post('/calculate', (req: Request, res: Response) => {
  try {
    const {
      vehicleId,
      distanceKm,
      serviceIds = [],
      pickupTimeWindowId = 'TW-6H',
      deliveryTimeWindowId = 'TW-6H',
      isReverseCharge = false,
    } = req.body as Partial<PriceCalculationRequest>;

    // Podstawowa walidacja inputu
    if (!vehicleId || typeof vehicleId !== 'string') {
      return res.status(400).json({ error: 'vehicleId is required' });
    }
    if (!distanceKm || typeof distanceKm !== 'number' || distanceKm <= 0) {
      return res.status(400).json({ error: 'distanceKm must be a positive number' });
    }

    const result = calculatePrice({
      vehicleId,
      distanceKm,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
      pickupTimeWindowId: pickupTimeWindowId || 'TW-6H',
      deliveryTimeWindowId: deliveryTimeWindowId || 'TW-6H',
      isReverseCharge: Boolean(isReverseCharge),
    });

    if (isPricingError(result)) {
      return res.status(400).json({ error: result.message, code: result.code, field: result.field });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Calculate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/v2/quick-quote ─────────────────────────────────

router.post('/quick-quote', (req: Request, res: Response) => {
  try {
    const { vehicleId, distanceKm, serviceIds } = req.body as Partial<QuickQuoteRequest>;

    if (!vehicleId || !distanceKm) {
      return res.status(400).json({ error: 'vehicleId and distanceKm are required' });
    }

    const result = calculateQuickQuote({
      vehicleId,
      distanceKm,
      serviceIds,
    });

    if ('code' in result) {
      return res.status(400).json({ error: result.message, code: result.code });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Quick quote error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v2/vehicles ─────────────────────────────────────

router.get('/vehicles', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;

  if (category && (category === 'express' || category === 'lkw')) {
    return res.json({ success: true, data: getVehiclesByCategory(category) });
  }

  return res.json({
    success: true,
    data: {
      express: getVehiclesByCategory('express'),
      lkw: getVehiclesByCategory('lkw'),
    },
  });
});

// ─── GET /api/v2/services ─────────────────────────────────────

router.get('/services', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;

  if (category && (category === 'express' || category === 'lkw')) {
    return res.json({ success: true, data: getServicesForCategory(category) });
  }

  return res.json({ success: true, data: additionalServices });
});

// ─── GET /api/v2/time-windows ─────────────────────────────────

router.get('/time-windows', (_req: Request, res: Response) => {
  return res.json({ success: true, data: timeWindows });
});

// ─── GET /api/v2/shipment-categories ──────────────────────────

router.get('/shipment-categories', (_req: Request, res: Response) => {
  return res.json({ success: true, data: shipmentCategories });
});

// ─── GET /api/v2/payment-methods ──────────────────────────────

router.get('/payment-methods', (_req: Request, res: Response) => {
  const enabled = paymentMethods.filter((pm) => pm.enabled);
  return res.json({ success: true, data: enabled });
});

// ─── GET /api/v2/timeslots/:date ──────────────────────────────

router.get('/timeslots/:date', (req: Request, res: Response) => {
  try {
    const dateStr = String(req.params.date); // YYYY-MM-DD
    const category = (req.query.category as string) || 'express';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Generuj dostępne sloty (uproszczona logika)
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const startHour = isToday ? Math.max(now.getHours() + 2, 8) : 8;

    const slots: Array<{ from: string; to: string; available: boolean }> = [];

    if (category === 'express') {
      // Express: 6h/3h/fix sloty
      for (let h = startHour; h <= 16; h++) {
        const sixHEnd = Math.min(h + 6, 20);
        const threeHEnd = Math.min(h + 3, 20);
        slots.push(
          { from: `${h.toString().padStart(2, '0')}:00`, to: `${sixHEnd.toString().padStart(2, '0')}:00`, available: true },
        );
      }
    } else {
      // LKW: cały dzień dostępny
      slots.push(
        { from: '08:00', to: '14:00', available: true },
        { from: '09:00', to: '15:00', available: true },
        { from: '10:00', to: '16:00', available: true },
      );
    }

    return res.json({
      success: true,
      data: {
        date: dateStr,
        category,
        slots,
        minDate: new Date().toISOString().split('T')[0],
        maxDate: getMaxBookingDate(),
      },
    });
  } catch (error) {
    console.error('❌ Timeslots error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function getMaxBookingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30); // max 30 dni do przodu
  return d.toISOString().split('T')[0];
}

export default router;
