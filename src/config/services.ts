/**
 * PALMO-TRANS Calculator v2 — Additional Services (Zusatzservices)
 *
 * Stałe stawki za usługi dodatkowe.
 */

export interface AdditionalServiceConfig {
  id: string;
  name: string;
  nameDE: string;
  price: number; // zł (netto)
  availableFor: ('express' | 'lkw')[];
  description?: string;
  tooltip?: string;
}

export const additionalServices: AdditionalServiceConfig[] = [
  {
    id: 'SVC-01',
    name: 'Beladehilfe durch Fahrer',
    nameDE: 'Beladehilfe durch Fahrer',
    price: 119.0,
    availableFor: ['express'],
    tooltip: 'Der Fahrer hilft beim Beladen des Fahrzeugs',
  },
  {
    id: 'SVC-02',
    name: 'Entladehilfe durch Fahrer',
    nameDE: 'Entladehilfe durch Fahrer',
    price: 119.0,
    availableFor: ['express'],
    tooltip: 'Der Fahrer hilft beim Entladen des Fahrzeugs',
  },
  {
    id: 'SVC-03',
    name: 'Neutrale Abholung/Zustellung',
    nameDE: 'Neutrale Abholung/Zustellung',
    price: 499.0,
    availableFor: ['express', 'lkw'],
    tooltip: 'Fahrzeug ohne Firmenbranding für diskrete Lieferung',
  },
  {
    id: 'SVC-04',
    name: 'Papierrechnung',
    nameDE: 'Papierrechnung',
    price: 49.99,
    availableFor: ['express', 'lkw'],
    tooltip: 'Zusätzlich zur digitalen Rechnung eine Papierrechnung per Post',
  },
  {
    id: 'SVC-05',
    name: 'Beladung von oben',
    nameDE: 'Beladung von oben',
    price: 399.0,
    availableFor: ['lkw'],
    tooltip: 'Kranbeladung von oben möglich (Plane wird geöffnet)',
  },
  {
    id: 'SVC-06',
    name: 'Hebebühne',
    nameDE: 'Hebebühne',
    price: 619.0,
    availableFor: ['lkw'],
    tooltip: 'LKW mit hydraulischer Hebebühne für schwere Güter',
  },
];

export function getServiceById(id: string): AdditionalServiceConfig | undefined {
  return additionalServices.find((s) => s.id === id);
}

export function getServicesForCategory(category: 'express' | 'lkw'): AdditionalServiceConfig[] {
  return additionalServices.filter((s) => s.availableFor.includes(category));
}

// ─── TIME WINDOWS ─────────────────────────────────────────────

export interface TimeWindowConfig {
  id: string;
  name: string;
  nameDE: string;
  hours: number; // 6, 3, 0 (fixzeit)
  surcharge: { express: number; lkw: number }; // zł
}

export const timeWindows: TimeWindowConfig[] = [
  {
    id: 'TW-6H',
    name: '6 Stunden',
    nameDE: '6 Stunden',
    hours: 6,
    surcharge: { express: 0, lkw: 0 },
  },
  {
    id: 'TW-3H',
    name: '3 Stunden',
    nameDE: '3 Stunden',
    hours: 3,
    surcharge: { express: 413.82, lkw: 0 },
  },
  {
    id: 'TW-FIX',
    name: 'Fixzeit',
    nameDE: 'Fixzeit',
    hours: 0,
    surcharge: { express: 831.82, lkw: 0 },
  },
];

export function getTimeWindowById(id: string): TimeWindowConfig | undefined {
  return timeWindows.find((tw) => tw.id === id);
}

// ─── SHIPMENT CATEGORIES ──────────────────────────────────────

export interface ShipmentCategory {
  id: string;
  name: string;
  nameDE: string;
  icon: string; // Material icon name
  defaultDimensions?: { length: number; width: number; height: number };
  defaultWeight?: number;
}

export const shipmentCategories: ShipmentCategory[] = [
  {
    id: 'CAT-PALETTE',
    name: 'Palette',
    nameDE: 'Palette',
    icon: 'inventory_2',
    defaultDimensions: { length: 120, width: 80, height: 100 },
    defaultWeight: 100,
  },
  {
    id: 'CAT-DOKUMENT',
    name: 'Dokument',
    nameDE: 'Dokument',
    icon: 'description',
    defaultDimensions: { length: 35, width: 25, height: 5 },
    defaultWeight: 1,
  },
  {
    id: 'CAT-PAKET',
    name: 'Paket',
    nameDE: 'Paket',
    icon: 'package_2',
    defaultDimensions: { length: 60, width: 40, height: 40 },
    defaultWeight: 10,
  },
  {
    id: 'CAT-FAHRZEUG',
    name: 'Komplettes Fahrzeug',
    nameDE: 'Komplettes Fahrzeug',
    icon: 'local_shipping',
  },
  {
    id: 'CAT-GITTERBOX',
    name: 'Euro Gitterbox',
    nameDE: 'Euro Gitterbox',
    icon: 'grid_on',
    defaultDimensions: { length: 124, width: 83, height: 97 },
    defaultWeight: 70,
  },
  {
    id: 'CAT-SONSTIGE',
    name: 'Sonstige',
    nameDE: 'Sonstige',
    icon: 'category',
  },
];

// ─── PAYMENT METHODS ──────────────────────────────────────────

export interface PaymentMethodConfig {
  id: string;
  name: string;
  nameDE: string;
  description?: string;
  icon: string;
  transactionFee: number; // zł, 0 = brak
  enabled: boolean;
  businessOnly?: boolean; // np. Rechnung tylko B2B
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'PAY-RECHNUNG',
    name: 'Rechnung',
    nameDE: 'Rechnung',
    description: 'Nur gewerblich, 14 Tage Zahlungsziel',
    icon: 'receipt_long',
    transactionFee: 0,
    enabled: true,
    businessOnly: true,
  },
  {
    id: 'PAY-P24',
    name: 'Przelewy24',
    nameDE: 'Przelewy24',
    description: 'Schnelle Online-Überweisung',
    icon: 'account_balance',
    transactionFee: 0,
    enabled: true,
  },
  {
    id: 'PAY-PAYPAL',
    name: 'PayPal',
    nameDE: 'PayPal',
    description: 'Transaktionskosten (+15,99 zł)',
    icon: 'payments',
    transactionFee: 15.99,
    enabled: true,
  },
  {
    id: 'PAY-STRIPE',
    name: 'Kreditkarte',
    nameDE: 'Kreditkarte',
    description: 'Visa, Mastercard, American Express',
    icon: 'credit_card',
    transactionFee: 0,
    enabled: true,
  },
];
