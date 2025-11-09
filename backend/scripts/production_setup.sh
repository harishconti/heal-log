#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting Production Setup..."

# Navigate to the backend directory from the scripts directory
cd "$(dirname "$0")/.."

# --- 1. Install Dependencies ---
echo "📦 Installing production dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "❌ requirements.txt not found!"
    exit 1
fi

# --- 2. Database Migrations/Indexes ---
# Beanie automatically handles index creation on startup.
# This is a placeholder for any future manual migration scripts.
echo "🔄 Running database migrations (if any)..."
# Example: python3 scripts/run_migrations.py
echo "   (No manual migrations to run at this time.)"


# --- 3. Create Initial Admin User ---
# Placeholder for creating an initial admin user.
# You would need to implement a script for this.
echo "👤 Creating initial admin user (placeholder)..."
# Example: python3 -m scripts.create_admin --email admin@example.com --password changeme
echo "   (Manual step: Create admin user via API or a dedicated script.)"


# --- 4. Set up Logging Directories ---
echo "📁 Creating logging directories..."
mkdir -p logs


# --- 5. Verify SSL Certificates ---
# This step is highly dependent on your deployment environment (e.g., Nginx, Caddy).
# Ensure your reverse proxy is configured with valid SSL certificates.
echo "🔐 SSL Certificate verification is a manual step. Please ensure it's configured in your web server/reverse proxy."


echo -e "\n✅ Production setup script completed."
echo "   Next steps:"
echo "   1. Create a '.env.production' file with your production settings."
echo "   2. Start the application using a production-grade server like Gunicorn/Uvicorn."
echo "      Example: uvicorn main:app --host 0.0.0.0 --port 8000"
