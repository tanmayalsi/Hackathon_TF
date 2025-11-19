@echo off
REM Simple helper script to add datetime stamps to call_transcripts_with_customers.csv
REM Usage (from transcript_factory directory):
REM   run_add_timestamps.bat

echo ==============================================
echo Running add_call_timestamps.py...
echo ==============================================

REM Use the default Python on PATH
python add_call_timestamps.py

echo.
echo Done. Output written to call_transcripts_with_customers_with_times.csv
echo ==============================================


