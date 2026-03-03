/**
 * PALMO-TRANS Calculator v2 — Server Integration
 *
 * Ten plik pokazuje jak dodać nowy router v2 do istniejącego server.ts.
 * NIE nadpisuj server.ts — dodaj tylko nowe linie.
 */

// ═══════════════════════════════════════════════════════════════
// W pliku: src/server.ts — DODAJ te importy na górze:
// ═══════════════════════════════════════════════════════════════

// import calculateV2Router from './routes/calculateV2';

// ═══════════════════════════════════════════════════════════════
// W sekcji "Routes" — DODAJ nowy router:
// ═══════════════════════════════════════════════════════════════

// app.use('/api/v2', calculateV2Router);

// ═══════════════════════════════════════════════════════════════
// Nowe zmienne środowiskowe do .env.local:
// ═══════════════════════════════════════════════════════════════

/*
# PostgreSQL
DATABASE_URL=postgresql://palmo:palmo_secret@localhost:5432/palmo_calculator

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Przelewy24
P24_MERCHANT_ID=...
P24_POS_ID=...
P24_CRC=...
P24_API_KEY=...
P24_SANDBOX=true
*/

// ═══════════════════════════════════════════════════════════════
// Nowe dependencies do zainstalowania:
// ═══════════════════════════════════════════════════════════════

/*
Backend:
  npm install pg stripe zod
  npm install -D @types/pg

Frontend:
  npm install react-datepicker lucide-react
  npm install -D @types/react-datepicker
*/

// ═══════════════════════════════════════════════════════════════
// Docker-compose dla PostgreSQL:
// ═══════════════════════════════════════════════════════════════

/*
# docker-compose.postgres.yml

version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: palmo-postgres
    environment:
      POSTGRES_DB: palmo_calculator
      POSTGRES_USER: palmo
      POSTGRES_PASSWORD: palmo_secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

volumes:
  pgdata:
*/

// ═══════════════════════════════════════════════════════════════
// Komendy uruchomieniowe:
// ═══════════════════════════════════════════════════════════════

/*
# 1. Start PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# 2. Zweryfikuj schemat
docker exec -it palmo-postgres psql -U palmo -d palmo_calculator -c "\\dt"

# 3. Backend dev
cd palmo-trans-calculator-backend
npm install
npm run dev

# 4. Frontend dev
cd ../palmo-trans-calculator-frontend
npm install
npm run dev

# 5. Test v2 API
curl -X POST http://localhost:5000/api/v2/quick-quote \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"EXP-01","distanceKm":48}'

# Expected: {"success":true,"data":{"price":418.00,"vehicleName":"Kleiner Transporter"}}

curl http://localhost:5000/api/v2/vehicles?category=express
curl http://localhost:5000/api/v2/services?category=lkw
curl http://localhost:5000/api/v2/time-windows
*/

export {};
