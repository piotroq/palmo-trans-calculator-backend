# PALMO-TRANS — Plan Rozbudowy Kalkulatora Kosztów Dostawy

> **Wersja:** 1.0 | **Data:** 03.03.2026 | **Autor:** Piotr + Claude AI  
> **Cel:** Rozbudowa kalkulatora do poziomu funkcjonalności zbliżonego do Zipmend Express

---

## 1. Analiza stanu obecnego vs cel docelowy

### Co mamy teraz (PALMO-TRANS Calculator v1)

**Frontend** (React + Vite + TypeScript + Tailwind + Zustand):

- 3-krokowy wizard: Adres → Szczegóły → Płatność
- Geocoding przez backend (Google Maps API)
- Prosta kalkulacja: `baseFee + (distanceKm × perKmFee) × weightMultiplier × expressMultiplier`
- PayPal jako jedyna metoda płatności
- Zustand do state management

**Backend** (Node.js + Express + TypeScript):

- `/api/geocode` — geocoding adresów
- `/api/calculate` — kalkulacja ceny
- `/api/payment` — PayPal integration
- `/api/notify` — email (nodemailer)

**Brakuje:**

- Wybór typu pojazdu (10 opcji Express + 4 opcje LKW)
- Usługi dodatkowe (Zusatzservices) z cenami
- Wielokrokowy wizard (6 kroków jak Zipmend)
- Formularz sendung (kategoria, wymiary, waga, ilość, stackable)
- Formularz Abholung/Zustellung (pełne dane adresowe)
- Formularz Rechnungsadresse (dane do faktury, USt-ID)
- Wybór okna czasowego (6h/3h/Fixzeit)
- Kalendarz dat
- Podsumowanie zamówienia w sidebarze

### Cel docelowy (wzorowany na Zipmend)

6-krokowy wizard:

1. **Preis** — Adresy, typ pojazdu, Zusatzservices, data, cena
2. **Sendung** — Kategoria przesyłki, wymiary, waga
3. **Abholung** — Dane nadawcy, okno czasowe odbioru
4. **Zustellung** — Dane odbiorcy, okno czasowe dostawy
5. **Rechnungsadresse** — Dane do faktury
6. **Zahlung** — Podsumowanie + płatność

---

## 2. Architektura rozwiązania

### 2.1 Frontend — nowa struktura komponentów

```
src/
├── components/
│   ├── wizard/
│   │   ├── WizardLayout.tsx          # Główny layout z krokami + sidebar
│   │   ├── WizardStepIndicator.tsx   # Pasek postępu (6 kroków)
│   │   ├── WizardSidebar.tsx         # Übersicht — podsumowanie po prawej
│   │   └── steps/
│   │       ├── Step1Price.tsx         # Adresy + pojazd + Zusatz + data
│   │       ├── Step2Shipment.tsx      # Sendung eingeben
│   │       ├── Step3Pickup.tsx        # Abholung eingeben
│   │       ├── Step4Delivery.tsx      # Zustellung eingeben
│   │       ├── Step5Invoice.tsx       # Rechnungsadresse
│   │       └── Step6Payment.tsx       # Podsumowanie + płatność
│   ├── vehicles/
│   │   ├── VehicleSelector.tsx        # Lista pojazdów (radio buttons)
│   │   ├── VehicleCard.tsx            # Pojedynczy pojazd z detalami
│   │   └── VehicleTypeToggle.tsx      # Express / LKW toggle
│   ├── services/
│   │   └── AdditionalServices.tsx     # Checkboxy Zusatzservices
│   ├── shipment/
│   │   ├── ShipmentForm.tsx           # Formularz paczki
│   │   ├── CategorySelector.tsx       # Palette, Dokument, Paket...
│   │   └── PackageList.tsx            # Lista wielu paczek
│   ├── address/
│   │   ├── AddressForm.tsx            # Reusable formularz adresu
│   │   ├── CountrySelector.tsx        # Dropdown z krajami
│   │   └── PostalCodeInput.tsx        # Walidacja kodu pocztowego
│   ├── scheduling/
│   │   ├── DatePicker.tsx             # Kalendarz wyboru daty
│   │   ├── TimeWindowSelector.tsx     # 6h / 3h / Fixzeit
│   │   └── TimeSlotPicker.tsx         # Sloty godzinowe
│   ├── payment/
│   │   ├── PaymentMethodSelector.tsx  # Rechnung, P24, PayPal, Karte
│   │   └── InvoiceForm.tsx            # Dane do faktury
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Toggle.tsx
│       ├── Checkbox.tsx
│       └── PriceDisplay.tsx
├── store/
│   ├── useCalculatorStore.ts          # Główny store Zustand
│   ├── slices/
│   │   ├── addressSlice.ts
│   │   ├── vehicleSlice.ts
│   │   ├── shipmentSlice.ts
│   │   ├── scheduleSlice.ts
│   │   ├── servicesSlice.ts
│   │   ├── invoiceSlice.ts
│   │   └── pricingSlice.ts
├── services/
│   ├── api.ts                         # Axios instance
│   ├── pricingService.ts              # Kalkulacja cen
│   ├── geocodingService.ts            # Geocoding
│   └── paymentService.ts              # Płatności
├── types/
│   ├── vehicle.ts
│   ├── shipment.ts
│   ├── address.ts
│   ├── schedule.ts
│   ├── pricing.ts
│   └── payment.ts
├── config/
│   ├── vehicles.ts                    # Definicje pojazdów + ceny bazowe
│   ├── services.ts                    # Definicje Zusatzservices
│   └── categories.ts                  # Kategorie przesyłek
└── utils/
    ├── validators.ts                  # Walidacja formularzy
    ├── formatters.ts                  # Formatowanie cen, dat
    └── calculations.ts                # Pomocnicze kalkulacje
```

