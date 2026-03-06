# PALMO-TRANS Calculator — Phase 7: Booking Flow + Email Notifications

## Pliki (8 plików, 3 frontend + 5 backend)

Z archiwum `palmo-phase7-booking-flow.tar.gz`:

### Frontend (3 nowe/nadpisane)

| Plik | Lokalizacja | Status |
|------|------------|--------|
| `AppV2.tsx` | `src/` | **NADPISZ** |
| `WizardLayout.tsx` | `src/components/wizard/` | **NADPISZ** |
| `StepZahlung.tsx` | `src/components/wizard/steps/` | **NADPISZ** |
| `BookingConfirmation.tsx` | `src/components/booking/` | **NOWY** |
| `bookingService.ts` | `src/services/` | **NOWY** (frontend) |

### Backend (3 nowe)

| Plik | Lokalizacja | Status |
|------|------------|--------|
| `bookingV2.ts` | `src/routes/` | **NOWY** |
| `bookingService.ts` | `src/services/` | **NOWY** (backend) |
| `bookingEmailService.ts` | `src/services/` | **NOWY** |

## Co się zmieniło

### AppV2.tsx (NADPISANY)
- Nowy state: `confirmed` + `bookingData`
- Po "Jetzt kaufen" sukces → `BookingConfirmation` screen
- "Neue Buchung erstellen" → reset store + wróć do wizarda

### WizardLayout.tsx (NADPISANY)
- Przyjmuje prop `onBookingSuccess`
- Przekazuje go do `StepZahlung` i `PaymentPanel`

### StepZahlung.tsx (NADPISANY)
- `PaymentPanel` teraz wywołuje `submitBooking()` (prawdziwy POST)
- Loading state: spinner + "Buchung wird erstellt..."
- Error handling: parsowanie błędów Zod z backendu, wyświetlanie w red box
- Disabled state na payment methods podczas submita

### BookingConfirmation.tsx (NOWY)
- Animowany ✓ checkmark (scale + opacity transition)
- Booking number display (monospace, yellow-400)
- Detale: Gesamtsumme, Zahlmethode, Status, Erstellt am
- Info box: "Bestätigungs-E-Mail wurde gesendet"
- CTA: "Neue Buchung erstellen" / "Zurück zur Startseite"

### Backend bookingV2.ts (NOWY)
- `POST /api/v2/booking` — tworzy booking w PostgreSQL
- `GET /api/v2/booking/:number` — pobiera booking po numerze
- Zod validation → 400 z detalami
- PostgreSQL error → 503

### Backend bookingService.ts (NOWY)
- Kompletna walidacja Zod (nested: packages, addresses, schedules, invoice)
- Booking number generator: `PT-YYYY-NNNNN` (auto-increment)
- 61-kolumnowy INSERT do tabeli `bookings`
- Zwraca: bookingId, bookingNumber, total, status, createdAt

### Backend bookingEmailService.ts (NOWY)
- `sendBookingConfirmation()` — HTML email do klienta (PALMO-TRANS branded)
- `sendAdminNotification()` — plain text do admina z detalami bookingu
- Nodemailer z SMTP config z .env

## ⚠️ Backend integracja

### Krok A: Zarejestruj route w server.ts

```typescript
import bookingV2Routes from './routes/bookingV2';

// Po istniejących routes:
app.use('/api/v2', bookingV2Routes);
```

### Krok B: Dodaj email dispatch do bookingV2.ts route (po createBooking)

W pliku `src/routes/bookingV2.ts`, po linii `const result = await createBooking(pool, req.body);`:

```typescript
import { sendBookingConfirmation, sendAdminNotification } from '../services/bookingEmailService';

// ... w POST /booking handler, po const result = ...

// Fire-and-forget email (nie blokuje response)
const emailData = {
  booking: result,
  customerEmail: req.body.invoice.email,
  customerName: `${req.body.invoice.firstName} ${req.body.invoice.lastName}`,
  pickupCity: req.body.pickup.address.city || req.body.pickup.address.postalCode,
  deliveryCity: req.body.delivery.address.city || req.body.delivery.address.postalCode,
  vehicleName: req.body.vehicleId,
  pickupDate: req.body.pickup.schedule.date,
  paymentLabel: req.body.paymentMethod,
};
sendBookingConfirmation(emailData).catch(console.error);
sendAdminNotification(emailData).catch(console.error);
```

### Krok C: .env zmienne SMTP

```env
# SMTP (Gmail example — use App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=buchung@palmo-trans.com
ADMIN_EMAIL=kontakt@palmo-trans.com

# PostgreSQL
DATABASE_URL=postgresql://palmo:palmo123@localhost:5432/palmotrans
```

### Krok D: Store — dodaj `reset` action + `pickupCoords`/`deliveryCoords`

W `calculatorStoreV2.ts` dodaj jeśli brak:

```typescript
// State
pickupCoords: { lat: number; lng: number } | null;
deliveryCoords: { lat: number; lng: number } | null;

// Action
reset: () => set(initialState),
```

### Krok E: npm install (backend)

```bash
cd palmo-trans-calculator-backend
npm install zod pg @types/pg nodemailer @types/nodemailer
```

## Komendy

```bash
# 1. Rozpakuj
tar xzf palmo-phase7-booking-flow.tar.gz

# 2. Frontend
cp frontend/src/AppV2.tsx ~/...frontend/src/
cp frontend/src/components/wizard/WizardLayout.tsx ~/...frontend/src/components/wizard/
cp frontend/src/components/wizard/steps/StepZahlung.tsx ~/...frontend/src/components/wizard/steps/
mkdir -p ~/...frontend/src/components/booking
cp frontend/src/components/booking/BookingConfirmation.tsx ~/...frontend/src/components/booking/
cp frontend/src/services/bookingService.ts ~/...frontend/src/services/

# 3. Backend
cp backend/src/routes/bookingV2.ts ~/...backend/src/routes/
cp backend/src/services/bookingService.ts ~/...backend/src/services/
cp backend/src/services/bookingEmailService.ts ~/...backend/src/services/

# 4. Backend: zarejestruj route (Krok A) + email dispatch (Krok B)
# 5. Backend: uzupełnij .env (Krok C)
# 6. npm install (Krok E)

# 7. Uruchom oba serwery
cd backend && npm run dev
cd frontend && npm run dev
```

## Weryfikacja E2E

1. ✅ Przejdź cały wizard (kroki 1-6)
2. ✅ Wybierz "Rechnung" jako payment method
3. ✅ Klik "Jetzt kaufen"
4. ✅ Spinner: "Buchung wird erstellt..."
5. ✅ Po sukcesie → ekran BookingConfirmation
6. ✅ Animowany ✓ + booking number PT-2026-00001
7. ✅ Sprawdź PostgreSQL: `SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;`
8. ✅ Sprawdź email (klient + admin)
9. ✅ "Neue Buchung erstellen" → reset do kroku 1
10. ✅ Druga buchung → booking number PT-2026-00002

### Test error handling:
11. ✅ Wyłącz backend → "Buchung fehlgeschlagen" red box
12. ✅ Brak payment method → "Bitte Zahlmethode wählen"
13. ✅ GET /api/v2/booking/PT-2026-00001 → dane bookingu
