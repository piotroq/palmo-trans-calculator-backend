/**
 * BookingService — Frontend submission logic
 *
 * Zbiera dane z Zustand store, wysyła POST /api/v2/booking,
 * zwraca booking confirmation.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface BookingPayload {
  vehicleId: string;
  vehicleCategory: 'express' | 'lkw';
  distanceKm: number;
  serviceIds: string[];
  packages: Array<{
    categoryId: string;
    description: string;
    quantity: number;
    stackable: boolean;
    weight: number;
    length: number;
    width: number;
    height: number;
  }>;
  additionalInfo: string;
  pickup: {
    address: AddressPayload;
    schedule: SchedulePayload;
    coords?: { lat: number; lng: number };
  };
  delivery: {
    address: AddressPayload;
    schedule: SchedulePayload;
    coords?: { lat: number; lng: number };
  };
  invoice: InvoicePayload;
  paymentMethod: string;
}

interface AddressPayload {
  company: string;
  firstName: string;
  lastName: string;
  street: string;
  addressExtra: string;
  country: string;
  postalCode: string;
  city: string;
  phone: string;
  reference: string;
  notes: string;
}

interface SchedulePayload {
  date: string;
  timeWindowId: string;
  timeSlot?: { from: string; to: string };
}

interface InvoicePayload {
  email: string;
  company: string;
  salutation: string;
  firstName: string;
  lastName: string;
  street: string;
  addressExtra: string;
  country: string;
  postalCode: string;
  city: string;
  phone: string;
  reference: string;
  vatId: string;
  billingEmail: string;
}

export interface BookingConfirmation {
  bookingId: string;
  bookingNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  message: string;
}

export async function submitBooking(payload: BookingPayload): Promise<BookingConfirmation> {
  const response = await axios.post<{ success: boolean; data: BookingConfirmation }>(
    `${API_URL}/api/v2/booking`,
    payload
  );

  if (!response.data.success) {
    throw new Error('Buchung fehlgeschlagen');
  }

  return response.data.data;
}