### 2.2 Backend — rozszerzony API

```
src/
├── server.ts
├── routes/
│   ├── geocode.ts                     # POST /api/geocode
│   ├── calculate.ts                   # POST /api/calculate (rozbudowany)
│   ├── booking.ts                     # POST /api/booking (nowy)
│   ├── payment.ts                     # POST /api/payment/* (rozbudowany)
│   └── timeslots.ts                   # GET  /api/timeslots (nowy)
├── services/
│   ├── pricingEngine.ts               # Silnik kalkulacji cen
│   ├── geocodingService.ts
│   ├── distanceService.ts             # Google Distance Matrix
│   ├── emailService.ts
│   ├── paymentService.ts              # PayPal
│   └── bookingService.ts              # Zarządzanie bookingami
├── config/
│   ├── vehicles.ts                    # Konfiguracja pojazdów
│   ├── pricing.ts                     # Stawki cenowe
│   └── services.ts                    # Ceny usług dodatkowych
├── types/
│   ├── index.ts
│   ├── vehicle.ts
│   ├── booking.ts
│   └── pricing.ts
├── middleware/
│   ├── validation.ts                  # Zod / express-validator
│   ├── rateLimit.ts
│   └── errorHandler.ts
└── utils/
    ├── logger.ts
    └── helpers.ts
```

---

## 3. Logika cenowa (Pricing Engine)

### 3.1 Formuła główna

```
Cena_końcowa = Cena_bazowa_pojazdu
             + (Dystans_km × Stawka_za_km_pojazdu)
             + Suma(Usługi_dodatkowe)
             + Dopłata_okno_czasowe
             + Dopłata_gabaryt
```

### 3.2 Tabela pojazdów — Express (max. 1200kg)

| ID     | Nazwa                  | Wymiary max (cm) | Waga max (kg) | Cena bazowa (zł) | Stawka/km (zł) |
| ------ | ---------------------- | ---------------- | ------------- | ---------------- | -------------- |
| EXP-01 | Kleiner Transporter    | 160×120×120      | 400           | 250,00           | 3,50           |
| EXP-02 | Mittlerer Transporter  | 320×130×160      | 800           | 300,00           | 3,75           |
| EXP-03 | Großer Transporter     | 420×210×210      | 1200          | 400,00           | 4,50           |
| EXP-04 | Hebebühne und Hubwagen | 420×210×210      | 800           | 450,00           | 4,75           |
| EXP-05 | Länge 450cm            | 450×210×210      | 1200          | 500,00           | 5,15           |
| EXP-06 | Länge 480cm            | 480×210×210      | 1200          | 550,00           | 5,45           |
| EXP-07 | Breite 230cm           | 420×230×210      | 1200          | 530,00           | 5,35           |
| EXP-08 | Höhe 240cm             | 420×210×240      | 1200          | 480,00           | 4,70           |
| EXP-09 | Beladung von oben      | 420×210×210      | 1200          | 650,00           | 6,60           |
| EXP-10 | Gefahrgut              | 420×210×210      | 1200          | 700,00           | 6,75           |

