/**
 * BookingService — Tworzenie i zarządzanie zamówieniami
 *
 * - Generowanie booking_number: PT-YYYY-NNNNN
 * - Zapis do PostgreSQL
 * - Walidacja Zod
 * - Obliczanie finałowej ceny
 */

import { z } from 'zod';
import { Pool } from 'pg';
import { calculatePrice, isPricingError } from './pricingEngine';

// ─── Walidacja Zod ───────────────────────────────────────────

const PackageSchema = z.object({
  categoryId: z.string(),
  description: z.string().optional().default(''),
  quantity: z.number().int().min(1),
  stackable: z.boolean().default(false),
  weight: z.number().positive(),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
});

const AddressSchema = z.object({
  company: z.string().optional().default(''),
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  street: z.string().min(1, 'Straße ist erforderlich'),
  addressExtra: z.string().optional().default(''),
  country: z.string().min(2).max(3),
  postalCode: z.string().min(1, 'PLZ ist erforderlich'),
  city: z.string().optional().default(''),
  phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

const ScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeWindowId: z.string(),
  timeSlot: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
});

const InvoiceSchema = z.object({
  email: z.string().email('Gültige E-Mail erforderlich'),
  company: z.string().optional().default(''),
  salutation: z.string().optional().default(''),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  street: z.string().min(1),
  addressExtra: z.string().optional().default(''),
  country: z.string().min(2).max(3),
  postalCode: z.string().min(1),
  city: z.string().optional().default(''),
  phone: z.string().min(1),
  reference: z.string().optional().default(''),
  vatId: z.string().optional().default(''),
  billingEmail: z.string().optional().default(''),
});

