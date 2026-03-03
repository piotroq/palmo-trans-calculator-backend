/**
 * PALMO-TRANS Calculator v2 — Vehicle Configuration
 *
 * Wszystkie pojazdy Express (max 1200kg) i LKW (bis 24t).
 * Stawki bazowe i za km do kalibracji przez zarząd.
 */

export interface VehicleConfig {
  id: string;
  category: 'express' | 'lkw';
  name: string;
  nameDE: string;
  maxDimensions: { length: number; width: number; height: number }; // cm
  maxWeight: number; // kg
  maxPallets?: number;
  basePrice: number; // zł (netto)
  pricePerKm: number; // zł/km
  features: string[];
  availableServices: string[]; // IDs z services.ts
  imageSlug: string; // do mapowania na obrazki pojazdów
  sortOrder: number;
}

// ─── EXPRESS VEHICLES (max. 1200kg) ───────────────────────────

export const expressVehicles: VehicleConfig[] = [
  {
    id: 'EXP-01',
    category: 'express',
    name: 'Kleiner Transporter',
    nameDE: 'Kleiner Transporter',
    maxDimensions: { length: 160, width: 120, height: 120 },
    maxWeight: 400,
    basePrice: 250.0,
    pricePerKm: 3.5,
    features: [
      'Beladung ist ggf. nur von hinten möglich',
      'Fahrzeug hat keine Rampenhöhe',
      'Fahrzeug hat keine Hebebühne',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'kleiner-transporter',
    sortOrder: 1,
  },
  {
    id: 'EXP-02',
    category: 'express',
    name: 'Mittlerer Transporter',
    nameDE: 'Mittlerer Transporter',
    maxDimensions: { length: 320, width: 130, height: 160 },
    maxWeight: 800,
    basePrice: 300.0,
    pricePerKm: 3.75,
    features: [
      'Beladung ist ggf. nur von hinten möglich',
      'Fahrzeug hat keine Rampenhöhe',
      'Fahrzeug hat keine Hebebühne',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'mittlerer-transporter',
    sortOrder: 2,
  },
  {
    id: 'EXP-03',
    category: 'express',
    name: 'Großer Transporter',
    nameDE: 'Großer Transporter',
    maxDimensions: { length: 420, width: 210, height: 210 },
    maxWeight: 1200,
    basePrice: 400.0,
    pricePerKm: 4.5,
    features: [
      'Beladung ist ggf. nur von hinten möglich',
      'Fahrzeug hat keine Rampenhöhe',
      'Fahrzeug hat keine Hebebühne',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'grosser-transporter',
    sortOrder: 3,
  },
  {
    id: 'EXP-04',
    category: 'express',
    name: 'Hebebühne und Hubwagen',
    nameDE: 'Hebebühne und Hubwagen',
    maxDimensions: { length: 420, width: 210, height: 210 },
    maxWeight: 800,
    basePrice: 450.0,
    pricePerKm: 4.75,
    features: [
      'Hebebühne verfügbar',
      'Hubwagen inklusive',
      'Beladung von hinten',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'hebebuehne-hubwagen',
    sortOrder: 4,
  },
  {
    id: 'EXP-05',
    category: 'express',
    name: 'Länge 450cm Ladefläche',
    nameDE: 'Länge 450cm Ladefläche',
    maxDimensions: { length: 450, width: 210, height: 210 },
    maxWeight: 1200,
    basePrice: 500.0,
    pricePerKm: 5.15,
    features: [
      'Verlängerte Ladefläche (450cm)',
      'Beladung von hinten möglich',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'laenge-450',
    sortOrder: 5,
  },
  {
    id: 'EXP-06',
    category: 'express',
    name: 'Länge 480cm Ladefläche',
    nameDE: 'Länge 480cm Ladefläche',
    maxDimensions: { length: 480, width: 210, height: 210 },
    maxWeight: 1200,
    basePrice: 550.0,
    pricePerKm: 5.45,
    features: [
      'Extra verlängerte Ladefläche (480cm)',
      'Beladung von hinten möglich',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'laenge-480',
    sortOrder: 6,
  },
  {
    id: 'EXP-07',
    category: 'express',
    name: 'Breite 230cm Ladefläche',
    nameDE: 'Breite 230cm Ladefläche',
    maxDimensions: { length: 420, width: 230, height: 210 },
    maxWeight: 1200,
    basePrice: 530.0,
    pricePerKm: 5.35,
    features: [
      'Extra breite Ladefläche (230cm)',
      'Ideal für breite Güter',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'breite-230',
    sortOrder: 7,
  },
  {
    id: 'EXP-08',
    category: 'express',
    name: 'Höhe 240cm Ladefläche',
    nameDE: 'Höhe 240cm Ladefläche',
    maxDimensions: { length: 420, width: 210, height: 240 },
    maxWeight: 1200,
    basePrice: 480.0,
    pricePerKm: 4.7,
    features: [
      'Extra hohe Ladefläche (240cm)',
      'Ideal für hohe Güter',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'hoehe-240',
    sortOrder: 8,
  },
  {
    id: 'EXP-09',
    category: 'express',
    name: 'Beladung von oben',
    nameDE: 'Beladung von oben',
    maxDimensions: { length: 420, width: 210, height: 210 },
    maxWeight: 1200,
    basePrice: 650.0,
    pricePerKm: 6.6,
    features: [
      'Beladung von oben möglich',
      'Ideal für Kranbeladung',
      'Plane öffenbar',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'beladung-oben',
    sortOrder: 9,
  },
  {
    id: 'EXP-10',
    category: 'express',
    name: 'Gefahrgut',
    nameDE: 'Gefahrgut',
    maxDimensions: { length: 420, width: 210, height: 210 },
    maxWeight: 1200,
    basePrice: 700.0,
    pricePerKm: 6.75,
    features: [
      'ADR-zertifizierter Transport',
      'Gefahrguttransport zugelassen',
      'Spezialausrüstung inklusive',
    ],
    availableServices: ['SVC-01', 'SVC-02', 'SVC-03', 'SVC-04'],
    imageSlug: 'gefahrgut',
    sortOrder: 10,
  },
];

// ─── LKW VEHICLES (bis 24t Nutzlast) ─────────────────────────

export const lkwVehicles: VehicleConfig[] = [
  {
    id: 'LKW-01',
    category: 'lkw',
    name: '3t Sendung (Planen-LKW)',
    nameDE: '3t Sendung (Planen-LKW)',
    maxDimensions: { length: 600, width: 240, height: 230 },
    maxWeight: 3000,
    maxPallets: 14,
    basePrice: 450.0,
    pricePerKm: 5.25,
    features: [
      'Beladung seitlich und von hinten möglich',
      'Fahrzeug hat Rampenhöhe',
      'Hebebühne ist als Zusatzservice verfügbar',
      'Teilladungstransport: Es können weitere Sendungen auf dem Fahrzeug sein',
    ],
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    imageSlug: 'lkw-3t',
    sortOrder: 1,
  },
  {
    id: 'LKW-02',
    category: 'lkw',
    name: '5t Sendung (Planen-LKW)',
    nameDE: '5t Sendung (Planen-LKW)',
    maxDimensions: { length: 600, width: 240, height: 230 },
    maxWeight: 5000,
    maxPallets: 14,
    basePrice: 520.0,
    pricePerKm: 6.05,
    features: [
      'Beladung seitlich und von hinten möglich',
      'Fahrzeug hat Rampenhöhe',
      'Hebebühne ist als Zusatzservice verfügbar',
      'Teilladungstransport möglich',
    ],
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    imageSlug: 'lkw-5t',
    sortOrder: 2,
  },
  {
    id: 'LKW-03',
    category: 'lkw',
    name: '12t Sendung (Planen-LKW)',
    nameDE: '12t Sendung (Planen-LKW)',
    maxDimensions: { length: 720, width: 240, height: 240 },
    maxWeight: 12000,
    maxPallets: 18,
    basePrice: 620.0,
    pricePerKm: 7.35,
    features: [
      'Beladung seitlich und von hinten möglich',
      'Fahrzeug hat Rampenhöhe',
      'Hebebühne ist als Zusatzservice verfügbar',
    ],
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    imageSlug: 'lkw-12t',
    sortOrder: 3,
  },
  {
    id: 'LKW-04',
    category: 'lkw',
    name: '24t Sendung (Planen-LKW)',
    nameDE: '24t Sendung (Planen-LKW)',
    maxDimensions: { length: 1360, width: 240, height: 270 },
    maxWeight: 24000,
    maxPallets: 33,
    basePrice: 750.0,
    pricePerKm: 8.7,
    features: [
      'Kompletter Sattelzug',
      'Beladung seitlich und von hinten möglich',
      'Fahrzeug hat Rampenhöhe',
      'Hebebühne ist als Zusatzservice verfügbar',
    ],
    availableServices: ['SVC-03', 'SVC-04', 'SVC-05', 'SVC-06'],
    imageSlug: 'lkw-24t',
    sortOrder: 4,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────

export const allVehicles: VehicleConfig[] = [...expressVehicles, ...lkwVehicles];

export function getVehicleById(id: string): VehicleConfig | undefined {
  return allVehicles.find((v) => v.id === id);
}

export function getVehiclesByCategory(category: 'express' | 'lkw'): VehicleConfig[] {
  return allVehicles
    .filter((v) => v.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Pierwszych N pojazdów Express (domyślnie widoczne) */
export const EXPRESS_DEFAULT_VISIBLE = 4;