> **UWAGA:** Stawki za km to propozycja. Dokładne stawki powinny zostać uzgodnione z zarządem PALMO-TRANS (Monika Mroczkowska). Cena bazowa pokrywa koszty stałe (wynagrodzenie kierowcy, paliwo minimalne, ubezpieczenie).

### 3.3 Tabela pojazdów — LKW (bis 24t Nutzlast)

| ID     | Nazwa                    | Palety EPAL | Waga max (kg) | Cena bazowa (zł) | Stawka/km (zł) |
| ------ | ------------------------ | ----------- | ------------- | ---------------- | -------------- |
| LKW-01 | 3t Sendung (Planen-LKW)  | 14          | 3000          | 450,00           | 5,25           |
| LKW-02 | 5t Sendung (Planen-LKW)  | 14          | 5000          | 520,00           | 6,05           |
| LKW-03 | 12t Sendung (Planen-LKW) | 18          | 12000         | 620,00           | 7,35           |
| LKW-04 | 24t Sendung (Planen-LKW) | 33          | 24000         | 750,00           | 8,70           |

### 3.4 Usługi dodatkowe (Zusatzservices) — stałe stawki

| ID     | Usługa                       | Cena (zł) | Dostępność    |
| ------ | ---------------------------- | --------- | ------------- |
| SVC-01 | Beladehilfe durch Fahrer     | +119,00   | Express       |
| SVC-02 | Entladehilfe durch Fahrer    | +119,00   | Express       |
| SVC-03 | Neutrale Abholung/Zustellung | +499,00   | Express + LKW |
| SVC-04 | Papierrechnung               | +49,99    | Express + LKW |
| SVC-05 | Beladung von oben            | +399,00   | LKW           |
| SVC-06 | Hebebühne                    | +619,00   | LKW           |

### 3.5 Dopłaty za okno czasowe

| Okno      | Express    | LKW       |
| --------- | ---------- | --------- |
| 6 Stunden | Kostenlos  | Kostenlos |
| 3 Stunden | +413,82 zł | Kostenlos |
| Fixzeit   | +831,82 zł | Kostenlos |

### 3.6 Przykład kalkulacji

**Scenariusz:** Trzebnica → Wrocław (48 km), Kleiner Transporter, Beladehilfe + Entladehilfe, 6h Zeitfenster

```
Cena bazowa:           250,00 zł
Dystans:      48 km × 3,50 zł =  168,00 zł
Beladehilfe:                      119,00 zł
Entladehilfe:                     119,00 zł
Zeitfenster 6h:                     0,00 zł
─────────────────────────────────────────────
Gesamtsumme netto:                656,00 zł
```

### 3.7 TypeScript — Pricing Engine (backend)

```typescript
// src/config/pricing.ts

export interface VehicleConfig {
  id: string;
  category: 'express' | 'lkw';
  name: string;
  maxDimensions: { length: number; width: number; height: number }; // cm
  maxWeight: number; // kg
  maxPallets?: number;
  basePrice: number; // zł
  pricePerKm: number; // zł/km
  availableServices: string[];
  features: string[];
  imageUrl: string;
}

export interface AdditionalService {
  id: string;
  name: string;
  price: number;
  availableFor: ('express' | 'lkw')[];
  description?: string;
}

export interface TimeWindowConfig {
  id: string;
  name: string;
  hours: number;
  surcharge: { express: number; lkw: number };
}

export interface PricingResult {
  vehicleBasePrice: number;
  distanceCharge: number;
  servicesTotal: number;
  timeWindowSurcharge: number;
  subtotal: number;
  vatRate: number; // 0 for Reverse Charge
  vatAmount: number;
  total: number;
  distance: number;
  duration: string;
  breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'distance' | 'service' | 'timeWindow';
}

// src/services/pricingEngine.ts

import { vehicles, additionalServices, timeWindows } from '../config/pricing';

export function calculatePrice(params: {
  vehicleId: string;
  distanceKm: number;
  serviceIds: string[];
  timeWindowId: string;
  isEuCustomer: boolean;
}): PricingResult {
  const vehicle = vehicles.find(v => v.id === params.vehicleId);
  if (!vehicle) throw new Error(`Unknown vehicle: ${params.vehicleId}`);

  const vehicleBasePrice = vehicle.basePrice;
  const distanceCharge = params.distanceKm * vehicle.pricePerKm;

  const selectedServices = params.serviceIds
    .map(id => additionalServices.find(s => s.id === id))
    .filter(Boolean);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s!.price, 0);

  const timeWindow = timeWindows.find(tw => tw.id === params.timeWindowId);
  const timeWindowSurcharge = timeWindow
    ? timeWindow.surcharge[vehicle.category]
    : 0;

  const subtotal = vehicleBasePrice + distanceCharge + servicesTotal + timeWindowSurcharge;

  // 0% USt. for B2B customers outside Germany (Reverse Charge)
  const vatRate = params.isEuCustomer ? 0 : 0.19;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  return {
    vehicleBasePrice,
    distanceCharge,
    servicesTotal,
    timeWindowSurcharge,
    subtotal: Math.round(subtotal * 100) / 100,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    distance: params.distanceKm,
    duration: formatDuration(params.distanceKm),
    breakdown: [
      { label: vehicle.name, amount: vehicleBasePrice, type: 'base' },
      { label: `${params.distanceKm} km × ${vehicle.pricePerKm} zł`, amount: distanceCharge, type: 'distance' },
      ...selectedServices.map(s => ({
        label: s!.name, amount: s!.price, type: 'service' as const
      })),
      ...(timeWindowSurcharge > 0 ? [{
        label: timeWindow!.name, amount: timeWindowSurcharge, type: 'timeWindow' as const
      }] : []),
    ],
  };
}
```

