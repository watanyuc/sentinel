#!/bin/bash
# ============================================
# SENTINEL — Update Script
# Run on VPS after git pull: bash deploy/update.sh
# ============================================

set -e

cd /opt/sentinel

echo "[1/4] Pulling latest code..."
git pull

echo "[2/4] Building backend..."
cd backend
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build
cd ..

echo "[3/4] Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "[4/4] Restarting PM2..."
pm2 restart sentinel-api

echo ""
echo "Update complete! Check: pm2 logs sentinel-api"
