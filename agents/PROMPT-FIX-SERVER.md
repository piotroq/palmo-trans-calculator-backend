# PALMO-TRANS Backend — Fix: Serwer startuje i natychmiast się zamyka

## Problem

Po uruchomieniu `npm run dev` serwer wypisuje logi startowe, ale natychmiast kończy działanie (prompt wraca):

```
$ npm run dev
> ts-node -P tsconfig.json src/server.ts
[dotenv@17.3.1] injecting env (13) from .env.local
🚀 Server running on http://localhost:5000
📧 Email: 
💳 PayPal Mode: sandbox
$ ← prompt wraca, serwer nie działa
```

Po zakończeniu procesu `curl http://localhost:5000/api/v2/quick-quote` zwraca "Endpoint not found" lub connection refused.

## Kontekst techniczny

- Express 5.2.1 (NIE 4.x!)
- TypeScript z ts-node
- Node.js
- Plik `src/server.ts` zawiera standardowy `app.listen(PORT, () => { console.log(...) })`

## Twoje zadania (wykonaj po kolei):

### 1. Diagnoza
```bash
# Sprawdź wersję Node i Express
node --version
cat package.json | grep express

# Sprawdź czy ts-node kompiluje bez błędów
npx tsc --noEmit

# Sprawdź czy port 5000 nie jest zajęty
lsof -i :5000

# Uruchom z pełnym logowaniem błędów
NODE_OPTIONS='--trace-warnings' npm run dev 2>&1

# Sprawdź czy process się nie kończy
node -e "const app = require('express')(); app.listen(5000, () => console.log('test')); console.log('after listen');"
```

### 2. Prawdopodobne przyczyny (sprawdź każdą):

a) **Express 5 `app.listen` zwraca Promise** — sprawdź czy `app.listen()` w Express 5 wymaga `.then()` lub `await` żeby utrzymać proces

b) **Brak keep-alive** — może ts-node zamyka się bo nie wykrywa aktywnego event loop. Sprawdź:
```typescript
// Dodaj na końcu server.ts:
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
```

c) **Unhandled rejection** — może `dotenv`, `helmet` lub `express-rate-limit` rzuca błąd:
```typescript
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
```

d) **tsconfig.json problem** — sprawdź `"module"`, `"target"`, `"moduleResolution"` — czy kompatybilne z ts-node

### 3. Fix

Na podstawie diagnozy napraw problem. Po naprawie zweryfikuj:

```bash
# Serwer MUSI działać w tle (nie kończyć się)
npm run dev &
sleep 2

# Te oba muszą zwrócić JSON:
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/v2/quick-quote \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-01","distanceKm":48}'

# Oczekiwany wynik quick-quote:
# {"success":true,"data":{"price":418,"vehicleName":"Kleiner Transporter"}}

# Zatrzymaj serwer
kill %1
```

### 4. Dodatkowe testy v2 API

Jeśli serwer działa, przetestuj WSZYSTKIE endpointy:

```bash
curl http://localhost:5000/api/v2/vehicles
curl http://localhost:5000/api/v2/vehicles?category=express
curl http://localhost:5000/api/v2/vehicles?category=lkw
curl http://localhost:5000/api/v2/services
curl http://localhost:5000/api/v2/services?category=express
curl http://localhost:5000/api/v2/time-windows
curl http://localhost:5000/api/v2/shipment-categories
curl http://localhost:5000/api/v2/payment-methods
curl "http://localhost:5000/api/v2/timeslots/$(date -d '+1 day' +%Y-%m-%d)"

# Pełna kalkulacja
curl -X POST http://localhost:5000/api/v2/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "EXP-03",
    "distanceKm": 120,
    "serviceIds": ["SVC-01", "SVC-02"],
    "pickupTimeWindowId": "TW-3H",
    "deliveryTimeWindowId": "TW-6H",
    "isReverseCharge": false
  }'
```

Raportuj wyniki KAŻDEGO testu.

## Pliki do analizy

- `src/server.ts` — główny plik serwera
- `tsconfig.json` — konfiguracja TypeScript
- `package.json` — zależności i skrypty
- `src/routes/calculateV2.ts` — router v2
- `src/services/pricingEngine.ts` — pricing engine
- `src/config/vehicles.ts` — konfiguracja pojazdów
- `src/config/services.ts` — usługi dodatkowe
