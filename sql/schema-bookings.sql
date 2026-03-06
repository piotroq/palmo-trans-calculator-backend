-- ============================================================
-- PALMO-TRANS Calculator v2 — Bookings Table Schema
-- Matches bookingService.ts INSERT statement (61 columns)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── BOOKINGS TABLE ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'in_transit', 'delivered', 'cancelled')),

  -- ── Vehicle & Distance ──
  vehicle_id VARCHAR(20) NOT NULL,
  vehicle_category VARCHAR(10) NOT NULL CHECK (vehicle_category IN ('express', 'lkw')),
  distance_km DECIMAL(10,2) NOT NULL,

  -- ── Pricing ──
  vehicle_base_price DECIMAL(10,2) NOT NULL,
  distance_charge DECIMAL(10,2) NOT NULL,
  services_total DECIMAL(10,2) DEFAULT 0,
  time_window_surcharge DECIMAL(10,2) DEFAULT 0,
  vat_rate DECIMAL(5,4) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  transaction_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- ── Shipment (JSON array of packages) ──
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  additional_info TEXT,
  service_ids TEXT[] DEFAULT '{}',

  -- ── Pickup ──
  pickup_company VARCHAR(255),
  pickup_first_name VARCHAR(100) NOT NULL,
  pickup_last_name VARCHAR(100) NOT NULL,
  pickup_street VARCHAR(255) NOT NULL,
  pickup_address_extra VARCHAR(255),
  pickup_country VARCHAR(5) DEFAULT 'PL',
  pickup_postal_code VARCHAR(20) NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  pickup_phone VARCHAR(30) NOT NULL,
  pickup_reference VARCHAR(100),
  pickup_notes TEXT,
  pickup_date DATE NOT NULL,
  pickup_time_window VARCHAR(10),
  pickup_time_slot VARCHAR(50),
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),

  -- ── Delivery ──
  delivery_company VARCHAR(255),
  delivery_first_name VARCHAR(100) NOT NULL,
  delivery_last_name VARCHAR(100) NOT NULL,
  delivery_street VARCHAR(255) NOT NULL,
  delivery_address_extra VARCHAR(255),
  delivery_country VARCHAR(5) DEFAULT 'PL',
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_phone VARCHAR(30) NOT NULL,
  delivery_reference VARCHAR(100),
  delivery_notes TEXT,
  delivery_date DATE NOT NULL,
  delivery_time_window VARCHAR(10),
  delivery_time_slot VARCHAR(50),
  delivery_lat DECIMAL(10,7),
  delivery_lng DECIMAL(10,7),

  -- ── Invoice (Rechnungsadresse) ──
  invoice_email VARCHAR(255) NOT NULL,
  invoice_company VARCHAR(255),
  invoice_salutation VARCHAR(10),
  invoice_first_name VARCHAR(100) NOT NULL,
  invoice_last_name VARCHAR(100) NOT NULL,
  invoice_street VARCHAR(255) NOT NULL,
  invoice_address_extra VARCHAR(255),
  invoice_country VARCHAR(5) DEFAULT 'PL',
  invoice_postal_code VARCHAR(20) NOT NULL,
  invoice_city VARCHAR(100) NOT NULL,
  invoice_phone VARCHAR(30),
  invoice_reference VARCHAR(100),
  invoice_vat_id VARCHAR(30),
  invoice_billing_email VARCHAR(255),

  -- ── Payment ──
  payment_method VARCHAR(30) CHECK (payment_method IN ('rechnung', 'przelewy24', 'paypal', 'kreditkarte')),
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),

  -- ── Timestamps ──
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(invoice_email);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- ─── BOOKING NUMBER SEQUENCE ──────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Function: generuj booking_number w formacie PT-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'PT-' || EXTRACT(YEAR FROM NOW()) || '-' ||
    LPAD(nextval('booking_number_seq')::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: automatycznie generuj booking_number przy INSERT
DROP TRIGGER IF EXISTS trg_booking_number ON bookings;
CREATE TRIGGER trg_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
  EXECUTE FUNCTION generate_booking_number();

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_updated_at ON bookings;
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
