module.exports = {
  apps: [
    {
      name: 'birthday-crm',
      script: '.next/standalone/server.js',
      cwd: '/home/birthday-crm',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:/home/birthday-crm/db/custom.db',
        JWT_SECRET: 'CHANGE-THIS-TO-A-LONG-RANDOM-STRING',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};