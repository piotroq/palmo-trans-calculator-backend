import nodemailer from 'nodemailer';
import type { DeliverySubmission } from '../types';

// Lazy initialization - ensure dotenv is loaded before creating transporter
let transporter: ReturnType<typeof nodemailer.createTransport>;

function getTransporter() {
  if (!transporter) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const needsAuth = smtpUser && smtpPass;
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
      auth: needsAuth ? {
        user: smtpUser,
        pass: smtpPass,
      } : undefined,
    });
  }
  return transporter;
}

/**
 * Wyślij email do biura
 */
export async function sendEmailToOffice(submission: DeliverySubmission) {
  const subject = `[NOWE ZGŁOSZENIE] ${submission.referenceNumber}`;

  const html = `
    <h2>Nowe zgłoszenie dostawy</h2>
    <p><strong>Numer referencyjny:</strong> ${submission.referenceNumber}</p>

    <h3>Szczegóły przesyłki</h3>
    <ul>
      <li><strong>Pobranie:</strong> ${submission.pickupAddress}</li>
      <li><strong>Dostawa:</strong> ${submission.deliveryAddress}</li>
      <li><strong>Waga:</strong> ${submission.weight} kg</li>
      <li><strong>Typ:</strong> ${submission.serviceType.toUpperCase()}</li>
      <li><strong>Dystans:</strong> ${(submission.estimatedDistance / 1000).toFixed(1)} km</li>
      <li><strong>Cena:</strong> <strong>${submission.estimatedPrice} PLN</strong></li>
    </ul>

    <h3>Dane kontaktowe klienta</h3>
    <ul>
      <li><strong>Email:</strong> ${submission.contactEmail}</li>
      <li><strong>Telefon:</strong> ${submission.contactPhone}</li>
    </ul>

    ${submission.notes ? `<h3>Notatki</h3><p>${submission.notes}</p>` : ''}

    <h3>Status</h3>
    <p><strong>Płatność:</strong> ${submission.paymentStatus === 'completed' ? '✅ Opłacone' : '⏳ Oczekujące'}</p>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: 'biuro@palmo-trans.com',
      subject,
      html,
    });
    console.log(`✅ Email do biura wysłany: ${submission.referenceNumber}`);
  } catch (error) {
    console.error('❌ Error sending email to office:', error);
    throw error;
  }
}

/**
 * Wyślij potwierdzenie do klienta
 */
export async function sendEmailToCustomer(submission: DeliverySubmission) {
  const subject = `Potwierdzenie zgłoszenia dostawy — ${submission.referenceNumber}`;

  const html = `
    <h2>Dziękujemy za zgłoszenie! 📦</h2>

    <p>Twoje zgłoszenie zostało przyjęte i przetwarzane.</p>

    <h3>Numer referencyjny</h3>
    <p style="font-size: 24px; font-weight: bold; color: #FFD700;">
      ${submission.referenceNumber}
    </p>

    <h3>Szczegóły przesyłki</h3>
    <ul>
      <li><strong>Pobranie:</strong> ${submission.pickupAddress}</li>
      <li><strong>Dostawa:</strong> ${submission.deliveryAddress}</li>
      <li><strong>Waga:</strong> ${submission.weight} kg</li>
      <li><strong>Szacunkowa cena:</strong> <strong>${submission.estimatedPrice} PLN</strong></li>
    </ul>

    <p>W ciągu 1 godziny nasz zespół skontaktuje się z Tobą.</p>

    <hr style="margin-top: 40px;">
    <p style="font-size: 12px; color: #999;">
      PALMO-TRANS GmbH | Bezpieczne • Niezawodne • Profesjonalne
    </p>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: submission.contactEmail,
      subject,
      html,
    });
    console.log(`✅ Email do klienta wysłany: ${submission.contactEmail}`);
  } catch (error) {
    console.error('❌ Error sending email to customer:', error);
    throw error;
  }
}
