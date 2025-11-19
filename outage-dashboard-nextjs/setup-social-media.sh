#!/bin/bash

echo "========================================"
echo "Social Media Analytics Setup"
echo "========================================"
echo ""

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

echo "Step 2: Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to generate Prisma client"
    exit 1
fi
echo ""

echo "Step 3: Pushing database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push database schema"
    exit 1
fi
echo ""

echo "Step 4: Importing social media data..."
npm run import-social-media
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to import social media data"
    exit 1
fi
echo ""

echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "You can now start the development server with:"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo "Navigate to the 'Social Media' tab to see the new features!"
echo ""

