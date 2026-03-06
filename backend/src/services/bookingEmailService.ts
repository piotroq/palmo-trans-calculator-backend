/**
 * BookingEmailService — Wysyłka emaili po zamówieniu
 *
 * 1. Potwierdzenie do klienta (Buchungsbestätigung)
 * 2. Notyfikacja do admina (Neue Buchung)
 *
 * Używa nodemailer — konfiguracja SMTP w .env
 */

import nodemailer from 'nodemailer';
import type { BookingResult } from './bookingService';

// ─── SMTP Transporter ────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || 'buchung@palmo-trans.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kontakt@palmo-trans.com';

// ─── Types ───────────────────────────────────────────────────

interface BookingEmailData {
  booking: BookingResult;
  customerEmail: string;
  customerName: string;
  pickupCity: string;
  deliveryCity: string;
  vehicleName: string;
  pickupDate: string;
  paymentLabel: string;
}

// ─── Send Booking Confirmation to Customer ───────────────────

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const { booking, customerEmail, customerName, pickupCity, deliveryCity, vehicleName, pickupDate, paymentLabel } = data;

  const fmtPrice = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const htmlBody = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <!-- Header -->
    <div style="background:#1A1A1A;padding:30px 40px;text-align:center;">
      <h1 style="color:#FFD700;margin:0;font-size:24px;letter-spacing:2px;">PALMO-TRANS</h1>
      <p style="color:#999;margin:8px 0 0;font-size:12px;">Express & Sondertransporte</p>
    </div>

    <!-- Content -->
    <div style="padding:40px;">
      <h2 style="color:#1A1A1A;margin:0 0 8px;">Buchungsbestätigung</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px;">
        Vielen Dank für Ihre Buchung, ${customerName}!
      </p>

      <!-- Booking Number -->
      <div style="background:#f9f9f9;border:2px solid #FFD700;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="color:#999;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Buchungsnummer</p>
        <p style="color:#1A1A1A;margin:0;font-size:28px;font-weight:bold;font-family:monospace;letter-spacing:2px;">
          ${booking.bookingNumber}
        </p>
      </div>

      <!-- Details -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee;">Route</td>
          <td style="padding:8px 0;color:#1A1A1A;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">
            ${pickupCity} → ${deliveryCity}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee;">Fahrzeug</td>
          <td style="padding:8px 0;color:#1A1A1A;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">
            ${vehicleName}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee;">Abholdatum</td>
          <td style="padding:8px 0;color:#1A1A1A;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">
            ${pickupDate}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #eee;">Zahlmethode</td>
          <td style="padding:8px 0;color:#1A1A1A;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">
            ${paymentLabel}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#999;font-size:13px;">Gesamtsumme</td>
          <td style="padding:12px 0;color:#FFD700;font-size:22px;font-weight:bold;text-align:right;">
            ${fmtPrice(booking.total)} zł
          </td>
        </tr>
      </table>

      <!-- Status -->
      <div style="background:#FFF8E1;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#666;">
          📋 <strong>Status:</strong> Ihre Buchung wird bearbeitet. Sie erhalten eine weitere E-Mail, sobald der Transport bestätigt ist.
        </p>
      </div>

      <!-- CTA -->
      <p style="color:#999;font-size:12px;margin:0 0 24px;">
        Bitte bewahren Sie Ihre Buchungsnummer <strong>${booking.bookingNumber}</strong> für Rückfragen auf.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1A1A1A;padding:24px 40px;text-align:center;">
      <p style="color:#999;margin:0 0 4px;font-size:11px;">PALMO-TRANS GmbH | Express & Sondertransporte</p>
      <p style="color:#666;margin:0;font-size:11px;">
        <a href="mailto:kontakt@palmo-trans.com" style="color:#FFD700;text-decoration:none;">kontakt@palmo-trans.com</a>
        &nbsp;|&nbsp;
        <a href="https://palmo-trans.com" style="color:#FFD700;text-decoration:none;">palmo-trans.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    await transporter.sendMail({
      from: `"PALMO-TRANS" <${FROM_EMAIL}>`,
      to: customerEmail,
      subject: `Buchungsbestätigung ${booking.bookingNumber} — PALMO-TRANS`,
      html: htmlBody,
    });
    console.log(`✅ Confirmation email sent to ${customerEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send confirmation to ${customerEmail}:`, err);
  }
}

// ─── Send Admin Notification ─────────────────────────────────

export async function sendAdminNotification(data: BookingEmailData): Promise<void> {
  const { booking, customerEmail, customerName, pickupCity, deliveryCity, vehicleName, paymentLabel } = data;

  const fmtPrice = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const textBody = `
NEUE BUCHUNG — ${booking.bookingNumber}
${'='.repeat(50)}

Kunde: ${customerName} (${customerEmail})
Route: ${pickupCity} → ${deliveryCity}
Fahrzeug: ${vehicleName}
Zahlmethode: ${paymentLabel}
Gesamtsumme: ${fmtPrice(booking.total)} zł

Status: ${booking.status}
Erstellt: ${new Date(booking.createdAt).toLocaleString('de-DE')}

---
PALMO-TRANS Buchungssystem
  `.trim();

  try {
    await transporter.sendMail({
      from: `"PALMO-TRANS System" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🆕 Neue Buchung ${booking.bookingNumber} — ${fmtPrice(booking.total)} zł`,
      text: textBody,
    });
    console.log(`✅ Admin notification sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error(`❌ Failed to send admin notification:`, err);
  }
}
