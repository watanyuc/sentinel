#!/bin/bash
# ============================================
# SENTINEL — VPS Setup Script (Ubuntu 22.04+)
# Run as root: bash setup.sh
# ============================================

set -e

echo "=============================="
echo "  SENTINEL — VPS Setup"
echo "=============================="

# --- 1. System update ---
echo "[1/7] Updating system..."
apt update && apt upgrade -y

# --- 2. Install Node.js 20 LTS ---
echo "[2/7] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node -v) installed"

# --- 3. Install PM2 ---
echo "[3/7] Installing PM2..."
npm install -g pm2

# --- 4. Install Nginx ---
echo "[4/7] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# --- 5. Setup project directory ---
echo "[5/7] Setting up project..."
PROJECT_DIR=/opt/sentinel

if [ ! -d "$PROJECT_DIR" ]; then
  echo "ERROR: Project not found at $PROJECT_DIR"
  echo "Please clone or copy your project first:"
  echo "  git clone YOUR_REPO $PROJECT_DIR"
  exit 1
fi

cd $PROJECT_DIR

# --- Backend ---
echo "  Building backend..."
cd backend
npm install --omit=dev
npm install tsx  # needed for prisma seed
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run build
cd ..

# --- Frontend ---
echo "  Building frontend..."
cd frontend
npm install
npm run build
cd ..

# --- 6. Setup .env (if not exists) ---
if [ ! -f backend/.env ]; then
  echo "[6/7] Creating .env..."
  JWT=$(openssl rand -hex 32)
  cat > backend/.env << EOF
PORT=4000
NODE_ENV=production
JWT_SECRET=$JWT
CORS_ORIGIN=http://$(hostname -I | awk '{print $1}')
DATABASE_URL="file:./sentinel.db"
EOF
  echo "  Generated JWT_SECRET automatically"
else
  echo "[6/7] .env already exists, skipping"
fi

# --- 7. Start with PM2 ---
echo "[7/7] Starting PM2..."
cd $PROJECT_DIR
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# --- Setup Nginx ---
echo ""
echo "Setting up Nginx..."
SERVER_IP=$(hostname -I | awk '{print $1}')
sed "s/YOUR_DOMAIN_OR_IP/$SERVER_IP/" deploy/nginx.conf > /etc/nginx/sites-available/sentinel
ln -sf /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "=============================="
echo "  SENTINEL DEPLOYED!"
echo "=============================="
echo ""
echo "  Dashboard: http://$SERVER_IP"
echo "  API:       http://$SERVER_IP/api/health"
echo "  Login:     admin@sentinel.com / password"
echo ""
echo "  IMPORTANT: Change the admin password immediately!"
echo ""
echo "  Useful commands:"
echo "    pm2 status            — check status"
echo "    pm2 logs sentinel-api — view logs"
echo "    pm2 restart all       — restart"
echo ""
echo "  Optional: Setup SSL with Certbot"
echo "    apt install certbot python3-certbot-nginx"
echo "    certbot --nginx -d YOUR_DOMAIN"
echo ""
