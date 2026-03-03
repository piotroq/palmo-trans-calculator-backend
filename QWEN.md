# PALMO-TRANS Calculator Backend - Project Context

## Project Overview

This is a **Node.js/Express backend** for a delivery cost calculator application used by PALMO-TRANS GmbH. The backend provides APIs for:

- **Delivery submissions** - Create, retrieve, and manage delivery requests
- **Geocoding** - Convert addresses to coordinates via Google Maps API
- **PayPal payments** - Create and capture payment orders for deliveries
- **Email notifications** - Automated emails to office and customers via Nodemailer

### Tech Stack

- **Runtime:** Node.js with TypeScript (ES2020 target)
- **Framework:** Express.js 5.x
- **Language:** TypeScript 5.9+ with strict mode
- **Module System:** CommonJS
- **Key Dependencies:**
  - `express` - Web framework
  - `cors` - Cross-origin requests
  - `axios` - HTTP client for external APIs
  - `nodemailer` - Email service
  - `dotenv` - Environment configuration
  - `uuid` - Unique reference numbers

## Project Structure

```
palmo-trans-calculator-backend/
├── src/
│   ├── server.ts              # Main entry point
│   ├── config/                # Configuration files (empty)
│   ├── controllers/           # Request handlers
│   │   ├── submissionsController.ts
│   │   ├── geocodeController.ts
│   │   └── paymentsController.ts
│   ├── services/              # Business logic
│   │   ├── emailService.ts    # Nodemailer integration
│   │   └── paypalService.ts   # PayPal API integration
│   ├── routes/                # Express routers
│   │   ├── submissions.ts
│   │   ├── geocode.ts
│   │   └── payments.ts
│   ├── middleware/            # Custom middleware
│   │   └── errorHandler.ts    # Error handling
│   └── types/                 # TypeScript types
│       └── index.ts           # DeliverySubmission interface
├── uploads/                   # File uploads directory
├── .env.example               # Environment variables template
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Building and Running

### Prerequisites

- Node.js (version compatible with the dependencies)
- `.env.local` file configured (see `.env.example`)

### Development

```bash
# Install dependencies
npm install

# Run in development mode with ts-node
npm run dev

# Alternative: watch mode with nodemon
npm run dev:watch
```

### Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start the compiled server
npm start
```

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=PALMO-TRANS <your_email@gmail.com>

# PayPal (Sandbox)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_api_key

# Logging
LOG_LEVEL=debug
```

## API Endpoints

### Submissions (`/api/submissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all submissions |
| POST | `/` | Create new delivery submission |
| GET | `/:referenceNumber` | Get submission by reference number |
| GET | `/email/:email` | Get submissions by customer email (last 10) |
| PATCH | `/:id/status` | Update submission status |

### Geocoding (`/api/geocode`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Geocode address to coordinates |

### Payments (`/api/payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-order` | Create PayPal order |
| POST | `/capture` | Capture PayPal payment |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Development Conventions

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- **ES2020** target with CommonJS modules
- Output to `./dist`, source from `./src`
- Declaration maps and source maps enabled for debugging

### Code Style

- Controllers use **static methods** for route handlers
- Services handle external API integrations (PayPal, email)
- Custom `ApiError` class for consistent error handling
- In-memory storage using `Map` (mock database - intended for future DB integration)

### Error Handling

- Custom `ApiError` class with status codes
- Global error handler middleware in `errorHandler.ts`
- Detailed errors in development, generic in production

### Email Service

- Sends confirmation emails to both office (`biuro@palmo-trans.com`) and customers
- HTML-formatted emails with submission details
- Reference numbers in format: `PTR-{timestamp}-{uuid}`

## Key Business Logic

### Delivery Submission Flow

1. Customer submits delivery request via frontend
2. Backend generates unique reference number
3. Emails sent to office and customer
4. Submission stored in-memory (to be replaced with database)
5. Customer can check status via reference number or email

### Payment Flow

1. Create PayPal order with submission ID and amount
2. Customer redirected to PayPal for payment
3. Capture payment upon return
4. Update submission payment status

## Notes

- **In-memory storage:** Currently uses `Map` for submissions (data lost on restart)
- **Future improvements:** Database integration needed for persistence
- **Polish language:** UI messages and email content are in Polish
- **Frontend:** Designed to work with a Vite-based frontend on port 5173

## Debug & Testing

### Debug Agent

A debug agent configuration exists in `agents/palmo-backend-debug-agent.md` for autonomous debugging of the data pipeline: Frontend → Backend → WordPress Sync.

### Quick Health Checks

```bash
# Server health
curl http://localhost:5000/health

# Get all submissions
curl http://localhost:5000/api/submissions

# Test POST submission
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress":"Berlin","deliveryAddress":"Warsaw","weight":15,"serviceType":"standard","contactEmail":"test@test.com","contactPhone":"123456789","pickupCoords":{"lat":52.52,"lng":13.41},"deliveryCoords":{"lat":52.23,"lng":21.01},"estimatedDistance":100000,"estimatedDuration":3600,"estimatedPrice":100}'
```

### Common Issues Checklist

| Problem | Check |
|---------|-------|
| CORS errors | Verify `cors()` middleware is before routes in `server.ts` |
| 404 on routes | Check route registration in `server.ts` |
| Data lost on restart | Mock DB uses in-memory `Map` |
| Email not sending | Verify SMTP config in `.env.local` |
| PayPal errors | Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` |

### Related Projects

- **Frontend:** `~/Documents/GitHub/strony/palmo-trans-calculator-frontend`
- **WordPress:** `~/Documents/GitHub/strony/palmo-trans-de-website` (includes sync plugin)
