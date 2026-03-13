#!/bin/bash
# ============================================
# SENTINEL — Update Script
# Run on VPS after git pull: bash deploy/update.sh
# ============================================

set -e

cd /opt/sentinel

echo "=============================="
echo "  SENTINEL — Update"
echo "=============================="

echo ""
echo "[1/4] Pulling latest code..."
git pull

echo ""
echo "[2/4] Building backend..."
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
cd ..

echo ""
echo "[3/4] Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "[4/4] Restarting PM2..."
pm2 restart sentinel-api

echo ""
echo "=============================="
echo "  Update complete!"
echo "=============================="
echo "  Check logs: pm2 logs sentinel-api"
echo ""