export const BookingInputSchema = z.object({
  // Step 1
  vehicleId: z.string(),
  vehicleCategory: z.enum(['express', 'lkw']),
  distanceKm: z.number().positive(),
  serviceIds: z.array(z.string()).default([]),

  // Step 2
  packages: z.array(PackageSchema).min(1),
  additionalInfo: z.string().optional().default(''),

  // Steps 3-4
  pickup: z.object({
    address: AddressSchema,
    schedule: ScheduleSchema,
    coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  delivery: z.object({
    address: AddressSchema,
    schedule: ScheduleSchema,
    coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),

  // Step 5
  invoice: InvoiceSchema,

  // Step 6
  paymentMethod: z.enum(['rechnung', 'przelewy24', 'paypal', 'kreditkarte']),
});

export type BookingInput = z.infer<typeof BookingInputSchema>;

// ─── Booking Service ─────────────────────────────────────────

export interface BookingResult {
  bookingId: string;
  bookingNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export async function createBooking(
  pool: Pool,
  input: BookingInput
): Promise<BookingResult> {
  // 1. Walidacja
  const parsed = BookingInputSchema.parse(input);

  // 2. Oblicz finalną cenę
  const isReverseCharge = !!(parsed.invoice.vatId && parsed.invoice.country !== 'DE');
  const pricing = calculatePrice({
    vehicleId: parsed.vehicleId,
    distanceKm: parsed.distanceKm,
    serviceIds: parsed.serviceIds,
    pickupTimeWindowId: parsed.pickup.schedule.timeWindowId,
    deliveryTimeWindowId: parsed.delivery.schedule.timeWindowId,
    isReverseCharge,
  });

  if (isPricingError(pricing)) {
    throw new Error(`Pricing error: ${pricing.message}`);
  }

  // Dodaj opłatę PayPal
  let transactionFee = 0;
  if (parsed.paymentMethod === 'paypal') transactionFee = 15.99;

  const finalTotal = pricing.total + transactionFee;

  // 3. Generuj booking number
  const bookingNumber = await generateBookingNumber(pool);

  // 4. Insert do bazy
  const query = `
    INSERT INTO bookings (
      booking_number, status,
      vehicle_id, vehicle_category, distance_km,
      vehicle_base_price, distance_charge, services_total,
      time_window_surcharge, vat_rate, vat_amount, subtotal,
      transaction_fee, total,
      packages, additional_info, service_ids,
      pickup_company, pickup_first_name, pickup_last_name,
      pickup_street, pickup_address_extra, pickup_country,
      pickup_postal_code, pickup_city, pickup_phone,
      pickup_reference, pickup_notes,
      pickup_date, pickup_time_window, pickup_time_slot,
      pickup_lat, pickup_lng,
      delivery_company, delivery_first_name, delivery_last_name,
      delivery_street, delivery_address_extra, delivery_country,
      delivery_postal_code, delivery_city, delivery_phone,
      delivery_reference, delivery_notes,
      delivery_date, delivery_time_window, delivery_time_slot,
      delivery_lat, delivery_lng,
      invoice_email, invoice_company, invoice_salutation,
      invoice_first_name, invoice_last_name,
      invoice_street, invoice_address_extra, invoice_country,
      invoice_postal_code, invoice_city, invoice_phone,
      invoice_reference, invoice_vat_id, invoice_billing_email,
      payment_method, payment_status
    ) VALUES (
      $1, 'pending',
      $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13,
      $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
      $28, $29, $30, $31, $32,
      $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
      $45, $46, $47, $48, $49,
      $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62,
      $63, 'pending'
    )
    RETURNING id, booking_number, total, payment_method, status, created_at
  `;

  const p = parsed.pickup;
  const d = parsed.delivery;
  const inv = parsed.invoice;

  // 64 columns total, 2 static ('pending' for status and payment_status), 62 params ($1-$63)
  const cleanValues = [
    bookingNumber,                                              // $1
    parsed.vehicleId, parsed.vehicleCategory, parsed.distanceKm, // $2-$4
    pricing.vehicleBasePrice, pricing.distanceCharge, pricing.servicesTotal, // $5-$7
    pricing.pickupTimeWindowSurcharge + pricing.deliveryTimeWindowSurcharge, // $8
    pricing.vatRate, pricing.vatAmount, pricing.subtotal,       // $9-$11
    transactionFee, finalTotal,                                 // $12-$13
    JSON.stringify(parsed.packages), parsed.additionalInfo,     // $14-$15
    parsed.serviceIds.length > 0 ? `{${parsed.serviceIds.join(',')}}` : '{}', // $16 - TEXT[] format for PostgreSQL
    // Pickup address
    p.address.company, p.address.firstName, p.address.lastName, // $17-$19
    p.address.street, p.address.addressExtra, p.address.country, // $20-$22
    p.address.postalCode, p.address.city, p.address.phone,      // $23-$25
    p.address.reference, p.address.notes,                       // $26-$27
    // Pickup schedule
    p.schedule.date, p.schedule.timeWindowId,                   // $28-$29
    p.schedule.timeSlot ? `${p.schedule.timeSlot.from}-${p.schedule.timeSlot.to}` : null, // $30
    p.coords?.lat ?? null, p.coords?.lng ?? null,               // $31-$32
    // Delivery address
    d.address.company, d.address.firstName, d.address.lastName, // $33-$35
    d.address.street, d.address.addressExtra, d.address.country, // $36-$38
    d.address.postalCode, d.address.city, d.address.phone,      // $39-$41
    d.address.reference, d.address.notes,                       // $42-$43
    // Delivery schedule
    d.schedule.date, d.schedule.timeWindowId,                   // $44-$45
    d.schedule.timeSlot ? `${d.schedule.timeSlot.from}-${d.schedule.timeSlot.to}` : null, // $46
    d.coords?.lat ?? null, d.coords?.lng ?? null,               // $47-$48
    // Invoice
    inv.email, inv.company, inv.salutation,                     // $49-$51
    inv.firstName, inv.lastName,                                // $52-$53
    inv.street, inv.addressExtra, inv.country,                  // $54-$56
    inv.postalCode, inv.city, inv.phone,                        // $57-$59
    inv.reference, inv.vatId, inv.billingEmail,                 // $60-$62
    // Payment
    parsed.paymentMethod,                                       // $63
  ];

  const result = await pool.query(query, cleanValues);
  const row = result.rows[0];

  return {
    bookingId: row.id,
    bookingNumber: row.booking_number,
    total: parseFloat(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ─── Booking Number Generator ────────────────────────────────

async function generateBookingNumber(pool: Pool): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PT-${year}-`;

  const result = await pool.query(
    `SELECT booking_number FROM bookings
     WHERE booking_number LIKE $1
     ORDER BY booking_number DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let seq = 1;
  if (result.rows.length > 0) {
    const last = result.rows[0].booking_number;
    const num = parseInt(last.replace(prefix, ''), 10);
    if (!isNaN(num)) seq = num + 1;
  }

  return `${prefix}${seq.toString().padStart(5, '0')}`;
}
