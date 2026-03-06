/**
 * Booking Route — POST /api/v2/booking
 *
 * Tworzy zamówienie, zwraca booking_number.
 * Wymaga aktywnego PostgreSQL (docker-compose.postgres.yml).
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { ZodError } from 'zod';
import { createBooking, BookingInputSchema } from '../services/bookingService';
import { sendBookingConfirmation, sendAdminNotification } from '../services/bookingEmailService';

const router = Router();

// ─── PostgreSQL Pool ─────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://palmo:palmo123@localhost:5432/palmotrans',
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

// ─── POST /booking — Utwórz zamówienie ──────────────────────

router.post('/booking', async (req: Request, res: Response) => {
  try {
    const result = await createBooking(pool, req.body);

    // Fire-and-forget email (nie blokuje response)
    const emailData = {
      booking: result,
      customerEmail: req.body.invoice.email,
      customerName: `${req.body.invoice.firstName} ${req.body.invoice.lastName}`,
      pickupCity: req.body.pickup.address.city || req.body.pickup.address.postalCode,
      deliveryCity: req.body.delivery.address.city || req.body.delivery.address.postalCode,
      vehicleName: req.body.vehicleId,
      pickupDate: req.body.pickup.schedule.date,
      paymentLabel: req.body.paymentMethod,
    };
    sendBookingConfirmation(emailData).catch(console.error);
    sendAdminNotification(emailData).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        bookingId: result.bookingId,
        bookingNumber: result.bookingNumber,
        total: result.total,
        paymentMethod: result.paymentMethod,
        status: result.status,
        createdAt: result.createdAt,
        message: `Buchung ${result.bookingNumber} erfolgreich erstellt!`,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      const flattened = err.flatten();
      return void res.status(400).json({
        success: false,
        error: 'Validierungsfehler',
        details: flattened.fieldErrors
          ? Object.entries(flattened.fieldErrors).map(([field, messages]) => ({
              field,
              message: (messages as string[])?.join(', ') || 'Unknown error',
            }))
          : [],
      });
    }

    console.error('Booking creation failed:', err);

    // Sprawdź czy to błąd PostgreSQL (brak połączenia)
    if ((err as any)?.code === 'ECONNREFUSED') {
      return void res.status(503).json({
        success: false,
        error: 'Datenbank nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    return void res.status(500).json({
      success: false,
      error: 'Buchung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.',
    });
  }
});

// ─── GET /booking/:number — Pobranie zamówienia ─────────────

router.get('/booking/:number', async (req: Request, res: Response) => {
  try {
    const bookingNumber = String(req.params.number);
    const result = await pool.query(
      'SELECT * FROM bookings WHERE booking_number = $1',
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return void res.status(404).json({
        success: false,
        error: 'Buchung nicht gefunden',
      });
    }

    const row = result.rows[0];
    return void res.json({
      success: true,
      data: {
        bookingNumber: row.booking_number,
        status: row.status,
        total: parseFloat(row.total),
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        vehicleId: row.vehicle_id,
        vehicleCategory: row.vehicle_category,
        distanceKm: parseFloat(row.distance_km),
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error('Booking fetch failed:', err);
    return void res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Buchung',
    });
  }
});

export default router;
