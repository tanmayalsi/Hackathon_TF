#!/bin/bash

# ========================================
# Next.js Outage Dashboard Setup Script
# ========================================

echo ""
echo "========================================"
echo "Next.js Outage Dashboard Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Display Node.js version
echo -e "${GREEN}[INFO] Node.js version:${NC}"
node --version
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed!${NC}"
    exit 1
fi

# Display npm version
echo -e "${GREEN}[INFO] npm version:${NC}"
npm --version
echo ""

# Install dependencies
echo "========================================"
echo "Step 1: Installing Dependencies"
echo "========================================"
echo ""
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Failed to install dependencies!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[SUCCESS] Dependencies installed!${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "========================================"
    echo "Step 2: Creating .env file"
    echo "========================================"
    echo ""

    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}[SUCCESS] .env file created from .env.example${NC}"
        echo ""
        echo -e "${YELLOW}[ACTION REQUIRED] Please edit .env and add your database credentials:${NC}"
        echo ""
        echo "  1. Open .env in a text editor"
        echo "  2. Update DB_PASSWORD with your PostgreSQL password"
        echo "  3. Update DATABASE_URL connection string"
        echo ""
        echo "Press Enter to continue..."
        read
    else
        echo -e "${YELLOW}[WARNING] .env.example not found!${NC}"
        echo "Please create .env manually with your database credentials."
    fi
else
    echo "========================================"
    echo "Step 2: Environment Configuration"
    echo "========================================"
    echo ""
    echo -e "${GREEN}[INFO] .env file already exists${NC}"
    echo ""
fi

# Generate Prisma client
echo "========================================"
echo "Step 3: Generating Prisma Client"
echo "========================================"
echo ""

npx prisma generate

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] Failed to generate Prisma client!${NC}"
    echo "Make sure your DATABASE_URL in .env is correct."
    exit 1
fi

echo ""
echo -e "${GREEN}[SUCCESS] Prisma client generated!${NC}"
echo ""

# Final instructions
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Verify your .env file has correct database credentials"
echo "2. Make sure PostgreSQL is running"
echo "3. Start the development server with:"
echo ""
echo "   npm run dev"
echo ""
echo "4. Open your browser to: http://localhost:3000"
echo ""
echo "For more information, see:"
echo "- README.md (full documentation)"
echo "- QUICKSTART.md (quick start guide)"
echo "- MIGRATION.md (Flask migration guide)"
echo ""
echo "========================================"
echo ""
