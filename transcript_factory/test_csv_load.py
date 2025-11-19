#!/usr/bin/env python3
"""
Quick test script to check CSV loading
"""
import pandas as pd
import os

print("="*70)
print("CSV LOADING TEST")
print("="*70)

# Check file existence
customers_file = '../data/customers.csv'
transcripts_file = 'call_transcripts.csv'

print(f"\nChecking files...")
print(f"  customers.csv exists: {os.path.exists(customers_file)}")
print(f"  call_transcripts.csv exists: {os.path.exists(transcripts_file)}")

# Test customers.csv
print(f"\n--- Testing {customers_file} ---")
try:
    customers_df = pd.read_csv(customers_file)
    print(f"✓ Loaded successfully")
    print(f"  Shape: {customers_df.shape}")
    print(f"  Columns: {list(customers_df.columns)}")
    print(f"\nFirst 5 rows:")
    print(customers_df.head())
    print(f"\nData types:")
    print(customers_df.dtypes)
except Exception as e:
    print(f"✗ ERROR: {e}")

# Test call_transcripts.csv
print(f"\n--- Testing {transcripts_file} ---")
try:
    transcripts_df = pd.read_csv(transcripts_file)
    print(f"✓ Loaded successfully")
    print(f"  Shape: {transcripts_df.shape}")
    print(f"  Columns: {list(transcripts_df.columns)}")
    print(f"\nFirst 3 rows (truncated):")
    for idx, row in transcripts_df.head(3).iterrows():
        print(f"  Row {idx}:")
        print(f"    call_id: {row['call_id']}")
        print(f"    call_reason: {row['call_reason']}")
        print(f"    transcript length: {len(str(row['transcript']))} chars")
except Exception as e:
    print(f"✗ ERROR: {e}")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)