---

## 4. Baza danych — schemat

Potrzebna tabela do przechowywania bookingów. Rekomendacja: **PostgreSQL** (lub MySQL jako minimum).

```sql
-- Tabela zamówień/bookingów
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL, -- np. PT-2026-00001
  status VARCHAR(20) DEFAULT 'pending',       -- pending, confirmed, paid, in_transit, delivered, cancelled

  -- Pricing
  vehicle_id VARCHAR(20) NOT NULL,
  vehicle_category VARCHAR(10) NOT NULL,      -- express / lkw
  distance_km DECIMAL(10,2) NOT NULL,
  vehicle_base_price DECIMAL(10,2) NOT NULL,
  distance_charge DECIMAL(10,2) NOT NULL,
  services_total DECIMAL(10,2) NOT NULL,
  time_window_surcharge DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,4) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Shipment details (JSON)
  packages JSONB NOT NULL,                    -- [{category, name, qty, weight, length, width, height, stackable}]
  additional_info TEXT,
  selected_services TEXT[],                   -- ['SVC-01', 'SVC-02']

  -- Pickup
  pickup_company VARCHAR(255),
  pickup_first_name VARCHAR(100) NOT NULL,
  pickup_last_name VARCHAR(100) NOT NULL,
  pickup_street VARCHAR(255) NOT NULL,
  pickup_address_extra VARCHAR(255),
  pickup_postal_code VARCHAR(20) NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  pickup_country VARCHAR(5) DEFAULT 'DE',
  pickup_phone VARCHAR(30) NOT NULL,
  pickup_reference VARCHAR(100),
  pickup_notes TEXT,
  pickup_date DATE NOT NULL,
  pickup_time_window VARCHAR(20),             -- 6h / 3h / fixzeit
  pickup_time_from TIME,
  pickup_time_to TIME,

  -- Delivery
  delivery_company VARCHAR(255),
  delivery_first_name VARCHAR(100) NOT NULL,
  delivery_last_name VARCHAR(100) NOT NULL,
  delivery_street VARCHAR(255) NOT NULL,
  delivery_address_extra VARCHAR(255),
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_country VARCHAR(5) DEFAULT 'DE',
  delivery_phone VARCHAR(30) NOT NULL,
  delivery_reference VARCHAR(100),
  delivery_notes TEXT,
  delivery_date DATE NOT NULL,
  delivery_time_window VARCHAR(20),
  delivery_time_from TIME,
  delivery_time_to TIME,

  -- Invoice
  invoice_email VARCHAR(255) NOT NULL,
  invoice_company VARCHAR(255),
  invoice_salutation VARCHAR(10),             -- Herr / Frau
  invoice_first_name VARCHAR(100) NOT NULL,
  invoice_last_name VARCHAR(100) NOT NULL,
  invoice_street VARCHAR(255) NOT NULL,
  invoice_address_extra VARCHAR(255),
  invoice_postal_code VARCHAR(20) NOT NULL,
  invoice_city VARCHAR(100) NOT NULL,
  invoice_country VARCHAR(5) DEFAULT 'DE',
  invoice_phone VARCHAR(30),
  invoice_reference VARCHAR(100),
  invoice_vat_id VARCHAR(30),                 -- USt-ID/Steuernr.
  invoice_billing_email VARCHAR(255),

  -- Payment
  payment_method VARCHAR(30),                 -- rechnung, przelewy24, paypal, kreditkarte
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_reference VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,

  -- Coordinates
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),
  delivery_lat DECIMAL(10,7),
  delivery_lng DECIMAL(10,7)
);

CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_number ON bookings(booking_number);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
```

