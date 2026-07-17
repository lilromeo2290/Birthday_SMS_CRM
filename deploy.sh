#!/bin/bash
# ============================================
# Birthday SMS CRM — VPS Deployment Setup
# Run this script on your Webuzo VPS after cloning
# Usage: bash deploy.sh
# ============================================

set -e

echo "=========================================="
echo "  Birthday SMS CRM — Deployment Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Check Node.js
echo -e "\n${YELLOW}[1/7] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found! Installing via NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js $(node -v) found${NC}"
fi

# 2. Install PM2 globally
echo -e "\n${YELLOW}[2/7] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 installed${NC}"
else
    echo -e "${GREEN}PM2 $(pm2 -v) already installed${NC}"
fi

# 3. Install dependencies
echo -e "\n${YELLOW}[3/7] Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}Dependencies installed${NC}"

# 4. Generate Prisma client
echo -e "\n${YELLOW}[4/7] Setting up database...${NC}"
npx prisma generate
mkdir -p db
npx prisma db push
echo -e "${GREEN}Database ready${NC}"

# 5. Seed admin user
echo -e "\n${YELLOW}[5/7] Creating admin user...${NC}"
npx tsx scripts/seed-clean.ts
echo -e "${GREEN}Admin user created${NC}"

# 6. Build Next.js
echo -e "\n${YELLOW}[6/7] Building application...${NC}"
npm run build
echo -e "${GREEN}Build complete${NC}"

# 7. Generate JWT secret
echo -e "\n${YELLOW}[7/7] Generating JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create production .env
cat > .env << ENVEOF
DATABASE_URL=file:$(pwd)/db/custom.db
JWT_SECRET=$JWT_SECRET
PORT=3000
NEXT_PUBLIC_APP_URL=
ENVEOF

# Update PM2 config with actual path and secret
sed -i "s|/home/birthday-crm|$(pwd)|g" ecosystem.config.js
sed -i "s|CHANGE-THIS-TO-A-LONG-RANDOM-STRING|$JWT_SECRET|g" ecosystem.config.js

echo -e "${GREEN}JWT secret generated and saved to .env${NC}"

echo -e "\n=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}To start the app:${NC}"
echo "  pm2 start ecosystem.config.js"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  pm2 logs birthday-crm"
echo ""
echo -e "${YELLOW}To stop the app:${NC}"
echo "  pm2 stop birthday-crm"
echo ""
echo -e "${YELLOW}To restart after changes:${NC}"
echo "  pm2 restart birthday-crm"
echo ""
echo -e "${RED}IMPORTANT: Set your domain in .env (NEXT_PUBLIC_APP_URL)${NC}"
echo -e "${RED}and configure Nginx/SSL in Webuzo to proxy port 3000${NC}"