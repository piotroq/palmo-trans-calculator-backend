# PALMO-TRANS — WordPress Buchungen Plugin + Backend Admin Routes

## Pliki

Z archiwum `palmo-wp-bookings-plugin.tar.gz`:

### WordPress Plugin (6 plików)

| Plik | Opis |
|------|------|
| `palmo-bookings.php` | Główny plik pluginu — autoload + activation |
| `includes/class-palmo-api-client.php` | HTTP client do backendu (wp_remote_get/post) |
| `includes/class-palmo-bookings-table.php` | WP_List_Table — tabela zamówień z filtrami |
| `includes/class-palmo-admin-pages.php` | Strony admina: lista + widok szczegółów |
| `includes/class-palmo-dashboard-widget.php` | Widget na WP Dashboard: ostatnie 5 bookingów + stats |
| `includes/class-palmo-settings.php` | Settings > PALMO Buchungen: API URL + connection test |

### Backend (1 plik NOWY)

| Plik | Opis |
|------|------|
| `src/routes/bookingsAdmin.ts` | GET /bookings, GET /bookings/stats, POST /booking/:number/status, GET /booking/:number/full |

## Komendy

### WordPress Plugin

```bash
# 1. Rozpakuj
tar xzf palmo-wp-bookings-plugin.tar.gz

# 2. Skopiuj plugin do WP
cp -r wordpress/palmo-bookings \
  ~/Documents/GitHub/strony/palmo-trans-de-website/src/wp-content/plugins/

# 3. Aktywuj w wp-admin → Wtyczki → PALMO-TRANS Buchungen → Aktywuj

# LUB przez WP-CLI:
wp plugin activate palmo-bookings
```

### Backend

```bash
# 1. Skopiuj route
cp backend/src/routes/bookingsAdmin.ts \
  ~/Documents/GitHub/strony/palmo-trans-calculator-backend/src/routes/

# 2. Zarejestruj w server.ts:
```

**Krok A — server.ts:**
```typescript
import bookingsAdminRoutes from './routes/bookingsAdmin';

// WAŻNE: bookingsAdmin musi być PRZED bookingV2
// bo /bookings i /bookings/stats muszą matchować przed /booking/:number
app.use('/api/v2', bookingsAdminRoutes);
app.use('/api/v2', bookingV2Routes);    // istniejący
app.use('/api/v2', calculateV2Routes);  // istniejący
```

## Co plugin robi

### 1. Menu "Buchungen" w wp-admin (ikona 🚗)
- **Tabela zamówień** z kolumnami: Buchungsnr., Status, Route, Fahrzeug, Summe, Zahlung, Zahlstatus, Erstellt
- **Filtr po statusie**: Alle / Ausstehend / Bestätigt / Unterwegs / Zugestellt / Storniert
- **Search box**: szukaj po numerze, mieście, emailu, nazwisku, firmie
- **Kolorowe status badges**: ⏳ Ausstehend (żółty), ✅ Bestätigt (zielony), 🚚 Unterwegs (niebieski), 📦 Zugestellt (zielony), ❌ Storniert (czerwony)
- **Stats cards** nad tabelą: Gesamt, Ausstehend, Bestätigt, Unterwegs, Zugestellt, Umsatz (złoty kolor)

### 2. Widok szczegółów bookingu
- Klik na numer buchunku → pełne szczegóły w 4-kartkowym grid:
  - **Abholung**: firma, imię, adres, telefon, data, zeitfenster
  - **Zustellung**: j.w.
  - **Rechnungsadresse**: firma, imię, adres, email, USt-ID
  - **Fahrzeug & Preis**: breakdown (basispreis, distanz, services, zuschlag, MwSt, total)
- Tabela **Sendung**: kategoria, opis, wymiary, waga per Packstück
- **Weitere Infos** + **Zeitstempel**

### 3. Dashboard Widget
- Na głównej stronie wp-admin (Dashboard)
- Mini stats: Gesamt / Ausstehend / Umsatz
- Tabela ostatnich 5 bookingów z linkami

### 4. Settings > PALMO Buchungen
- **API URL** — domyślnie `http://localhost:5000`
- **Connection test** — zielony/czerwony box z statusem
- **Lista endpointów** — tabela dostępnych API endpoints

## Backend endpointy (NOWE)

| Method | Endpoint | Query Params | Opis |
|--------|----------|-------------|------|
| GET | `/api/v2/bookings` | `page`, `per_page`, `status`, `search` | Lista z paginacją |
| GET | `/api/v2/bookings/stats` | — | Statystyki (count per status + revenue) |
| POST | `/api/v2/booking/:number/status` | Body: `{ "status": "confirmed" }` | Zmiana statusu |
| GET | `/api/v2/booking/:number/full` | — | Pełne dane bookingu (wszystkie 64 kolumny) |

## Weryfikacja

### Backend:
```bash
# Stats
curl http://localhost:5000/api/v2/bookings/stats

# Lista
curl "http://localhost:5000/api/v2/bookings?page=1&per_page=5"

# Lista z filtrem
curl "http://localhost:5000/api/v2/bookings?status=pending"

# Zmień status
curl -X POST http://localhost:5000/api/v2/booking/PT-2026-00001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

### WordPress:
1. ✅ Aktywuj plugin
2. ✅ Settings > PALMO Buchungen → wpisz API URL → zielony ✅ "Verbindung erfolgreich"
3. ✅ Menu "Buchungen" → lista z booking PT-2026-00001
4. ✅ Klik na numer → szczegóły z 4 kartami
5. ✅ Dashboard → widget "Letzte Buchungen"
6. ✅ Filtrowanie po statusie działa
7. ✅ Search box działa

## Uwagi

- Plugin łączy się z backendem przez HTTP (wp_remote_get). Na produkcji backend powinien być za HTTPS.
- Domyślnie plugin jest dostępny tylko dla `manage_options` (administratorzy).
- Plugin NIE zapisuje danych w bazie WordPress — wszystko pobiera z API backendu.
- Jeśli backend nie jest uruchomiony, plugin pokaże czytelny error message z linkiem do ustawień.
