/**
 * Bookings Admin Routes — GET /api/v2/bookings + /bookings/stats
 *
 * Endpointy potrzebne przez WordPress plugin do listowania
 * i wyświetlania statystyk zamówień.
 *
 * DODAJ do server.ts:
 *   import bookingsAdminRoutes from './routes/bookingsAdmin';
 *   app.use('/api/v2', bookingsAdminRoutes);
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://palmo:palmo123@localhost:5432/palmotrans',
});

// ─── GET /bookings — Lista zamówień z paginacją i filtrami ───

router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const page     = Math.max(1, parseInt(String(req.query.page)) || 1);
    const per_page = Math.min(100, Math.max(1, parseInt(String(req.query.per_page)) || 20));
    const status   = String(req.query.status || '').trim();
    const search   = String(req.query.search || '').trim();
    const offset   = (page - 1) * per_page;

    // Build WHERE
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    if (search) {
      conditions.push(`(
        booking_number ILIKE $${paramIdx}
        OR pickup_city ILIKE $${paramIdx}
        OR delivery_city ILIKE $${paramIdx}
        OR invoice_email ILIKE $${paramIdx}
        OR invoice_company ILIKE $${paramIdx}
        OR pickup_first_name ILIKE $${paramIdx}
        OR delivery_first_name ILIKE $${paramIdx}
      )`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM bookings ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch rows
    const dataParams = [...params, per_page, offset];
    const dataResult = await pool.query(
      `SELECT
        booking_number, status, vehicle_id, vehicle_category,
        distance_km, total, payment_method, payment_status,
        pickup_company, pickup_first_name, pickup_last_name,
        pickup_street, pickup_country, pickup_postal_code, pickup_city, pickup_phone,
        delivery_company, delivery_first_name, delivery_last_name,
        delivery_street, delivery_country, delivery_postal_code, delivery_city, delivery_phone,
        created_at
      FROM bookings
      ${where}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    const bookings = dataResult.rows.map((r) => ({
      ...r,
      total: parseFloat(r.total),
      distance_km: parseFloat(r.distance_km),
    }));

    return void res.json({
      success: true,
      data: {
        bookings,
        total,
        page,
        per_page,
      },
    });
  } catch (err) {
    console.error('Bookings list error:', err);
    return void res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Buchungen',
    });
  }
});

// ─── GET /bookings/stats — Statystyki zamówień ───────────────

router.get('/bookings/stats', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(total), 0) as revenue
      FROM bookings
    `);

    const row = result.rows[0];

    return void res.json({
      success: true,
      data: {
        total:      parseInt(row.total, 10),
        pending:    parseInt(row.pending, 10),
        confirmed:  parseInt(row.confirmed, 10),
        in_transit: parseInt(row.in_transit, 10),
        delivered:  parseInt(row.delivered, 10),
        cancelled:  parseInt(row.cancelled, 10),
        revenue:    parseFloat(row.revenue),
      },
    });
  } catch (err) {
    console.error('Bookings stats error:', err);
    return void res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Statistiken',
    });
  }
});

// ─── POST /booking/:number/status — Zmiana statusu ──────────

router.post('/booking/:number/status', async (req: Request, res: Response) => {
  try {
    const bookingNumber = String(req.params.number);
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return void res.status(400).json({
        success: false,
        error: `Ungültiger Status. Erlaubt: ${validStatuses.join(', ')}`,
      });
    }

    const result = await pool.query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_number = $2 RETURNING booking_number, status`,
      [status, bookingNumber]
    );

    if (result.rows.length === 0) {
      return void res.status(404).json({
        success: false,
        error: 'Buchung nicht gefunden',
      });
    }

    return void res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Status update error:', err);
    return void res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren des Status',
    });
  }
});

// ─── GET /booking/:number — Full booking detail (for WP detail view) ──

router.get('/booking/:number/full', async (req: Request, res: Response) => {
  try {
    const bookingNumber = String(req.params.number);
    const result = await pool.query(
      'SELECT * FROM bookings WHERE booking_number = $1',
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return void res.status(404).json({ success: false, error: 'Buchung nicht gefunden' });
    }

    const row = result.rows[0];
    // Parse numeric fields
    const numericFields = ['total', 'distance_km', 'vehicle_base_price', 'distance_charge',
      'services_total', 'time_window_surcharge', 'vat_rate', 'vat_amount', 'transaction_fee',
      'subtotal', 'pickup_lat', 'pickup_lng', 'delivery_lat', 'delivery_lng'];

    for (const f of numericFields) {
      if (row[f] !== null && row[f] !== undefined) {
        row[f] = parseFloat(row[f]);
      }
    }

    return void res.json({ success: true, data: row });
  } catch (err) {
    console.error('Booking full detail error:', err);
    return void res.status(500).json({ success: false, error: 'Fehler beim Laden der Buchung' });
  }
});

export default router;
