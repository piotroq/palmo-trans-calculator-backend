/**
 * Pricing Config — Stawki cenowe PALMO-TRANS
 *
 * Źródło: PALMO-TRANS-Calculator-Expansion-Plan.md sekcje 3.2-3.5
 * UWAGA: Stawki za km to propozycja — finalne stawki do uzgodnienia z zarządem.
 */

// ─── Vehicle Config ──────────────────────────────────────────

export interface VehicleConfig {
  id: string;
  category: 'express' | 'lkw';
  nameDE: string;
  maxDimensions: { length: number; width: number; height: number }; // cm
  maxWeight: number; // kg
  maxPallets?: number;
  basePrice: number; // zł
  pricePerKm: number; // zł/km
  availableServices: string[];
  features: string[];
}

export const vehicles: VehicleConfig[] = [
  // ── Express (max. 1200kg) ──
  {
    id: 'EXP-01', category: 'express', nameDE: 'Kleiner Transporter',
    maxDimensions: { length: 160, width: 120, height: 120 }, maxWeight: 400,
    basePrice: 250.00, pricePerKm: 3.50,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Dokumente', 'Pakete'],
  },
  {
    id: 'EXP-02', category: 'express', nameDE: 'Mittlerer Transporter',
    maxDimensions: { length: 320, width: 130, height: 160 }, maxWeight: 800,
    basePrice: 300.00, pricePerKm: 3.75,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Dokumente', 'Pakete', 'Kleinmöbel'],
  },
  {
    id: 'EXP-03', category: 'express', nameDE: 'Großer Transporter',
    maxDimensions: { length: 420, width: 210, height: 210 }, maxWeight: 1200,
    basePrice: 400.00, pricePerKm: 4.50,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Dokumente', 'Pakete', 'Paletten', 'Möbel'],
  },
  {
    id: 'EXP-04', category: 'express', nameDE: 'Hebebühne und Hubwagen',
    maxDimensions: { length: 420, width: 210, height: 210 }, maxWeight: 800,
    basePrice: 450.00, pricePerKm: 4.75,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Hebebühne', 'Hubwagen', 'Schwere Pakete'],
  },
  {
    id: 'EXP-05', category: 'express', nameDE: 'Länge 450cm',
    maxDimensions: { length: 450, width: 210, height: 210 }, maxWeight: 1200,
    basePrice: 500.00, pricePerKm: 5.15,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Überlange Güter', 'Paletten', 'Möbel'],
  },
  {
    id: 'EXP-06', category: 'express', nameDE: 'Länge 480cm',
    maxDimensions: { length: 480, width: 210, height: 210 }, maxWeight: 1200,
    basePrice: 550.00, pricePerKm: 5.45,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Überlange Güter', 'Paletten'],
  },
  {
    id: 'EXP-07', category: 'express', nameDE: 'Breite 230cm',
    maxDimensions: { length: 420, width: 230, height: 210 }, maxWeight: 1200,
    basePrice: 530.00, pricePerKm: 5.35,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Überbreite Güter', 'Paletten'],
  },
  {
    id: 'EXP-08', category: 'express', nameDE: 'Höhe 240cm',
    maxDimensions: { length: 420, width: 210, height: 240 }, maxWeight: 1200,
    basePrice: 480.00, pricePerKm: 4.70,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Überhohe Güter', 'Paletten'],
  },
  {
    id: 'EXP-09', category: 'express', nameDE: 'Beladung von oben',
    maxDimensions: { length: 420, width: 210, height: 210 }, maxWeight: 1200,
    basePrice: 650.00, pricePerKm: 6.60,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['Kranbeladung', 'Schwere Maschinen'],
  },
  {
    id: 'EXP-10', category: 'express', nameDE: 'Gefahrgut',
    maxDimensions: { length: 420, width: 210, height: 210 }, maxWeight: 1200,
    basePrice: 700.00, pricePerKm: 6.75,
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    features: ['ADR-Lizenz', 'Gefahrguttransport'],
  },

  // ── LKW (bis 24t Nutzlast) ──
  {
    id: 'LKW-01', category: 'lkw', nameDE: '3t Sendung (Planen-LKW)',
    maxDimensions: { length: 600, width: 240, height: 230 }, maxWeight: 3000,
    maxPallets: 14, basePrice: 450.00, pricePerKm: 5.25,
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    features: ['Planen-LKW', 'Seitlich + Hinten', 'bis 14 EPAL'],
  },
  {
    id: 'LKW-02', category: 'lkw', nameDE: '5t Sendung (Planen-LKW)',
    maxDimensions: { length: 700, width: 240, height: 240 }, maxWeight: 5000,
    maxPallets: 14, basePrice: 520.00, pricePerKm: 6.05,
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    features: ['Planen-LKW', 'Seitlich + Hinten', 'bis 14 EPAL'],
  },
  {
    id: 'LKW-03', category: 'lkw', nameDE: '12t Sendung (Planen-LKW)',
    maxDimensions: { length: 800, width: 240, height: 240 }, maxWeight: 12000,
    maxPallets: 18, basePrice: 620.00, pricePerKm: 7.35,
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    features: ['Planen-LKW', 'Seitlich + Hinten', 'bis 18 EPAL'],
  },
  {
    id: 'LKW-04', category: 'lkw', nameDE: '24t Sendung (Planen-LKW)',
    maxDimensions: { length: 1360, width: 240, height: 240 }, maxWeight: 24000,
    maxPallets: 33, basePrice: 750.00, pricePerKm: 8.70,
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    features: ['Planen-LKW', 'Seitlich + Hinten', 'bis 33 EPAL'],
  },
];

// ─── Additional Services ─────────────────────────────────────

export interface ServiceConfig {
  id: string;
  nameDE: string;
  price: number; // zł
  availableFor: ('express' | 'lkw')[];
  description?: string;
}

export const additionalServices: ServiceConfig[] = [
  { id: 'SVC-01', nameDE: 'Beladehilfe durch Fahrer', price: 119.00, availableFor: ['express'] },
  { id: 'SVC-02', nameDE: 'Entladehilfe durch Fahrer', price: 119.00, availableFor: ['express'] },
  { id: 'SVC-03', nameDE: 'Neutrale Abholung/Zustellung', price: 499.00, availableFor: ['express', 'lkw'] },
  { id: 'SVC-04', nameDE: 'Papierrechnung', price: 49.99, availableFor: ['express', 'lkw'] },
  { id: 'SVC-05', nameDE: 'Beladung von oben', price: 399.00, availableFor: ['lkw'] },
  { id: 'SVC-06', nameDE: 'Hebebühne', price: 619.00, availableFor: ['lkw'] },
];

// ─── Time Window Surcharges ──────────────────────────────────

export interface TimeWindowConfig {
  id: string;
  nameDE: string;
  hours: number;
  surcharge: { express: number; lkw: number }; // zł
}

export const timeWindows: TimeWindowConfig[] = [
  { id: 'TW-6H', nameDE: '6 Stunden', hours: 6, surcharge: { express: 0, lkw: 0 } },
  { id: 'TW-3H', nameDE: '3 Stunden', hours: 3, surcharge: { express: 413.82, lkw: 0 } },
  { id: 'TW-FIX', nameDE: 'Fixzeit', hours: 1, surcharge: { express: 831.82, lkw: 0 } },
];

// ─── PayPal Transaction Fee ──────────────────────────────────

export const PAYPAL_FEE = 15.99; // zł
