#!/bin/bash
# ============================================
# SENTINEL — VPS Setup Script (Ubuntu 22.04+)
# Run as root: bash setup.sh
# ============================================

set -e

DOMAIN="sentinel.fin-tech.com"
PROJECT_DIR="/opt/sentinel"

echo "=============================="
echo "  SENTINEL — VPS Setup"
echo "  Domain: $DOMAIN"
echo "=============================="

# --- 1. System update ---
echo ""
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# --- 2. Install Node.js 20 LTS ---
echo ""
echo "[2/8] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "  Node.js $(node -v) installed"

# --- 3. Install PM2 ---
echo ""
echo "[3/8] Installing PM2..."
npm install -g pm2

# --- 4. Install Nginx + Certbot ---
echo ""
echo "[4/8] Installing Nginx + Certbot..."
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx

# --- 5. Check project ---
echo ""
echo "[5/8] Setting up project..."
if [ ! -d "$PROJECT_DIR" ]; then
  echo "  ERROR: Project not found at $PROJECT_DIR"
  echo "  Please upload your project first:"
  echo "    scp -r ./SENTINEL root@YOUR_VPS_IP:/opt/sentinel"
  echo "  Or clone from git:"
  echo "    git clone YOUR_REPO $PROJECT_DIR"
  exit 1
fi

cd $PROJECT_DIR

# --- 6. Setup .env ---
echo ""
echo "[6/8] Configuring environment..."
if [ ! -f backend/.env ]; then
  echo "  Creating backend/.env..."
  JWT=$(openssl rand -hex 32)
  ENCRYPT_KEY=$(openssl rand -hex 32)
  cat > backend/.env << EOF
PORT=4000
NODE_ENV=production
JWT_SECRET=$JWT
ENCRYPTION_KEY=$ENCRYPT_KEY
CORS_ORIGIN=https://$DOMAIN
DATABASE_URL="file:./sentinel.db"
EOF
  echo "  Generated JWT_SECRET & ENCRYPTION_KEY"
else
  echo "  backend/.env already exists"
  # Update CORS_ORIGIN to use domain with HTTPS
  if grep -q "CORS_ORIGIN" backend/.env; then
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" backend/.env
  else
    echo "CORS_ORIGIN=https://$DOMAIN" >> backend/.env
  fi
fi

# --- 7. Build ---
echo ""
echo "[7/8] Building project..."

# Backend
echo "  Building backend..."
cd $PROJECT_DIR/backend
npm install --omit=dev
npm install tsx  # needed for prisma seed
npx prisma generate
npx prisma db push
npm run build

# Seed only if fresh install (no users in DB)
if [ ! -f "$PROJECT_DIR/backend/sentinel.db" ] && [ -f "$PROJECT_DIR/backend/dev.db" ]; then
  # Production: use sentinel.db name
  echo "  Fresh install — running seed..."
  npx tsx prisma/seed.ts
fi

# Frontend
echo "  Building frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# --- 8. Start services ---
echo ""
echo "[8/8] Starting services..."
cd $PROJECT_DIR

# PM2
pm2 delete sentinel-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/sentinel
ln -sf /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# --- SSL with Certbot ---
echo ""
echo "Setting up SSL certificate..."
echo "  Make sure DNS for $DOMAIN points to this server first!"
echo ""
read -p "  DNS is configured? Proceed with SSL? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
  echo "  SSL certificate installed!"
else
  echo "  Skipping SSL. Run later: certbot --nginx -d $DOMAIN"
fi

echo ""
echo "=============================="
echo "  SENTINEL DEPLOYED!"
echo "=============================="
echo ""
echo "  Dashboard: https://$DOMAIN"
echo "  API:       https://$DOMAIN/api/health"
echo "  Login:     admin@sentinel.com / password"
echo ""
echo "  IMPORTANT: Change the admin password immediately!"
echo ""
echo "  Commands:"
echo "    pm2 status              — check status"
echo "    pm2 logs sentinel-api   — view logs"
echo "    pm2 restart sentinel-api — restart backend"
echo "    bash deploy/update.sh   — deploy updates"
echo ""
