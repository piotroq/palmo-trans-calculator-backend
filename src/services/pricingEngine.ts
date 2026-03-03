/**
 * PALMO-TRANS Calculator v2 — Pricing Engine
 *
 * Centralny silnik kalkulacji cen.
 * Formuła: Cena = Base + (km × rate) + Services + TimeWindow
 */

import { getVehicleById, type VehicleConfig } from '../config/vehicles';
import {
  getServiceById,
  getTimeWindowById,
  type AdditionalServiceConfig,
  type TimeWindowConfig,
} from '../config/services';

// ─── TYPES ────────────────────────────────────────────────────

export interface PriceCalculationRequest {
  vehicleId: string;
  distanceKm: number;
  serviceIds: string[];
  pickupTimeWindowId: string;
  deliveryTimeWindowId: string;
  /** Czy klient B2B spoza Niemiec (Reverse Charge 0% USt) */
  isReverseCharge: boolean;
}

export interface PriceBreakdownItem {
  id: string;
  label: string;
  labelDE: string;
  amount: number;
  type: 'vehicle_base' | 'distance' | 'service' | 'time_window' | 'payment_fee';
}

export interface PricingResult {
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: 'express' | 'lkw';

  // Składniki ceny
  vehicleBasePrice: number;
  distanceCharge: number;
  servicesTotal: number;
  pickupTimeWindowSurcharge: number;
  deliveryTimeWindowSurcharge: number;

  // Podsumowanie
  subtotal: number;
  vatRate: number; // 0.19 lub 0 (Reverse Charge)
  vatAmount: number;
  total: number;

  // Metadane
  distanceKm: number;
  estimatedDuration: string;
  pricePerKm: number;
  breakdown: PriceBreakdownItem[];
}

export interface PricingError {
  code: string;
  message: string;
  field?: string;
}

// ─── MAIN CALCULATION ─────────────────────────────────────────

