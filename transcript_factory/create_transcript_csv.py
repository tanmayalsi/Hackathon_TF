#!/usr/bin/env python3
"""
Create a CSV file from transcript text files in subdirectories.

Generates a CSV with columns:
- call_id: Ascending integer IDs
- call_reason: Subdirectory name (account_management, billing_inquiry, technical_support)
- transcript: Full text content of the transcript file
"""

import os
import csv
from pathlib import Path


def create_transcript_csv(transcripts_dir, output_csv):
    """
    Create a CSV from transcript files in subdirectories.
    
    Args:
        transcripts_dir: Path to the directory containing transcript subdirectories
        output_csv: Path to the output CSV file
    """
    # Initialize variables
    call_id = 1000  # Starting call_id
    rows = []
    
    # Get the transcripts directory path
    transcripts_path = Path(transcripts_dir)
    
    if not transcripts_path.exists():
        raise FileNotFoundError(f"Transcripts directory not found: {transcripts_dir}")
    
    print(f"Scanning transcripts directory: {transcripts_path}")
    
    # Walk through all subdirectories
    for call_reason_dir in sorted(transcripts_path.iterdir()):
        if call_reason_dir.is_dir():
            call_reason = call_reason_dir.name
            print(f"Processing {call_reason}...")
            
            # Get all .txt files in this subdirectory
            transcript_files = sorted(call_reason_dir.glob('*.txt'))
            
            for transcript_file in transcript_files:
                try:
                    # Read the transcript content
                    with open(transcript_file, 'r', encoding='utf-8') as f:
                        transcript_content = f.read()
                    
                    # Add row to our data
                    rows.append({
                        'call_id': call_id,
                        'call_reason': call_reason,
                        'transcript': transcript_content
                    })
                    
                    call_id += 1
                    
                except Exception as e:
                    print(f"Error reading {transcript_file}: {e}")
                    continue
            
            print(f"  Processed {len(transcript_files)} files from {call_reason}")
    
    # Write to CSV with proper quoting
    print(f"\nWriting {len(rows)} rows to CSV: {output_csv}")
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['call_id', 'call_reason', 'transcript']
        writer = csv.DictWriter(
            csvfile, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_ALL  # Quote all fields for safety
        )
        
        # Write header
        writer.writeheader()
        
        # Write all rows
        writer.writerows(rows)
    
    print(f"✓ Successfully created CSV with {len(rows)} rows")
    print(f"  Output file: {output_csv}")
    
    # Print summary statistics
    print("\nSummary by call_reason:")
    reason_counts = {}
    for row in rows:
        reason = row['call_reason']
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
    
    for reason, count in sorted(reason_counts.items()):
        print(f"  {reason}: {count} transcripts")


if __name__ == "__main__":
    # Set paths relative to this script
    script_dir = Path(__file__).parent
    transcripts_dir = script_dir / "transcripts"
    output_csv = script_dir / "call_transcripts.csv"
    
    # Create the CSV
    create_transcript_csv(transcripts_dir, output_csv)
    
    print("\n" + "="*60)
    print("CSV creation complete!")
    print("="*60)

