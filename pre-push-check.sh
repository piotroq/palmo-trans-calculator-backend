#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Pre-push safety check — upewnij się że .env NIE jest w repo
# Uruchom PRZED push-v2-to-github.sh
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FRONTEND_DIR="$HOME/Documents/GitHub/strony/palmo-trans-calculator-frontend"
BACKEND_DIR="$HOME/Documents/GitHub/strony/palmo-trans-calculator-backend"

echo ""
echo "🔒 Pre-push safety check"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

check_repo() {
  local DIR="$1"
  local NAME="$2"
  local ISSUES=0
  
  echo -e "\n${YELLOW}$NAME:${NC}"
  
  cd "$DIR" 2>/dev/null || { echo -e "${RED}  ❌ Dir not found${NC}"; return; }
  
  # Sprawdź .gitignore
  if [ ! -f ".gitignore" ]; then
    echo -e "  ${RED}❌ BRAK .gitignore!${NC}"
    ISSUES=1
  else
    echo -e "  ${GREEN}✅ .gitignore istnieje${NC}"
  fi
  
  # Sprawdź czy .env* jest w staged files
  STAGED_ENV=$(git diff --cached --name-only 2>/dev/null | grep -E '\.env' || true)
  TRACKED_ENV=$(git ls-files 2>/dev/null | grep -E '\.env' || true)
  
  if [ -n "$STAGED_ENV" ] || [ -n "$TRACKED_ENV" ]; then
    echo -e "  ${RED}❌ UWAGA: .env plik jest trackowany!${NC}"
    echo -e "  ${RED}   Pliki: $STAGED_ENV $TRACKED_ENV${NC}"
    echo -e "  ${YELLOW}   FIX: git rm --cached .env.local && echo '.env*' >> .gitignore${NC}"
    ISSUES=1
  else
    echo -e "  ${GREEN}✅ .env nie jest trackowany${NC}"
  fi
  
  # Sprawdź czy node_modules nie jest trackowany
  TRACKED_MODULES=$(git ls-files 2>/dev/null | grep -c 'node_modules/' || true)
  if [ "$TRACKED_MODULES" -gt 0 ]; then
    echo -e "  ${RED}❌ node_modules jest trackowany!${NC}"
    ISSUES=1
  else
    echo -e "  ${GREEN}✅ node_modules wykluczone${NC}"
  fi
  
  # Pokaż ile plików do commita
  CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
  echo -e "  📊 Pliki do commita: ${YELLOW}${CHANGES}${NC}"
  
  # Pokaż nowe pliki v2
  echo -e "  📁 Nowe/zmodyfikowane pliki v2:"
  git status --short 2>/dev/null | grep -E '(V2|v2|wizard|booking|pricing|shipment|scheduling)' | head -20 || echo "    (brak plików v2 w zmianach)"
  
  if [ "$ISSUES" -eq 0 ]; then
    echo -e "  ${GREEN}✅ Wszystko OK — bezpiecznie do pusha${NC}"
  fi
}

check_repo "$BACKEND_DIR" "BACKEND"
check_repo "$FRONTEND_DIR" "FRONTEND"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Jeśli wszystko ${GREEN}✅${NC}, uruchom:"
echo "  bash push-v2-to-github.sh"
echo ""
