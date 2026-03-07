# PALMO-TRANS — PricingEngine + QuickQuote (KRYTYCZNE)

## Problem
`bookingService.ts` importuje `calculatePrice` z `./pricingEngine`, ale ten moduł nie istniał.
Bez niego `POST /api/v2/booking` crashuje z `Cannot find module './pricingEngine'`.

## Pliki (3 pliki, wszystkie backend)

Z archiwum `palmo-pricing-engine.tar.gz`:

| Plik | Lokalizacja | Status |
|------|------------|--------|
| `pricing.ts` | `src/config/` | **NOWY** — konfiguracja stawek |
| `pricingEngine.ts` | `src/services/` | **NOWY** — silnik kalkulacji |
| `calculateV2.ts` | `src/routes/` | **NADPISZ** (jeśli istnieje placeholder) |

## Co zawierają

### `src/config/pricing.ts` — Konfiguracja stawek
- **14 pojazdów**: 10 Express (EXP-01 → EXP-10) + 4 LKW (LKW-01 → LKW-04)
- Każdy: id, category, nameDE, maxDimensions, maxWeight, maxPallets, basePrice, pricePerKm, availableServices, features
- **6 usług dodatkowych**: SVC-01 → SVC-06 z cenami i dostępnością (express/lkw)
- **3 okna czasowe**: 6h (free), 3h (+413,82 zł express), Fixzeit (+831,82 zł express)
- Stała `PAYPAL_FEE = 15.99 zł`

### `src/services/pricingEngine.ts` — Silnik kalkulacji
- **`calculatePrice()`** — pełna kalkulacja: basePrice + distance × rate + services + time windows + VAT
  - Zwraca `PricingResult` z breakdown (tablica elementów ceny)
  - Obsługuje Reverse Charge (0% VAT dla B2B EU z USt-ID)
  - Szacuje czas przejazdu (~60 km/h)
- **`quickQuote()`** — uproszczona wycena do Step 1: vehicleId + distanceKm + serviceIds → total
- **`allVehiclePrices()`** — ceny WSZYSTKICH pojazdów dla danego dystansu (do listy w Step 1)
- **`isPricingError()`** — type guard

### `src/routes/calculateV2.ts` — API endpoints
| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/v2/quick-quote` | Szybka wycena (Step 1 przy zmianie pojazdu/serwisów) |
| POST | `/api/v2/calculate` | Pełna kalkulacja z time windows i VAT |
| GET | `/api/v2/vehicle-prices?distanceKm=48` | Ceny wszystkich pojazdów |
| GET | `/api/v2/vehicles` | Lista pojazdów z konfiguracją |
| GET | `/api/v2/services` | Lista usług dodatkowych |
| GET | `/api/v2/time-windows` | Konfiguracja okien czasowych |

## Komendy

```bash
# 1. Rozpakuj
tar xzf palmo-pricing-engine.tar.gz

# 2. Skopiuj
mkdir -p ~/...backend/src/config
cp backend/src/config/pricing.ts ~/...backend/src/config/
cp backend/src/services/pricingEngine.ts ~/...backend/src/services/
cp backend/src/routes/calculateV2.ts ~/...backend/src/routes/

# 3. Zarejestruj route w server.ts (jeśli jeszcze nie ma!)
```

### Krok A: server.ts — dodaj route

```typescript
import calculateV2Routes from './routes/calculateV2';

// Obok istniejących routes:
app.use('/api/v2', calculateV2Routes);
```

**UWAGA:** Jeśli `bookingV2Routes` już jest pod `/api/v2`, to oba routery mogą współistnieć:
```typescript
app.use('/api/v2', calculateV2Routes);  // quick-quote, calculate, vehicles...
app.use('/api/v2', bookingV2Routes);    // booking
```

## Weryfikacja

```bash
# 1. Quick Quote
curl -X POST http://localhost:5000/api/v2/quick-quote \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-01","distanceKm":48,"serviceIds":["SVC-01","SVC-02"]}'

# Oczekiwany wynik:
# {
#   "success": true,
#   "data": {
#     "vehicleBasePrice": 250,
#     "distanceCharge": 168,
#     "servicesTotal": 238,
#     "total": 656,
#     "pricePerKm": 3.5,
#     "vehicleName": "Kleiner Transporter"
#   }
# }

# 2. Full Calculate
curl -X POST http://localhost:5000/api/v2/calculate \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-03","distanceKm":100,"serviceIds":["SVC-01"],"pickupTimeWindowId":"TW-3H"}'

# 3. Vehicle Prices
curl http://localhost:5000/api/v2/vehicle-prices?distanceKm=48

# 4. Vehicles list
curl http://localhost:5000/api/v2/vehicles

# 5. Services list
curl http://localhost:5000/api/v2/services

# 6. Booking (teraz powinien działać bez crasha!)
curl -X POST http://localhost:5000/api/v2/booking \
  -H "Content-Type: application/json" \
  -d '{...payload z frontend...}'
```

## Przykład kalkulacji (weryfikacja ręczna)

**Trzebnica → Wrocław (48 km), Kleiner Transporter, Belade+Entladehilfe, 6h:**
```
Cena bazowa EXP-01:          250,00 zł
Dystans: 48 km × 3,50 zł =   168,00 zł
Beladehilfe (SVC-01):         119,00 zł
Entladehilfe (SVC-02):        119,00 zł
Zeitfenster 6h:                 0,00 zł
──────────────────────────────────────
Gesamtsumme:                  656,00 zł
```
