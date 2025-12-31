#!/usr/bin/env node

/**
 * Generate environment files for different environments
 * Usage: node generate-env.js production|staging|development
 */

const fs = require('fs');
const path = require('path');

const configs = {
  development: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'http://10.0.2.2:8000',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'debug',
      EXPO_PUBLIC_ENVIRONMENT: 'development',
    },
    backend: {
      MONGODB_URL: 'mongodb://localhost:27017',
      DATABASE_NAME: 'heallog_dev',
      JWT_SECRET_KEY: 'dev-secret-key-change-in-production',
      ALLOWED_ORIGINS: 'http://localhost:3000,http://10.0.2.2:3000,http://localhost:8081',
      EMAIL_HOST: 'localhost',
      EMAIL_PORT: '1025',
      ENVIRONMENT: 'development',
      DEBUG: 'true',
    },
  },
  staging: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'https://api-staging.heallog.com',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'info',
      EXPO_PUBLIC_ENVIRONMENT: 'staging',
    },
    backend: {
      MONGODB_URL: 'mongodb+srv://user:pass@cluster.mongodb.net/heallog_staging?retryWrites=true',
      DATABASE_NAME: 'heallog_staging',
      JWT_SECRET_KEY: 'REPLACE_WITH_STAGING_SECRET',
      ALLOWED_ORIGINS: 'https://app-staging.heallog.com,https://dashboard-staging.heallog.com',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'REPLACE_WITH_SENDGRID_API_KEY',
      ENVIRONMENT: 'staging',
      DEBUG: 'false',
    },
  },
  production: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'https://api.heallog.com',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'warn',
      EXPO_PUBLIC_ENVIRONMENT: 'production',
    },
    backend: {
      MONGODB_URL: 'mongodb+srv://user:pass@cluster.mongodb.net/heallog?retryWrites=true',
      DATABASE_NAME: 'heallog',
      JWT_SECRET_KEY: 'REPLACE_WITH_PRODUCTION_SECRET',
      ALLOWED_ORIGINS: 'https://app.heallog.com,https://dashboard.heallog.com',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'REPLACE_WITH_SENDGRID_API_KEY',
      ENVIRONMENT: 'production',
      DEBUG: 'false',
      STRIPE_SECRET_KEY: 'REPLACE_WITH_STRIPE_SECRET_KEY',
      STRIPE_WEBHOOK_SECRET: 'REPLACE_WITH_STRIPE_WEBHOOK_SECRET',
    },
  },
};

function generateEnvFile(environment) {
  if (!configs[environment]) {
    console.error(`Unknown environment: ${environment}`);
    console.log('Available: development, staging, production');
    process.exit(1);
  }

  const config = configs[environment];

  // Generate frontend .env
  const frontendEnvPath = path.join(__dirname, `../frontend/.env.${environment}`);
  const frontendEnv = Object.entries(config.frontend)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(frontendEnvPath, frontendEnv + '\n');
  console.log(`✓ Generated: ${frontendEnvPath}`);

  // Generate backend .env
  const backendEnvPath = path.join(__dirname, `../backend/.env.${environment}`);
  const backendEnv = Object.entries(config.backend)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(backendEnvPath, backendEnv + '\n');
  console.log(`✓ Generated: ${backendEnvPath}`);

  console.log(`\n✓ Environment files generated for: ${environment}`);
  console.log('\n⚠️  Remember to update credentials before deploying!');

  // List placeholders that need to be replaced
  const placeholders = [];
  Object.entries(config.backend).forEach(([key, value]) => {
    if (value.startsWith('REPLACE_')) {
      placeholders.push(`  - ${key}`);
    }
  });

  if (placeholders.length > 0) {
    console.log('\nPlaceholders to replace:');
    console.log(placeholders.join('\n'));
  }
}

// Execute
const environment = process.argv[2] || 'development';
generateEnvFile(environment);
