#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PALMO-TRANS v2 — Git Commit & Push
# 
# Zabezpiecza CAŁY kod v2 na GitHub (branch: feature/calculator-v2)
# Uruchom: bash push-v2-to-github.sh
# ═══════════════════════════════════════════════════════════════

set -e  # Stop on first error

FRONTEND_DIR="$HOME/Documents/GitHub/strony/palmo-trans-calculator-frontend"
BACKEND_DIR="$HOME/Documents/GitHub/strony/palmo-trans-calculator-backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  PALMO-TRANS v2 — Git Commit & Push"
echo "════════════════════════════════════════════════════════════"
echo ""

# ─── Funkcja: commit + push jednego repo ──────────────────────

push_repo() {
  local DIR="$1"
  local NAME="$2"
  
  echo -e "${YELLOW}━━━ ${NAME} ━━━${NC}"
  
  if [ ! -d "$DIR" ]; then
    echo -e "${RED}❌ Katalog nie istnieje: $DIR${NC}"
    return 1
  fi
  
  cd "$DIR"
  
  # Sprawdź branch
  BRANCH=$(git branch --show-current)
  echo -e "  Branch: ${GREEN}${BRANCH}${NC}"
  
  if [ "$BRANCH" != "feature/calculator-v2" ]; then
    echo -e "  ${YELLOW}⚠️  Nie jesteś na feature/calculator-v2!${NC}"
    echo -e "  Aktualny branch: $BRANCH"
    read -p "  Kontynuować na tym branchu? (y/n): " CONT
    if [ "$CONT" != "y" ]; then
      echo -e "  ${RED}Pominięto.${NC}"
      return 0
    fi
  fi
  
  # Pokaż status
  echo ""
  echo "  Git status:"
  git status --short | head -30
  
  CHANGES=$(git status --porcelain | wc -l)
  echo ""
  echo -e "  Zmiany: ${YELLOW}${CHANGES} plików${NC}"
  
  if [ "$CHANGES" -eq 0 ]; then
    echo -e "  ${GREEN}✅ Brak zmian do commita.${NC}"
    
    # Sprawdź czy jest coś do pusha
    UNPUSHED=$(git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null | wc -l)
    if [ "$UNPUSHED" -gt 0 ]; then
      echo -e "  ${YELLOW}📤 $UNPUSHED niepushowanych commitów — pushuję...${NC}"
      git push origin "$BRANCH"
      echo -e "  ${GREEN}✅ Push OK${NC}"
    else
      echo -e "  ${GREEN}✅ Wszystko zsynchronizowane.${NC}"
    fi
    return 0
  fi
  
  # Stage all
  git add -A
  
  # Commit z opisowym message
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  COMMIT_MSG="feat(v2): Calculator v2 — Phase 1-7 complete

Phase 1: Backend foundation (PostgreSQL, API v2 routes)
Phase 2: Step 1 Preis UI (vehicles, services, addresses, date)
Phase 3: Step 2 Sendung (multi-package form, sidebar)
Phase 4: Steps 3-4 Abholung/Zustellung (address forms, time windows)
Phase 5-6: Steps 5-6 Rechnung/Zahlung (invoice, payment, review)
Phase 7: Booking flow (POST /api/v2/booking, confirmation screen)
Pricing: PricingEngine + QuickQuote + CalculateV2 routes

14 vehicles (10 Express + 4 LKW), 6 services, 3 time windows
PostgreSQL 64-column bookings table, PT-YYYY-NNNNN generator
Email notifications (customer HTML + admin plain text)

Committed: $TIMESTAMP"

  git commit -m "$COMMIT_MSG"
  echo -e "  ${GREEN}✅ Commit OK${NC}"
  
  # Push
  echo -e "  ${YELLOW}📤 Pushing to origin/$BRANCH...${NC}"
  git push origin "$BRANCH" 2>&1 || {
    echo -e "  ${YELLOW}⚠️  Push failed — próbuję set-upstream...${NC}"
    git push --set-upstream origin "$BRANCH" 2>&1
  }
  echo -e "  ${GREEN}✅ Push OK${NC}"
  
  # Pokaż ostatni commit
  echo ""
  echo "  Ostatni commit:"
  git log --oneline -1
  echo ""
}

# ─── Backend ──────────────────────────────────────────────────

push_repo "$BACKEND_DIR" "BACKEND (palmo-trans-calculator-backend)"
echo ""

# ─── Frontend ─────────────────────────────────────────────────

push_repo "$FRONTEND_DIR" "FRONTEND (palmo-trans-calculator-frontend)"
echo ""

# ─── Podsumowanie ─────────────────────────────────────────────

echo "════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ GOTOWE — Kod v2 zabezpieczony na GitHub!${NC}"
echo ""
echo "  Sprawdź na GitHub:"
echo "  → https://github.com/piotroq/palmo-trans-calculator-backend/tree/feature/calculator-v2"
echo "  → https://github.com/piotroq/palmo-trans-calculator-frontend/tree/feature/calculator-v2"
echo "════════════════════════════════════════════════════════════"
echo ""
