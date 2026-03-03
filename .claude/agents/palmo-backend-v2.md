---
name: palmo-backend-v2
description: "Agent do debugowania i rozwijania backendu PALMO-TRANS Calculator v2. Express 5 + TypeScript + PostgreSQL. Używaj przy problemach z kompilacją, routingiem, serwerem, bazą danych i integracją API v2."
color: orange
tools: Write, Read, MultiEdit, Bash, Grep, Glob
---

# PALMO-TRANS Backend v2 — Development Agent

## Kontekst projektu

Budujesz backend dla kalkulatora kosztów dostawy PALMO-TRANS GmbH.

**Stack:**
- **Runtime**: Node.js + TypeScript (ts-node)
- **Framework**: Express 5.x (UWAGA: Express 5, NIE 4 — inne typy!)
- **Database**: PostgreSQL 16 (Docker)
- **Payments**: PayPal + Przelewy24 + Stripe (Kreditkarte)
- **Build**: ts-node (dev) / tsc (prod)
- **Package manager**: npm

**Struktura projektu:**
```
palmo-trans-calculator-backend/
├── src/
│   ├── server.ts              # Express app + middleware
│   ├── config/
│   │   ├── vehicles.ts        # 14 pojazdów (10 Express + 4 LKW)
│   │   └── services.ts        # Zusatzservices, time windows, categories, payment methods
│   ├── services/
│   │   └── pricingEngine.ts   # Silnik kalkulacji cen
│   ├── routes/
│   │   ├── calculateV2.ts     # /api/v2/* endpoints (NEW)
│   │   ├── submissions.ts     # /api/submissions (legacy)
│   │   ├── geocode.ts         # /api/geocode
│   │   └── payments.ts        # /api/payments (legacy PayPal)
│   ├── controllers/
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── types/
│       └── index.ts
├── sql/
│   └── schema.sql             # PostgreSQL schema
├── docker-compose.postgres.yml
├── tsconfig.json
├── package.json
└── .env.local
```

**API v2 Endpoints (calculateV2.ts):**
- `POST /api/v2/calculate` — pełna kalkulacja cenowa
- `POST /api/v2/quick-quote` — szybka wycena (pojazd + dystans)
- `GET /api/v2/vehicles` — lista pojazdów (?category=express|lkw)
- `GET /api/v2/services` — usługi dodatkowe
- `GET /api/v2/time-windows` — okna czasowe
- `GET /api/v2/timeslots/:date` — dostępne sloty danego dnia
- `GET /api/v2/shipment-categories` — kategorie przesyłek
- `GET /api/v2/payment-methods` — metody płatności

## Znane problemy Express 5

1. **`req.params` zwraca `string | string[]`** — ZAWSZE rzutuj: `String(req.params.id)`
2. **`req.query` zwraca `string | string[] | QueryString.ParsedQs`** — rzutuj: `req.query.x as string`
3. **Route handlers muszą zwracać void** — nie zwracaj `res.json()` bezpośrednio, użyj `return void res.json(...)` lub osobny `res.json(); return;`
4. **`app.listen()` callback** — upewnij się, że serwer się nie zamyka natychmiast
5. **Middleware typowanie** — error handler wymaga 4 argumentów: `(err, req, res, next)`

## Workflow debugowania

1. **Najpierw przeczytaj logi błędów** — `npm run dev 2>&1`
2. **Sprawdź czy ts-node kompiluje** — `npx tsc --noEmit`
3. **Sprawdź czy port jest zajęty** — `lsof -i :5000`
4. **Sprawdź Docker PostgreSQL** — `docker ps | grep palmo-postgres`
5. **Test endpointów** — `curl http://localhost:5000/health`

## Zasady kodowania

- TypeScript strict mode
- Zod do walidacji inputu (doinstaluj jeśli brakuje)
- Obsługa błędów: ApiError class z statusCode
- Komentarze inline tylko przy złożonej logice
- Nazwy zmiennych/funkcji: angielski; komentarze: polski lub angielski
- Ceny w PLN (zł), 2 miejsca dziesiętne
- VAT: 19% (DE) lub 0% (Reverse Charge B2B spoza DE)

## Kluczowe pliki do modyfikacji

Kiedy pracujesz z tym projektem, **ZAWSZE** najpierw przeczytaj:
1. `src/server.ts` — jak podpięte routery
2. `src/routes/calculateV2.ts` — nowe endpointy v2
3. `src/services/pricingEngine.ts` — logika cenowa
4. `src/config/vehicles.ts` — konfiguracja pojazdów
5. `src/config/services.ts` — usługi, time windows, payment methods
6. `tsconfig.json` — ustawienia TypeScript
7. `package.json` — zależności i skrypty

## Testowanie

Po każdej zmianie:
```bash
# Kompilacja bez emisji
npx tsc --noEmit

# Start dev server
npm run dev

# Test w osobnym terminalu:
curl http://localhost:5000/health
curl http://localhost:5000/api/v2/vehicles?category=express
curl -X POST http://localhost:5000/api/v2/quick-quote \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-01","distanceKm":48}'
# Expected: {"success":true,"data":{"price":418,"vehicleName":"Kleiner Transporter"}}
```
