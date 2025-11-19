@echo off
REM ========================================
REM Next.js Outage Dashboard Setup Script
REM ========================================

echo.
echo ========================================
echo Next.js Outage Dashboard Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

REM Display npm version
echo [INFO] npm version:
npm --version
echo.

REM Check if package.json exists
if not exist package.json (
    echo [ERROR] package.json not found!
    echo Make sure you are in the outage-dashboard-nextjs directory.
    pause
    exit /b 1
)

REM Install dependencies
echo ========================================
echo Step 1: Installing Dependencies
echo ========================================
echo.
echo This may take 2-3 minutes...
echo.

call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo Trying alternative method...
    call npm install --force
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Installation failed. Please check the errors above.
        pause
        exit /b 1
    )
)

echo.
echo [SUCCESS] Dependencies installed!
echo.

REM Check if .env file exists
if not exist .env (
    echo ========================================
    echo Step 2: Creating .env file
    echo ========================================
    echo.

    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] .env file created from .env.example
        echo.
        echo [ACTION REQUIRED] Please edit .env and add your database credentials:
        echo.
        echo   1. Update DB_PASSWORD with your PostgreSQL password
        echo   2. Update DATABASE_URL connection string
        echo.
        echo Opening .env file in Notepad...
        timeout /t 2 /nobreak >nul
        notepad .env
        echo.
        echo [INFO] After saving your changes in Notepad, close it to continue...
        echo.
    ) else (
        echo [WARNING] .env.example not found!
        echo Please create .env manually with your database credentials.
        echo.
    )
) else (
    echo ========================================
    echo Step 2: Environment Configuration
    echo ========================================
    echo.
    echo [INFO] .env file already exists
    echo.
    echo Do you want to edit it? (y/n)
    set /p EDIT_ENV=
    if /i "%EDIT_ENV%"=="y" (
        notepad .env
    )
    echo.
)

REM Generate Prisma client
echo ========================================
echo Step 3: Generating Prisma Client
echo ========================================
echo.

call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to generate Prisma client!
    echo.
    echo Common issues:
    echo - Make sure your DATABASE_URL in .env is correct
    echo - Check that PostgreSQL is running
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Prisma client generated!
echo.

REM Final instructions
echo ========================================
echo Setup Complete! ✓
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Make sure PostgreSQL is running
echo 2. Verify your .env file has the correct password
echo 3. Start the development server:
echo.
echo    npm run dev
echo.
echo 4. Open your browser to:
echo.
echo    http://localhost:3000
echo.
echo ========================================
echo Documentation:
echo ========================================
echo.
echo - SETUP_INSTRUCTIONS.md (detailed steps)
echo - README.md (full documentation)
echo - QUICKSTART.md (5-minute guide)
echo.
echo ========================================
echo.

pause
