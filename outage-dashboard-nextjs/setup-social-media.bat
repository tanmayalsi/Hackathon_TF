@echo off
echo ========================================
echo Social Media Analytics Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo Step 3: Pushing database schema...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push database schema
    pause
    exit /b 1
)
echo.

echo Step 4: Importing social media data...
call npm run import-social-media
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import social media data
    pause
    exit /b 1
)
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now start the development server with:
echo   npm run dev
echo.
echo Then visit: http://localhost:3000
echo Navigate to the "Social Media" tab to see the new features!
echo.
pause

