#!/bin/bash
# Parallel Bulk Transcript Generation Runner for Linux/Mac
# ========================================================

echo ""
echo "========================================"
echo "Parallel Transcript Generator"
echo "========================================"
echo ""

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY environment variable is not set."
    echo ""
    echo "Please set it first:"
    echo "  export ANTHROPIC_API_KEY=your_api_key_here"
    echo ""
    echo "Or add it to your ~/.bashrc or ~/.zshrc"
    exit 1
fi

echo "API Key: Found"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ERROR: Python is not installed or not in PATH."
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

echo "Python: OK ($PYTHON_CMD)"
echo ""

# Check if required packages are installed
echo "Checking dependencies..."
$PYTHON_CMD -c "import anthropic" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Installing required packages..."
    $PYTHON_CMD -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies."
        exit 1
    fi
fi

echo "Dependencies: OK"
echo ""
echo "========================================"
echo "Starting parallel generation..."
echo "========================================"
echo ""

# Run the parallel generation script
$PYTHON_CMD generate_bulk_transcripts_parallel.py

if [ $? -ne 0 ]; then
    echo ""
    echo "========================================"
    echo "Generation failed with errors"
    echo "========================================"
    exit 1
else
    echo ""
    echo "========================================"
    echo "Generation completed successfully!"
    echo "========================================"
    exit 0
fi

