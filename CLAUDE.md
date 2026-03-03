# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (ts-node, auto-restart)
npm run dev           # runs src/server.ts via ts-node
npm run dev:watch     # via nodemon (auto-restart on file changes)

# Build & production
npm run build         # tsc → dist/
npm start             # runs dist/server.js

# Type-check without emitting
npx tsc --noEmit

# Database (PostgreSQL via Docker)
docker compose -f docker-compose.postgres.yml up -d
# Schema is auto-applied from sql/schema.sql on first run
# psql access: docker exec -it palmo-postgres psql -U palmo -d palmo_calculator

# Quick smoke tests
curl http://localhost:5000/health
curl http://localhost:5000/api/v2/vehicles?category=express
curl -X POST http://localhost:5000/api/v2/quick-quote \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-01","distanceKm":48}'
# Expected: {"success":true,"data":{"price":418,"vehicleName":"Kleiner Transporter"}}
```

**Environment**: env is loaded from `.env.local` (not `.env`). Copy `.env.example` to `.env.local` and fill in real values. Required vars: `PORT`, `FRONTEND_URL`, `SMTP_*`, `PAYPAL_*`, `GOOGLE_MAPS_API_KEY`.

> ⚠️ `.env.example` currently contains real credentials — these must be rotated and replaced with placeholders.

## Architecture

### Request Flow

```
Client → Express (server.ts)
  → helmet + rateLimit (100 req/15min per IP on /api/)
  → CORS (FRONTEND_URL)
  → Route handlers → Controllers/Services → Response
```

### Route Map

| Route prefix | File | Purpose |
|---|---|---|
| `POST /api/submissions` | `routes/submissions.ts` → `controllers/submissionsController.ts` | v1 legacy booking flow (in-memory) |
| `POST /api/geocode` | `routes/geocode.ts` → `controllers/geocodeController.ts` | Google Maps geocoding proxy |
| `POST /api/payments` | `routes/payments.ts` → `controllers/paymentsController.ts` | PayPal payment processing |
| `POST /api/v2/calculate` | `routes/calculateV2.ts` | v2 full price calculation |
| `POST /api/v2/quick-quote` | `routes/calculateV2.ts` | v2 step-1 quick estimate |
| `GET /api/v2/vehicles` | `routes/calculateV2.ts` | list available vehicles |
| `GET /api/v2/services` | `routes/calculateV2.ts` | list additional services |
| `GET /api/v2/time-windows` | `routes/calculateV2.ts` | list time window options |
| `GET /api/v2/timeslots/:date` | `routes/calculateV2.ts` | available slots for a date |

### v2 Pricing Engine (`src/services/pricingEngine.ts`)

The core calculation module. Formula:

```
subtotal = vehicleBasePrice + (distanceKm × pricePerKm) + servicesTotal + pickupTWSurcharge + deliveryTWSurcharge
vatRate  = isReverseCharge ? 0 : 0.19
total    = subtotal + (subtotal × vatRate)
```

Validation order: vehicle ID → distance > 0 → each service compatible with vehicle category AND vehicle's `availableServices[]` → time window IDs. Returns `PricingResult | PricingError`; use `isPricingError()` to discriminate.

### Configuration Layer (`src/config/`)

All pricing data lives in static TypeScript config files — **no database reads** for pricing:

- **`vehicles.ts`**: `expressVehicles` (EXP-01…EXP-10, up to 1200kg) + `lkwVehicles` (LKW-01…LKW-04, up to 24t). Each vehicle declares its own `availableServices[]` list.
- **`services.ts`**: `additionalServices` (SVC-01…SVC-06), `timeWindows` (TW-6H / TW-3H / TW-FIX), `shipmentCategories`, `paymentMethods`.

Modifying pricing means editing these config files.

### v1 vs v2 — Current State

- **v1** (`/api/submissions`): In-memory `Map<number, DeliverySubmission>` — **no persistence**, data lost on restart. Used for legacy booking creation + email notifications. The `sql/schema.sql` defines a PostgreSQL `bookings` table intended as the v2 persistence layer (not yet wired up).
- **v2** (`/api/v2/`): Stateless calculation only. No DB integration yet; bookings not persisted.

### Error Handling

`src/middleware/errorHandler.ts` exports `ApiError` class and `errorHandler` middleware. Throw `new ApiError(statusCode, message)` from controllers — the middleware catches it and formats the JSON response. Unhandled errors return 500.

### Express 5 Gotchas

This project uses **Express 5** (not 4) — the types differ:

1. `req.params` returns `string | string[]` — always cast: `String(req.params.id)`
2. `req.query` returns `string | string[] | ParsedQs` — cast: `req.query.x as string`
3. Route handlers must be `void` — use `return void res.json(...)` or `res.json(); return;` (don't return the result directly)
4. Error handler requires exactly 4 arguments: `(err, req, res, next)`

### Coding Conventions

- TypeScript strict mode — run `npx tsc --noEmit` before committing
- Use `ApiError` (from `middleware/errorHandler.ts`) for all HTTP errors
- Validate external input with Zod where needed
- All prices in PLN (zł), 2 decimal places via `round2()`
- VAT: 19% standard DE rate, 0% for B2B Reverse Charge (outside Germany)
- Variable/function names: English; inline comments: Polish or English

### Key Patterns

- Routes in `src/routes/` are thin — they validate input and call into `controllers/` or `services/`.
- `calculateV2.ts` is an exception: it does validation and calls `pricingEngine` directly (no separate controller).
- All monetary values are in PLN (złoty), rounded to 2 decimal places via `round2()`.
- Bilingual labels throughout: `name` (Polish/generic) and `nameDE` (German) on every config entity.