export function calculatePrice(req: PriceCalculationRequest): PricingResult | PricingError {
  // 1. Walidacja pojazdu
  const vehicle = getVehicleById(req.vehicleId);
  if (!vehicle) {
    return { code: 'INVALID_VEHICLE', message: `Unknown vehicle ID: ${req.vehicleId}`, field: 'vehicleId' };
  }

  // 2. Walidacja dystansu
  if (req.distanceKm <= 0 || !Number.isFinite(req.distanceKm)) {
    return { code: 'INVALID_DISTANCE', message: 'Distance must be positive', field: 'distanceKm' };
  }

  // 3. Walidacja usług — sprawdź czy dostępne dla kategorii pojazdu
  const validatedServices: AdditionalServiceConfig[] = [];
  for (const svcId of req.serviceIds) {
    const service = getServiceById(svcId);
    if (!service) {
      return { code: 'INVALID_SERVICE', message: `Unknown service ID: ${svcId}`, field: 'serviceIds' };
    }
    if (!service.availableFor.includes(vehicle.category)) {
      return {
        code: 'SERVICE_NOT_AVAILABLE',
        message: `Service "${service.name}" is not available for ${vehicle.category} vehicles`,
        field: 'serviceIds',
      };
    }
    if (!vehicle.availableServices.includes(svcId)) {
      return {
        code: 'SERVICE_NOT_COMPATIBLE',
        message: `Service "${service.name}" is not compatible with vehicle "${vehicle.name}"`,
        field: 'serviceIds',
      };
    }
    validatedServices.push(service);
  }

  // 4. Time windows
  const pickupTW = getTimeWindowById(req.pickupTimeWindowId);
  const deliveryTW = getTimeWindowById(req.deliveryTimeWindowId);
  if (!pickupTW) {
    return { code: 'INVALID_TIME_WINDOW', message: `Unknown pickup time window: ${req.pickupTimeWindowId}`, field: 'pickupTimeWindowId' };
  }
  if (!deliveryTW) {
    return { code: 'INVALID_TIME_WINDOW', message: `Unknown delivery time window: ${req.deliveryTimeWindowId}`, field: 'deliveryTimeWindowId' };
  }

  // 5. Kalkulacja
  const vehicleBasePrice = vehicle.basePrice;
  const distanceCharge = round2(req.distanceKm * vehicle.pricePerKm);
  const servicesTotal = round2(validatedServices.reduce((sum, s) => sum + s.price, 0));
  const pickupTimeWindowSurcharge = pickupTW.surcharge[vehicle.category];
  const deliveryTimeWindowSurcharge = deliveryTW.surcharge[vehicle.category];

  const subtotal = round2(
    vehicleBasePrice + distanceCharge + servicesTotal + pickupTimeWindowSurcharge + deliveryTimeWindowSurcharge
  );

  // VAT: 0% dla Reverse Charge (B2B spoza DE), 19% normalnie
  const vatRate = req.isReverseCharge ? 0 : 0.19;
  const vatAmount = round2(subtotal * vatRate);
  const total = round2(subtotal + vatAmount);

  // 6. Breakdown
  const breakdown: PriceBreakdownItem[] = [
    {
      id: 'base',
      label: `${vehicle.name} (base)`,
      labelDE: `${vehicle.nameDE} (Grundpreis)`,
      amount: vehicleBasePrice,
      type: 'vehicle_base',
    },
    {
      id: 'distance',
      label: `${req.distanceKm} km × ${vehicle.pricePerKm} zł/km`,
      labelDE: `${req.distanceKm} km × ${vehicle.pricePerKm} zł/km`,
      amount: distanceCharge,
      type: 'distance',
    },
    ...validatedServices.map((s) => ({
      id: s.id,
      label: s.name,
      labelDE: s.nameDE,
      amount: s.price,
      type: 'service' as const,
    })),
  ];

  if (pickupTimeWindowSurcharge > 0) {
    breakdown.push({
      id: 'pickup-tw',
      label: `Pickup: ${pickupTW.name}`,
      labelDE: `Abholung: ${pickupTW.nameDE}`,
      amount: pickupTimeWindowSurcharge,
      type: 'time_window',
    });
  }
  if (deliveryTimeWindowSurcharge > 0) {
    breakdown.push({
      id: 'delivery-tw',
      label: `Delivery: ${deliveryTW.name}`,
      labelDE: `Zustellung: ${deliveryTW.nameDE}`,
      amount: deliveryTimeWindowSurcharge,
      type: 'time_window',
    });
  }

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.nameDE,
    vehicleCategory: vehicle.category,
    vehicleBasePrice,
    distanceCharge,
    servicesTotal,
    pickupTimeWindowSurcharge,
    deliveryTimeWindowSurcharge,
    subtotal,
    vatRate,
    vatAmount,
    total,
    distanceKm: req.distanceKm,
    estimatedDuration: estimateDuration(req.distanceKm),
    pricePerKm: vehicle.pricePerKm,
    breakdown,
  };
}

// ─── QUICK QUOTE (Step 1 — tylko pojazd + dystans) ────────────

export interface QuickQuoteRequest {
  vehicleId: string;
  distanceKm: number;
  serviceIds?: string[];
}

export function calculateQuickQuote(req: QuickQuoteRequest): { price: number; vehicleName: string } | PricingError {
  const vehicle = getVehicleById(req.vehicleId);
  if (!vehicle) {
    return { code: 'INVALID_VEHICLE', message: `Unknown vehicle ID: ${req.vehicleId}` };
  }
  if (req.distanceKm <= 0) {
    return { code: 'INVALID_DISTANCE', message: 'Distance must be positive' };
  }

  let price = vehicle.basePrice + req.distanceKm * vehicle.pricePerKm;

  // Opcjonalnie dodaj usługi
  if (req.serviceIds?.length) {
    for (const svcId of req.serviceIds) {
      const svc = getServiceById(svcId);
      if (svc) price += svc.price;
    }
  }

  return { price: round2(price), vehicleName: vehicle.nameDE };
}

// ─── HELPERS ──────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Szacowany czas jazdy (uproszczony: ~70 km/h średnia) */
function estimateDuration(distanceKm: number): string {
  const hours = Math.floor(distanceKm / 70);
  const minutes = Math.round(((distanceKm / 70) % 1) * 60);

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}:00 h`;
  return `${hours}:${minutes.toString().padStart(2, '0')} h`;
}

/** Sprawdź czy wynik jest błędem */
export function isPricingError(result: PricingResult | PricingError): result is PricingError {
  return 'code' in result;
}