---

## 5. Rekomendacja narzędzi do implementacji

### Porównanie: Claude Code vs Qwen Code vs Git Bash Scripts

| Kryterium                            | Claude Code                                    | Qwen Code                                 | Git Bash Scripts                  |
| ------------------------------------ | ---------------------------------------------- | ----------------------------------------- | --------------------------------- |
| **Kontekst projektu**                | Doskonały — rozumie cały ekosystem PALMO-TRANS | Dobry — wymaga ręcznego podania kontekstu | Brak — czysto mechaniczne skrypty |
| **Jakość kodu TypeScript/React**     | Bardzo wysoka, production-ready                | Wysoka, ale wymaga więcej korekt          | N/A — nie generuje kodu           |
| **Refaktoryzacja istniejącego kodu** | Najlepsza — widzi zależności                   | Dobra — ale trzeba wskazać pliki          | Nie dotyczy                       |
| **Wieloplikowe operacje**            | Tak — może edytować wiele plików naraz         | Tak — podobne możliwości                  | Tak — sed/awk ale ryzykowne       |
| **Testowanie i debug**               | Może uruchomić kod, sprawdzić błędy            | Wymaga ręcznego uruchomienia              | Nie dotyczy                       |
| **Koszt**                            | Wliczony w subskrypcję Claude                  | Darmowy tier ograniczony                  | Darmowy                           |
| **Prędkość pracy**                   | Szybka — iteracyjna                            | Szybka                                    | Wolna — ręczne pisanie            |
| **Ryzyko błędów**                    | Niskie — walidacja w locie                     | Średnie                                   | Wysokie                           |

### Moja rekomendacja: **Claude Code (główne narzędzie) + Git Bash (wsparcie)**

**Dlaczego Claude Code jako główne narzędzie:**

1. **Najlepsze zrozumienie kontekstu** — Claude Code ma pełen kontekst projektu PALMO-TRANS (agents, project knowledge, historia konwersacji)
2. **Wieloplikowa edycja** — może jednocześnie zmodyfikować backend API, frontend components i typy TypeScript
3. **Iteracyjny rozwój** — może uruchomić `npm run dev`, sprawdzić błędy kompilacji i naprawić je w tej samej sesji
4. **Spójność architekturalna** — zachowuje wzorce z istniejącego kodu (Zustand slices, Express middleware)
5. **Testowanie** — może napisać i uruchomić testy

**Gdzie Git Bash się przydaje:**

- Inicjalizacja projektu, instalacja dependencies
- Migracje bazy danych
- Deployment scripts
- CI/CD pipeline

**Gdzie Qwen Code może pomóc:**

- Drugie spojrzenie / code review
- Alternatywne podejścia do UI komponentów
- Tłumaczenia DE/PL/EN

---

## 6. Plan implementacji — kamienie milowe

### Faza 1: Fundament (3-4 dni)

**Backend:**

- [ ] Rozszerzyć konfigurację pojazdów (`config/vehicles.ts`)
- [ ] Zaimplementować Pricing Engine z pełnymi stawkami
- [ ] Dodać endpoint `POST /api/calculate/v2` (nowa logika)
- [ ] Dodać endpoint `GET /api/timeslots/:date` (dostępne sloty)
- [ ] Dodać walidację wejścia (Zod schemas)
- [ ] Setup PostgreSQL + schemat `bookings`

**Frontend:**

- [ ] Stworzyć nowy `WizardLayout.tsx` z 6 krokami
- [ ] Zaimplementować `WizardStepIndicator.tsx`
- [ ] Rozbudować Zustand store o nowe slices
- [ ] Zdefiniować typy TypeScript dla wszystkich encji

### Faza 2: Krok 1 — Preis (2-3 dni)

- [ ] `Step1Price.tsx` — inputy adresowe (Abholung/Zustellung)
- [ ] `VehicleTypeToggle.tsx` — Express / LKW przełącznik
- [ ] `VehicleSelector.tsx` — lista pojazdów z cenami (radio buttons)
- [ ] `AdditionalServices.tsx` — checkboxy Zusatzservices
- [ ] `DatePicker.tsx` — kalendarz wyboru daty
- [ ] Dynamiczna kalkulacja ceny (przeładowanie przy zmianie)
- [ ] "Weitere Fahrzeug-Typen" — rozwijana lista

