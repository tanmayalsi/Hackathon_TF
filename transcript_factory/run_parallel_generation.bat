@echo off
REM Parallel Bulk Transcript Generation Runner for Windows
REM ======================================================

echo.
echo ========================================
echo Parallel Transcript Generator
echo ========================================
echo.

REM Check if API key is set
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY environment variable is not set.
    echo.
    echo Please set it first:
    echo   set ANTHROPIC_API_KEY=your_api_key_here
    echo.
    echo Or add it to your system environment variables.
    pause
    exit /b 1
)

echo API Key: Found
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    pause
    exit /b 1
)

echo Python: OK
echo.

REM Check if required packages are installed
echo Checking dependencies...
python -c "import anthropic" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo Dependencies: OK
echo.
echo ========================================
echo Starting parallel generation...
echo ========================================
echo.

REM Run the parallel generation script
python generate_bulk_transcripts_parallel.py

if errorlevel 1 (
    echo.
    echo ========================================
    echo Generation failed with errors
    echo ========================================
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo Generation completed successfully!
    echo ========================================
    pause
    exit /b 0
)

