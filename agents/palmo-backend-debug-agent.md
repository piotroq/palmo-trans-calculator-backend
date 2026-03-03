# PALMO Backend Debug & Test Agent

## Dla: Qwen3-Coder via Qwen Code

**Cel:** Autonomiczny debug, test i naprawa pipeline'u danych: Frontend → Backend → WordPress

---

## 🎯 FAZA 1: ANALIZA & DIAGNOSTIC

### 1.1 Przeszukaj Repozytoria GitHub

```bash
# Pobierz wszystkie repozytorium lokalnie
cd ~/Documents/GitHub/strony

# Analizuj strukturę
find . -name "*.ts" -o -name "*.tsx" -o -name "*.php" | grep -E "(palmo|calculator)" | head -20

# Sprawdź package.json wszystkich projektów
find . -name "package.json" -exec grep -l "palmo" {} \;

# Analiza Node.js wersji
node --version && npm --version
```

### 1.2 Oficjalne Dokumentacje do Sprawdzenia

- [ ] Express.js documentation: https://expressjs.com/
- [ ] TypeScript docs: https://www.typescriptlang.org/docs/
- [ ] PayPal Checkout docs: https://developer.paypal.com/docs/checkout/
- [ ] Node.js best practices: https://nodejs.org/en/docs/
- [ ] WordPress REST API: https://developer.wordpress.org/rest-api/
- [ ] Nodemailer docs: https://nodemailer.com/

### 1.3 Diagnoza Bieżącego Stanu

```bash
# Backend health check
curl -v http://localhost:5000/health

# API endpoints test
curl -v http://localhost:5000/api/submissions
curl -v http://localhost:5000/api/submissions?limit=10

# WordPress REST API check
curl -v http://localhost:8088/wp-json/palmo/v1/submissions

# Network connectivity
ping localhost
netstat -tuln | grep -E "5000|8088|3306"

# Log analysis
tail -100 ~/.pm2/logs/*.log 2>/dev/null || echo "PM2 not configured"
```

---

## 🚀 FAZA 2: REPOZYTORIA ANALYSIS

### 2.1 Frontend Analysis

```
Path: ~/Documents/GitHub/strony/palmo-trans-calculator-frontend/
- Sprawdź: src/pages/WizardStep3.tsx (PayPal integration)
- Sprawdź: src/services/api.ts (API calls)
- Sprawdź: .env.local (API URL config)
- Sprawdź: vite.config.ts (build config)
```

### 2.2 Backend Analysis

```
Path: ~/Documents/GitHub/strony/palmo-trans-calculator-backend/
- Sprawdź: src/server.ts (routes registration)
- Sprawdź: src/routes/submissions.ts (POST /submissions)
- Sprawdź: src/controllers/submissionsController.ts (logic)
- Sprawdź: src/services/emailService.ts (email sending)
- Sprawdź: .env.local (config, SMTP, PayPal)
- Sprawdź: tsconfig.json (compilation)
```

### 2.3 WordPress Plugin Analysis

```
Path: ~/Documents/GitHub/strony/palmo-trans-de-website/src/wp-content/plugins/palmo-delivery-manager/
- Sprawdź: palmo-delivery-manager.php (main plugin file)
- Sprawdź: includes/sync.php (synchronization logic)
- Sprawdź: includes/rest-api.php (REST endpoints)
- Sprawdź: admin/admin-page.php (admin interface)
```

---

## 🔍 FAZA 3: TESTING PROTOCOL

### 3.1 Unit Tests Backend

```bash
npm run dev &
PID=$!

# Test 1: Server starts
sleep 3
curl http://localhost:5000/health

# Test 2: GET submissions endpoint
curl http://localhost:5000/api/submissions

# Test 3: POST submission (mock data)
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "Berlin, Germany",
    "pickupCoords": {"lat": 52.52, "lng": 13.41},
    "deliveryAddress": "Warsaw, Poland",
    "deliveryCoords": {"lat": 52.23, "lng": 21.01},
    "weight": 15,
    "serviceType": "express",
    "additionalServices": {"insurance": true, "signatureRequired": false},
    "estimatedDistance": 350000,
    "estimatedDuration": 14400,
    "estimatedPrice": 245.50,
    "contactEmail": "test@example.com",
    "contactPhone": "+48123456789",
    "notes": "Test submission"
  }'

kill $PID
```

### 3.2 Integration Tests

```bash
# Test: Frontend → Backend → DB
npm run dev &
# W osobnym terminalu:
npm run dev (frontend w palmo-trans-calculator-frontend)
# W przeglądarce: http://localhost:5173
# Wypełnij formularz krok po kroku
# Sprawdź console browser (F12) na błędy
# Sprawdź backend logs na STDOUT
```

### 3.3 Sync Tests

```bash
# Test: Backend → WordPress
# 1. Backend musi mieć dane
# 2. WordPress admin: http://localhost:8088/wp-admin/?page=palmo-delivery
# 3. Kliknij: 🔄 Synchronizuj Dane
# 4. Sprawdź tabele czy dane się pojawiły
# 5. Sprawdź MySQL bezpośrednio:
docker compose exec mysql mysql -u palmotrans_user -pPalmoTrans2024Secure palmotrans_local -e "SELECT COUNT(*) FROM wp_palmo_submissions;"
```

