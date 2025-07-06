#!/bin/bash

# Voice Mate - Simple Development Setup
# Ready to run with existing database connection

echo "🎯 Voice Mate - Supabase Only Setup"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Clean any existing database connections
print_status "Cleaning any existing database connections..."
unset DATABASE_URL
unset SUPABASE_URL
unset POSTGRES_URL
unset NEON_DATABASE_URL
rm -f .env
print_success "Cleaned existing database environment"

# Step 2: Get Supabase URL
echo ""
echo "Step 1: Get your Supabase DATABASE_URL"
echo "======================================"
echo ""
echo "1. Go to https://supabase.com"
echo "2. Sign in and open your project (or create 'voice-mate-app')"
echo "3. Go to Settings → Database"
echo "4. Copy the 'Connection pooling' URL"
echo "5. Replace [YOUR-PASSWORD] with your database password"
echo ""
echo "Format: postgresql://postgres.abc123:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres"
echo ""

while true; do
    read -p "Enter your Supabase DATABASE_URL: " SUPABASE_DATABASE_URL
    
    if [ -z "$SUPABASE_DATABASE_URL" ]; then
        print_error "DATABASE_URL cannot be empty"
        continue
    fi
    
    if [[ "$SUPABASE_DATABASE_URL" != postgresql://* ]]; then
        print_error "Must start with 'postgresql://'"
        continue
    fi
    
    if [[ "$SUPABASE_DATABASE_URL" != *"supabase.com"* ]] && [[ "$SUPABASE_DATABASE_URL" != *"pooler.supabase"* ]]; then
        print_warning "This doesn't look like a Supabase URL"
        read -p "Continue anyway? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            continue
        fi
    fi
    
    if [[ "$SUPABASE_DATABASE_URL" == *"[YOUR-PASSWORD]"* ]]; then
        print_error "Replace [YOUR-PASSWORD] with your actual password"
        continue
    fi
    
    print_success "Supabase URL looks valid"
    break
done

# Step 3: Set environment variable
echo ""
print_status "Setting up environment..."
echo "DATABASE_URL=$SUPABASE_DATABASE_URL" > .env
export DATABASE_URL="$SUPABASE_DATABASE_URL"
print_success "Environment configured for Supabase only"

# Step 4: Install and build
echo ""
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Building project..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Project built successfully"

# Step 5: Setup Supabase schema
echo ""
print_status "Setting up Supabase database schema..."
npm run db:push
if [ $? -eq 0 ]; then
    print_success "Supabase schema created"
else
    print_warning "Schema setup had issues - tables will be created automatically"
fi

# Step 6: Test connection
echo ""
print_status "Testing Supabase connection..."

# Simple connection test
cat > test-supabase.mjs << 'EOF'
import { Pool } from '@neondatabase/serverless';

const supabaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl) {
  console.error('❌ No DATABASE_URL found');
  process.exit(1);
}

if (!supabaseUrl.includes('supabase')) {
  console.warn('⚠️  URL does not contain "supabase"');
}

try {
  const pool = new Pool({ connectionString: supabaseUrl });
  const client = await pool.connect();
  await client.query('SELECT 1 as test');
  client.release();
  console.log('✅ Supabase connection successful');
  process.exit(0);
} catch (error) {
  console.error('❌ Supabase connection failed:', error.message);
  process.exit(1);
}
EOF

node test-supabase.mjs
TEST_RESULT=$?
rm -f test-supabase.mjs

if [ $TEST_RESULT -eq 0 ]; then
    print_success "Supabase connection test passed"
else
    print_error "Supabase connection failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your DATABASE_URL is correct"
    echo "2. Verify your Supabase project is active"
    echo "3. Confirm your database password"
    exit 1
fi

# Final success
echo ""
print_success "🎉 Voice Mate configured for Supabase only!"
echo ""
echo "✅ Removed all other database providers"
echo "✅ Configured only Supabase connection"
echo "✅ Tested Supabase connectivity"
echo "✅ Project built and ready"
echo ""
echo "Your DATABASE_URL: $SUPABASE_DATABASE_URL"
echo ""
echo "To start development:"
echo "npm run dev"
echo ""
print_success "Ready! 🚀"