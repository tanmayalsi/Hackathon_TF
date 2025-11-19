@echo off
REM Simple helper script to visualize outage-driven call volumes.
REM Usage (from transcript_factory directory):
REM   run_visualize_outages.bat

echo ==============================================
echo Visualizing outage call volumes...
echo ==============================================

python visualize_outages.py

echo.
echo If no plots appeared, make sure you have matplotlib installed:
echo   pip install matplotlib pandas
echo ==============================================


