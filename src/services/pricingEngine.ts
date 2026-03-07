/**
 * PricingEngine — Silnik kalkulacji cen PALMO-TRANS
 *
 * Formuła:
 *   total = basePrice + (distanceKm × pricePerKm) + servicesTotal + timeWindowSurcharge
 *   + VAT (0% Reverse Charge lub 19% DE)
 *
 * Eksportuje: calculatePrice(), quickQuote(), isPricingError()
 */

import {
  vehicles,
  additionalServices,
  timeWindows,
} from '../config/pricing';

// ─── Types ───────────────────────────────────────────────────

export interface PricingParams {
  vehicleId: string;
  distanceKm: number;
  serviceIds: string[];
  pickupTimeWindowId?: string;
  deliveryTimeWindowId?: string;
  isReverseCharge?: boolean;
}

export interface PricingResult {
  vehicleBasePrice: number;
  distanceCharge: number;
  servicesTotal: number;
  pickupTimeWindowSurcharge: number;
  deliveryTimeWindowSurcharge: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  distanceKm: number;
  estimatedDuration: string;
  breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'distance' | 'service' | 'timeWindow' | 'vat';
}

export interface PricingError {
  error: true;
  message: string;
}

// ─── Type Guard ──────────────────────────────────────────────

export function isPricingError(result: PricingResult | QuickQuoteResult | PricingError): result is PricingError {
  return 'error' in result && result.error === true;
}

// ─── Full Price Calculator ───────────────────────────────────

export function calculatePrice(params: PricingParams): PricingResult | PricingError {
  const {
    vehicleId,
    distanceKm,
    serviceIds = [],
    pickupTimeWindowId = 'TW-6H',
    deliveryTimeWindowId = 'TW-6H',
    isReverseCharge = false,
  } = params;

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return { error: true, message: `Unbekanntes Fahrzeug: ${vehicleId}` };
  }

  if (distanceKm <= 0) {
    return { error: true, message: 'Entfernung muss größer als 0 sein' };
  }

  // Cena bazowa + dystans
  const vehicleBasePrice = vehicle.basePrice;
  const distanceCharge = round(distanceKm * vehicle.pricePerKm);

  // Breakdown
  const breakdown: PriceBreakdownItem[] = [
    { label: vehicle.nameDE, amount: vehicleBasePrice, type: 'base' },
    { label: `${distanceKm} km × ${vehicle.pricePerKm.toFixed(2)} zł/km`, amount: distanceCharge, type: 'distance' },
  ];

  // Usługi dodatkowe
  let servicesTotal = 0;
  for (const svcId of serviceIds) {
    const svc = additionalServices.find((s) => s.id === svcId);
    if (!svc || !svc.availableFor.includes(vehicle.category)) continue;
    servicesTotal += svc.price;
    breakdown.push({ label: svc.nameDE, amount: svc.price, type: 'service' });
  }

  // Time window surcharges
  const pickupTW = timeWindows.find((tw) => tw.id === pickupTimeWindowId);
  const deliveryTW = timeWindows.find((tw) => tw.id === deliveryTimeWindowId);

  const pickupSurcharge = pickupTW ? pickupTW.surcharge[vehicle.category] : 0;
  const deliverySurcharge = deliveryTW ? deliveryTW.surcharge[vehicle.category] : 0;

  if (pickupSurcharge > 0) {
    breakdown.push({ label: `Abhol-Zeitfenster: ${pickupTW!.nameDE}`, amount: pickupSurcharge, type: 'timeWindow' });
  }
  if (deliverySurcharge > 0) {
    breakdown.push({ label: `Zustell-Zeitfenster: ${deliveryTW!.nameDE}`, amount: deliverySurcharge, type: 'timeWindow' });
  }

  // Subtotal + VAT
  const subtotal = round(vehicleBasePrice + distanceCharge + servicesTotal + pickupSurcharge + deliverySurcharge);

  // 0% domyślnie (Reverse Charge B2B EU). Zmień na 0.19 jeśli klienci DE B2C.
  const vatRate = isReverseCharge ? 0 : 0;
  const vatAmount = round(subtotal * vatRate);
  const total = round(subtotal + vatAmount);

  if (vatAmount > 0) {
    breakdown.push({ label: `MwSt. ${(vatRate * 100).toFixed(0)}%`, amount: vatAmount, type: 'vat' });
  }

  // Szacowany czas (~60 km/h)
  const mins = Math.round(distanceKm / 60 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const estimatedDuration = h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`;

  return {
    vehicleBasePrice,
    distanceCharge,
    servicesTotal: round(servicesTotal),
    pickupTimeWindowSurcharge: pickupSurcharge,
    deliveryTimeWindowSurcharge: deliverySurcharge,
    subtotal,
    vatRate,
    vatAmount,
    total,
    distanceKm,
    estimatedDuration,
    breakdown,
  };
}

// ─── Quick Quote (uproszczona — Step 1 frontend) ─────────────

export interface QuickQuoteParams {
  vehicleId: string;
  distanceKm: number;
  serviceIds?: string[];
}

export interface QuickQuoteResult {
  vehicleBasePrice: number;
  distanceCharge: number;
  servicesTotal: number;
  total: number;
  pricePerKm: number;
  vehicleName: string;
}

export function quickQuote(params: QuickQuoteParams): QuickQuoteResult | PricingError {
  const vehicle = vehicles.find((v) => v.id === params.vehicleId);
  if (!vehicle) {
    return { error: true, message: `Unbekanntes Fahrzeug: ${params.vehicleId}` };
  }

  if (params.distanceKm <= 0) {
    return { error: true, message: 'Entfernung muss größer als 0 sein' };
  }

  const vehicleBasePrice = vehicle.basePrice;
  const distanceCharge = round(params.distanceKm * vehicle.pricePerKm);

  let servicesTotal = 0;
  for (const svcId of (params.serviceIds || [])) {
    const svc = additionalServices.find((s) => s.id === svcId);
    if (svc && svc.availableFor.includes(vehicle.category)) {
      servicesTotal += svc.price;
    }
  }

  return {
    vehicleBasePrice,
    distanceCharge,
    servicesTotal: round(servicesTotal),
    total: round(vehicleBasePrice + distanceCharge + servicesTotal),
    pricePerKm: vehicle.pricePerKm,
    vehicleName: vehicle.nameDE,
  };
}

// ─── All Vehicles Quick Prices (dla listy pojazdów w Step 1) ──

export interface VehiclePriceListItem {
  vehicleId: string;
  vehicleName: string;
  category: 'express' | 'lkw';
  basePrice: number;
  distanceCharge: number;
  total: number;
  pricePerKm: number;
}

export function allVehiclePrices(distanceKm: number): VehiclePriceListItem[] {
  if (distanceKm <= 0) return [];

  return vehicles.map((v) => ({
    vehicleId: v.id,
    vehicleName: v.nameDE,
    category: v.category,
    basePrice: v.basePrice,
    distanceCharge: round(distanceKm * v.pricePerKm),
    total: round(v.basePrice + distanceKm * v.pricePerKm),
    pricePerKm: v.pricePerKm,
  }));
}

// ─── Helper ──────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
