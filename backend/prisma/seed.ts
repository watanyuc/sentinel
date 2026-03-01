import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const DEMO_ACCOUNTS = [
  { name: 'Gold Scalper Bot', broker: 'XM Global', accountNumber: '123456', apiKey: 'xm_live_demo_gold_scalper_001', server: 'XM-Real15', currency: 'USD', leverage: 500 },
  { name: 'Grid Trader', broker: 'Exness', accountNumber: '234567', apiKey: 'ex_live_demo_grid_trader_002', server: 'Exness-Real4', currency: 'USD', leverage: 200 },
  { name: 'Trend Follower', broker: 'IC Markets', accountNumber: '345678', apiKey: 'ic_live_demo_trend_follow_003', server: 'ICMarkets-Live02', currency: 'USD', leverage: 1000 },
  { name: 'Martingale Bot', broker: 'FBS', accountNumber: '456789', apiKey: 'fbs_live_demo_martingale_004', server: 'FBS-Real', currency: 'USD', leverage: 3000 },
  { name: 'Hedge Master', broker: 'Pepperstone', accountNumber: '567890', apiKey: 'pp_live_demo_hedge_master_005', server: 'Pepperstone-Live01', currency: 'USD', leverage: 200 },
];

async function main() {
  const passwordHash = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sentinel.com' },
    update: {},
    create: {
      email: 'admin@sentinel.com',
      password: passwordHash,
      name: 'Admin',
      role: 'admin',
    },
  });

  console.log(`[Seed] Admin user: ${admin.email} (${admin.id})`);

  for (const acc of DEMO_ACCOUNTS) {
    const account = await prisma.account.upsert({
      where: { apiKey: acc.apiKey },
      update: {},
      create: {
        ...acc,
        userId: admin.id,
      },
    });
    console.log(`[Seed] Account: ${account.name} (${account.id})`);
  }

  console.log('[Seed] Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
