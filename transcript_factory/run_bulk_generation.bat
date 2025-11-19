@echo off
echo ================================================================================
echo Frontier Communications - Bulk Transcript Generator
echo ================================================================================
echo.
echo This script will generate 1,000 synthetic call transcripts:
echo   - 700 technical support (outage) calls
echo   - 150 billing inquiry calls
echo   - 150 account management (upgrade) calls
echo.
echo Make sure you have set your ANTHROPIC_API_KEY environment variable!
echo.
pause

echo.
echo Starting generation...
echo.

python generate_bulk_transcripts.py

echo.
echo ================================================================================
echo Generation complete!
echo ================================================================================
pause

