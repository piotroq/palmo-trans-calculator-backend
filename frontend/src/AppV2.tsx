/**
 * AppV2 — Main entry point z booking flow
 *
 * Stan: 'wizard' → 'confirmed' → (reset) → 'wizard'
 */

import { useState } from 'react';
import { WizardLayout } from './components/wizard/WizardLayout';
import { BookingConfirmation } from './components/booking/BookingConfirmation';
import { useCalculatorStoreV2 } from './store/calculatorStoreV2';
import type { BookingConfirmation as BookingData } from './services/bookingService';

export default function AppV2() {
  const [confirmed, setConfirmed] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const resetStore = useCalculatorStoreV2((s) => s.reset);

  const handleBookingSuccess = (data: BookingData) => {
    setBookingData(data);
    setConfirmed(true);
  };

  const handleNewBooking = () => {
    resetStore();
    setBookingData(null);
    setConfirmed(false);
  };

  if (confirmed && bookingData) {
    return <BookingConfirmation booking={bookingData} onNewBooking={handleNewBooking} />;
  }

  return <WizardLayout onBookingSuccess={handleBookingSuccess} />;
}