### Faza 3: Krok 2 — Sendung (1-2 dni)

- [ ] `ShipmentForm.tsx` — formularz paczki
- [ ] `CategorySelector.tsx` — Palette, Dokument, Paket, Komplettes Fahrzeug, Euro Gitterbox, Sonstige
- [ ] Dynamiczne pola: Anzahl, Stapelbar (toggle), Gewicht, Länge, Breite, Höhe
- [ ] "+ Weitere Sendung" — dodawanie wielu paczek
- [ ] Walidacja wymiarów vs wybrany pojazd

### Faza 4: Kroki 3-4 — Abholung + Zustellung (2 dni)

- [ ] `AddressForm.tsx` — reusable formularz (Firma, Vorname, Nachname, Straße, Adresszusatz, PLZ/Ort, Tel, Referenz, Anmerkungen)
- [ ] `TimeWindowSelector.tsx` — 6 Stunden / 3 Stunden / Fixzeit
- [ ] `TimeSlotPicker.tsx` — sloty godzinowe (08:00-14:00 etc.)
- [ ] Dynamiczna zmiana ceny przy zmianie okna czasowego

### Faza 5: Krok 5 — Rechnungsadresse (1 dzień)

- [ ] Formularz: E-Mail, Firma, Anrede, Imię, Nazwisko, Adres, PLZ, Tel, Referenz, USt-ID, Rechnungs-E-Mail
- [ ] Opcja "wie Abholung" / "wie Zustellung" (kopiowanie danych)
- [ ] Walidacja USt-ID (format krajowy)

### Faza 6: Krok 6 — Zahlung + Sidebar (2 dni)

- [ ] `PaymentMethodSelector.tsx` — Rechnung, Przelewy24, PayPal, Kreditkarte
- [ ] Pełne podsumowanie zamówienia
- [ ] `WizardSidebar.tsx` — Übersicht z danymi ze wszystkich kroków
- [ ] Przyciski "Bearbeiten" w sidebarze
- [ ] Integracja PayPal Checkout
- [ ] Integracja Przelewy24 (opcjonalnie)

### Faza 7: Polish + Deploy (2-3 dni)

- [ ] Responsywność (mobile-first)
- [ ] Animacje i transitions między krokami
- [ ] Error handling i user feedback
- [ ] Email notifications (potwierdzenie zamówienia)
- [ ] WordPress admin plugin — lista zamówień
- [ ] Testy end-to-end
- [ ] Deploy na app.palmo-trans.com

**Szacowany czas: 13-17 dni roboczych**

---

## 7. Kolejne kroki

1. **Uzgodnij stawki cenowe z zarządem** — tabele z sekcji 3.2-3.5 to propozycja wyjściowa. Realne stawki za km i ceny bazowe muszą być potwierdzone przez Monikę Mroczkowską.

2. **Zdecyduj o bazie danych** — czy chcemy PostgreSQL (rekomendowane) czy zostajemy przy pliku/JSON? PostgreSQL daje nam solidną podstawę do raportowania i panelu admina.

3. **Zdecyduj o dodatkowych płatnościach** — czy Przelewy24 i Kreditkarte (Stripe) są priorytetem, czy wystarczy na start PayPal + Rechnung?

4. **Rozpocznij implementację z Claude Code** — sklonuj oba repo, otwórz Claude Code i zacznij od Fazy 1 (fundament).

---

## 8. Komendy startowe

```bash
# Klonowanie repozytoriów
git clone https://github.com/piotroq/palmo-trans-calculator-backend.git
git clone https://github.com/piotroq/palmo-trans-calculator-frontend.git

# Backend — nowy branch
cd palmo-trans-calculator-backend
git checkout -b feature/calculator-v2
npm install
# Dodatkowe dependencies:
npm install zod pg @types/pg

# Frontend — nowy branch
cd ../palmo-trans-calculator-frontend
git checkout -b feature/calculator-v2
npm install
# Dodatkowe dependencies:
npm install react-datepicker @types/react-datepicker
npm install -D @tailwindcss/forms

# Uruchomienie Claude Code
claude # w katalogu backend lub frontend
```

---

*Dokument wygenerowany na podstawie analizy 20 screenshotów Zipmend Express, aktualnego kodu PALMO-TRANS oraz project knowledge.*