---

## 🐛 FAZA 4: DEBUGGING CHECKLIST

### Problem 1: Dane Nie Spływają z Frontendu

```
[ ] Sprawdzić VITE_API_URL w .env.local (frontend)
[ ] Sprawdzić CORS headers w backend (server.ts)
[ ] Sprawdzić czy backend słucha na porcie 5000
[ ] Sprawdzić network tab w F12 (browser)
[ ] Sprawdzić response status (200, 500, timeout?)
[ ] Sprawdzić backend logs (error message)
[ ] Sprawdzić czy POST data jest prawidłowa
```

### Problem 2: Dane Nie Synchronizują się do WordPress

```
[ ] Sprawdzić czy GET /api/submissions zwraca dane
[ ] Sprawdzić czy WordPress może się połączyć z backend
[ ] Sprawdzić CORS dla WordPress (if cross-origin)
[ ] Sprawdzić database.php (insert logic)
[ ] Sprawdzić wp_palmo_submissions table schema
[ ] Sprawdzić WordPress REST API permissions
[ ] Sprawdzić sync.php (request handling)
```

### Problem 3: Email Notifications

```
[ ] Sprawdzić MailHog: http://localhost:8025
[ ] Sprawdzić .env.local SMTP config
[ ] Sprawdzić nodemailer service
[ ] Sprawdzić czy email service się inicjalizuje
[ ] Sprawdzić czy email jest wysyłany (logs)
```

---

## 💾 FAZA 5: FIXES & IMPROVEMENTS

### 5.1 Logi & Error Handling

```typescript
// Dodaj do server.ts
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  res.status(500).json({ error: err.message });
});
```

### 5.2 Database Logging

```sql
-- Sprawdzaj dane w WordPress:
SELECT id, reference_number, status, created_at FROM wp_palmo_submissions ORDER BY created_at DESC LIMIT 5;

-- Sprawdzaj struktura:
DESCRIBE wp_palmo_submissions;

-- Sprawdzaj czy tabela istnieje:
SHOW TABLES LIKE 'wp_palmo%';
```

### 5.3 Request/Response Logging (Frontend)

```typescript
// Dodaj do api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiCall = async (endpoint: string, options = {}) => {
  console.log(`📤 API Request: ${API_URL}${endpoint}`, options);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    console.log(`📥 API Response:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error);
    throw error;
  }
};
```

---

## 🔄 FAZA 6: ITERACYJNE TESTY

### Iteration 1: Verify Setup

```bash
# Co 30 sekund sprawdzaj status
watch -n 30 'curl -s http://localhost:5000/health | jq'
```

### Iteration 2: Data Flow

```bash
# Terminal 1: Backend logs
npm run dev

# Terminal 2: Send test data
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{...}'

# Terminal 3: Check WordPress
curl http://localhost:8088/wp-json/palmo/v1/submissions
```

### Iteration 3: Full E2E

```
1. Frontend: Wypełnij formularz → Submit
2. Backend logs: Sprawdzaj czy request przychodzi
3. Database: SELECT * FROM submissions — są dane?
4. WordPress Sync: 🔄 button → dane w wp_palmo_submissions?
5. Email: MailHog → email wysłany?
```

---

## 📊 SUCCESS CRITERIA

```
✅ Backend /api/submissions returns data
✅ Frontend POST /submissions succeeds (201 or 200)
✅ Data appears in WordPress wp_palmo_submissions table
✅ CSV Export works
✅ Filters work
✅ Status change sends email via MailHog
✅ No errors in browser console (F12)
✅ No errors in backend terminal
✅ MySQL queries execute without errors
```

---

## 🎯 AUTONOMICZNY AGENT - TASKS

Dla Qwen3-Coder do wykonania iteracyjnie:

1. **Setup & Diagnostics** (15 min)
   
   - Uruchom backend: `npm run dev`
   - Sprawdź health endpoint
   - Analizuj logi

2. **Data Flow Testing** (20 min)
   
   - Test POST submission
   - Verify database insert
   - Check WordPress sync

3. **Problem Identification** (15 min)
   
   - Identyfikuj gdzie dane się tracą
   - Sprawdzaj error messages
   - Analizuj request/response

4. **Fixes** (20 min)
   
   - Apply fixes based on findings
   - Commit changes
   - Test again

5. **Documentation** (10 min)
   
   - Write findings
   - Create debug report
   - List recommendations

---

## 🚀 EXECUTION COMMAND

Dla Qwen Code:

```
qwen execute \
  --model qwen3-coder \
  --file /agents/palmo-backend-debug-agent.md \
  --autonomous \
  --iterations 5 \
  --timeout 3600 \
  --repo ~/Documents/GitHub/strony/palmo-trans-calculator-backend
```

---

## 📝 OUTPUTS

Agent powinien wygenerować:

- `debug-report.md` — findings & fixes
- `test-results.json` — test outcomes
- Updated source files (with fixes)
- GitHub commit message
- Recommendations for FAZA 3
