/**
 * BookingConfirmation — Ekran potwierdzenia zamówienia
 *
 * Wyświetlany po pomyślnym POST /api/v2/booking.
 * Animowany ✓, booking number, podsumowanie, CTA.
 */

import { useEffect, useState } from 'react';
import type { BookingConfirmation as BookingData } from '../../services/bookingService';

interface BookingConfirmationProps {
  booking: BookingData;
  onNewBooking: () => void;
}

export const BookingConfirmation = ({ booking, onNewBooking }: BookingConfirmationProps) => {
  const [showCheck, setShowCheck] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCheck(true), 300);
    const t2 = setTimeout(() => setShowDetails(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const fmtPrice = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const paymentLabels: Record<string, string> = {
    rechnung: 'Rechnung (14 Tage)',
    przelewy24: 'Przelewy24',
    paypal: 'PayPal',
    kreditkarte: 'Kreditkarte',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#1A1A1A' }}>
      <div className="max-w-lg w-full">

        {/* ── Animated Checkmark ── */}
        <div className="flex justify-center mb-8">
          <div className={`
            w-24 h-24 rounded-full border-4 flex items-center justify-center
            transition-all duration-700 ease-out
            ${showCheck
              ? 'border-green-400 bg-green-400/10 scale-100 opacity-100'
              : 'border-gray-700 bg-transparent scale-75 opacity-0'
            }
          `}>
            <svg
              className={`w-12 h-12 text-green-400 transition-all duration-500 delay-200 ${showCheck ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* ── Title ── */}
        <div className={`text-center transition-all duration-600 ${showCheck ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl font-bold text-white mb-2">Buchung erfolgreich!</h1>
          <p className="text-gray-400">Vielen Dank für Ihre Buchung bei PALMO-TRANS</p>
        </div>

        {/* ── Booking Details Card ── */}
        <div className={`
          mt-8 bg-gray-900/70 rounded-2xl border border-gray-800 p-6
          transition-all duration-700 delay-300
          ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}>
          {/* Booking Number */}
          <div className="text-center mb-6 pb-6 border-b border-gray-700">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Buchungsnummer</p>
            <p className="text-2xl font-bold text-yellow-400 font-mono tracking-wider">
              {booking.bookingNumber}
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <DetailRow label="Gesamtsumme" value={`${fmtPrice(booking.total)} zł`} highlight />
            <DetailRow label="Zahlmethode" value={paymentLabels[booking.paymentMethod] || booking.paymentMethod} />
            <DetailRow label="Status" value={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-400/10 text-yellow-400">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Bestätigung ausstehend
              </span>
            } />
            <DetailRow label="Erstellt am" value={new Date(booking.createdAt).toLocaleString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })} />
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <p className="text-sm text-gray-300">
              📧 Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ihre Buchungsnummer: <span className="text-yellow-400 font-mono">{booking.bookingNumber}</span>.
              Bitte bewahren Sie diese für Rückfragen auf.
            </p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className={`
          mt-6 space-y-3
          transition-all duration-700 delay-500
          ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <button
            onClick={onNewBooking}
            className="
              w-full py-3.5 rounded-xl font-bold text-sm
              bg-yellow-400 text-gray-900
              hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20
              active:scale-[0.99] transition-all duration-200
            "
          >
            Neue Buchung erstellen
          </button>

          <a
            href="https://palmo-trans.com"
            className="
              block w-full py-3 rounded-xl font-medium text-sm text-center
              bg-gray-800 text-gray-300 border border-gray-700
              hover:bg-gray-700 hover:text-white transition-all duration-200
            "
          >
            Zurück zur Startseite
          </a>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>PALMO-TRANS GmbH | Express & Sondertransporte</p>
          <p className="mt-1">
            Fragen? <a href="mailto:kontakt@palmo-trans.com" className="text-yellow-400 hover:underline">kontakt@palmo-trans.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component ────────────────────────────────────────────

const DetailRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-400">{label}</span>
    {typeof value === 'string' ? (
      <span className={`text-sm font-semibold ${highlight ? 'text-yellow-400 text-lg' : 'text-white'}`}>{value}</span>
    ) : value}
  </div>
);
