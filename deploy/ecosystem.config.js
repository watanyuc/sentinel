// PM2 Ecosystem Config — run with: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'sentinel-api',
      script: './backend/dist/index.js',
      cwd: '/opt/sentinel',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
