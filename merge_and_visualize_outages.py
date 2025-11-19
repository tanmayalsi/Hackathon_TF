#!/usr/bin/env python3
"""
Merge call_data.csv and call_transcripts_db.csv, then visualize outage call timing.

This script:
1. Loads call_data.csv (contains call_id, customer_id, startdatetime, enddatetime)
2. Loads call_transcripts_db.csv (contains call_id, customer_id, call_reason, transcript)
3. Merges them on call_id
4. Filters for technical_support calls (outage calls)
5. Creates visualizations showing:
   - Call volume over time (hourly)
   - Call distribution by hour of day
   - Call duration analysis

Usage:
    python merge_and_visualize_outages.py
"""

import os
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# File paths
CALL_DATA_FILE = "data/call_data.csv"
CALL_TRANSCRIPTS_FILE = "data/call_transcripts_db.csv"
OUTPUT_MERGED_FILE = "data/merged_call_data.csv"


def load_and_merge_data():
    """Load both CSV files and merge them on call_id."""
    print("=" * 70)
    print("MERGING CALL DATA AND TRANSCRIPTS")
    print("=" * 70)
    
    # Load call_data.csv
    print(f"\nLoading {CALL_DATA_FILE}...")
    if not os.path.exists(CALL_DATA_FILE):
        raise FileNotFoundError(f"File not found: {CALL_DATA_FILE}")
    
    call_data = pd.read_csv(CALL_DATA_FILE)
    print(f"  Loaded {len(call_data)} records")
    print(f"  Columns: {list(call_data.columns)}")
    
    # Load call_transcripts_db.csv
    print(f"\nLoading {CALL_TRANSCRIPTS_FILE}...")
    if not os.path.exists(CALL_TRANSCRIPTS_FILE):
        raise FileNotFoundError(f"File not found: {CALL_TRANSCRIPTS_FILE}")
    
    call_transcripts = pd.read_csv(CALL_TRANSCRIPTS_FILE)
    print(f"  Loaded {len(call_transcripts)} records")
    print(f"  Columns: {list(call_transcripts.columns)}")
    
    # Merge on call_id
    print(f"\nMerging datasets on 'call_id'...")
    merged = pd.merge(call_data, call_transcripts, on='call_id', how='inner', suffixes=('', '_transcript'))
    print(f"  Merged {len(merged)} records")
    
    # Convert datetime columns
    print("\nParsing datetime columns...")
    merged['startdatetime'] = pd.to_datetime(merged['startdatetime'], errors='coerce')
    merged['enddatetime'] = pd.to_datetime(merged['enddatetime'], errors='coerce')
    
    # Calculate call duration in minutes
    merged['duration_minutes'] = (merged['enddatetime'] - merged['startdatetime']).dt.total_seconds() / 60
    
    # Extract time features
    merged['hour'] = merged['startdatetime'].dt.hour
    merged['date'] = merged['startdatetime'].dt.date
    merged['day_of_week'] = merged['startdatetime'].dt.day_name()
    
    # Save merged data
    print(f"\nSaving merged data to {OUTPUT_MERGED_FILE}...")
    merged.to_csv(OUTPUT_MERGED_FILE, index=False)
    print(f"  Saved successfully!")
    
    return merged


def filter_technical_support(merged_df):
    """Filter for technical_support calls (outage calls)."""
    print("\n" + "=" * 70)
    print("FILTERING FOR TECHNICAL SUPPORT (OUTAGE) CALLS")
    print("=" * 70)
    
    # Get call reason distribution
    print("\nCall reason distribution:")
    reason_counts = merged_df['call_reason'].value_counts()
    for reason, count in reason_counts.items():
        print(f"  {reason}: {count}")
    
    # Filter for technical_support
    tech_support = merged_df[merged_df['call_reason'] == 'technical_support'].copy()
    print(f"\nFiltered to {len(tech_support)} technical_support calls")
    
    return tech_support


def create_visualizations(tech_support_df):
    """Create visualizations for technical support (outage) calls."""
    print("\n" + "=" * 70)
    print("CREATING VISUALIZATIONS")
    print("=" * 70)
    
    # Set style
    plt.rcParams['figure.figsize'] = (15, 10)
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    
    # Create a figure with multiple subplots
    fig = plt.figure(figsize=(16, 12))
    
    # 1. Call volume over time (hourly buckets)
    print("\n1. Creating call volume over time plot...")
    ax1 = plt.subplot(3, 2, 1)
    tech_support_df['time_bucket'] = tech_support_df['startdatetime'].dt.floor('1H')
    hourly_calls = tech_support_df.groupby('time_bucket').size().reset_index(name='call_count')
    ax1.plot(hourly_calls['time_bucket'], hourly_calls['call_count'], marker='o', linewidth=2)
    ax1.set_title('Technical Support Call Volume Over Time (Hourly)', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Time')
    ax1.set_ylabel('Number of Calls')
    ax1.grid(True, alpha=0.3)
    plt.xticks(rotation=45, ha='right')
    
    # 2. Call distribution by hour of day
    print("2. Creating hour of day distribution...")
    ax2 = plt.subplot(3, 2, 2)
    hour_counts = tech_support_df['hour'].value_counts().sort_index()
    ax2.bar(hour_counts.index, hour_counts.values, color='steelblue', alpha=0.7)
    ax2.set_title('Technical Support Calls by Hour of Day', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Hour of Day')
    ax2.set_ylabel('Number of Calls')
    ax2.set_xticks(range(24))
    ax2.grid(True, alpha=0.3, axis='y')
    
    # 3. Call volume over time (30-minute buckets for more detail)
    print("3. Creating detailed call volume plot (30-min buckets)...")
    ax3 = plt.subplot(3, 2, 3)
    tech_support_df['time_bucket_30min'] = tech_support_df['startdatetime'].dt.floor('30min')
    half_hourly_calls = tech_support_df.groupby('time_bucket_30min').size().reset_index(name='call_count')
    ax3.plot(half_hourly_calls['time_bucket_30min'], half_hourly_calls['call_count'], 
             marker='o', linewidth=2, color='darkgreen')
    ax3.set_title('Technical Support Call Volume Over Time (30-min buckets)', fontsize=12, fontweight='bold')
    ax3.set_xlabel('Time')
    ax3.set_ylabel('Number of Calls')
    ax3.grid(True, alpha=0.3)
    plt.xticks(rotation=45, ha='right')
    
    # 4. Call duration distribution
    print("4. Creating call duration distribution...")
    ax4 = plt.subplot(3, 2, 4)
    ax4.hist(tech_support_df['duration_minutes'].dropna(), bins=30, color='coral', alpha=0.7, edgecolor='black')
    ax4.set_title('Technical Support Call Duration Distribution', fontsize=12, fontweight='bold')
    ax4.set_xlabel('Duration (minutes)')
    ax4.set_ylabel('Number of Calls')
    ax4.grid(True, alpha=0.3, axis='y')
    
    # 5. Calls by day of week
    print("5. Creating day of week distribution...")
    ax5 = plt.subplot(3, 2, 5)
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_counts = tech_support_df['day_of_week'].value_counts()
    day_counts = day_counts.reindex([d for d in day_order if d in day_counts.index])
    ax5.bar(range(len(day_counts)), day_counts.values, color='purple', alpha=0.7)
    ax5.set_title('Technical Support Calls by Day of Week', fontsize=12, fontweight='bold')
    ax5.set_xlabel('Day of Week')
    ax5.set_ylabel('Number of Calls')
    ax5.set_xticks(range(len(day_counts)))
    ax5.set_xticklabels(day_counts.index, rotation=45, ha='right')
    ax5.grid(True, alpha=0.3, axis='y')
    
    # 6. Cumulative calls over time
    print("6. Creating cumulative calls plot...")
    ax6 = plt.subplot(3, 2, 6)
    sorted_calls = tech_support_df.sort_values('startdatetime')
    sorted_calls['cumulative_calls'] = range(1, len(sorted_calls) + 1)
    ax6.plot(sorted_calls['startdatetime'], sorted_calls['cumulative_calls'], 
             linewidth=2, color='darkred')
    ax6.set_title('Cumulative Technical Support Calls Over Time', fontsize=12, fontweight='bold')
    ax6.set_xlabel('Time')
    ax6.set_ylabel('Cumulative Number of Calls')
    ax6.grid(True, alpha=0.3)
    plt.xticks(rotation=45, ha='right')
    
    plt.tight_layout()
    
    # Print statistics
    print("\n" + "=" * 70)
    print("STATISTICS")
    print("=" * 70)
    print(f"\nTotal technical support calls: {len(tech_support_df)}")
    print(f"Date range: {tech_support_df['startdatetime'].min()} to {tech_support_df['startdatetime'].max()}")
    print(f"\nAverage call duration: {tech_support_df['duration_minutes'].mean():.2f} minutes")
    print(f"Median call duration: {tech_support_df['duration_minutes'].median():.2f} minutes")
    print(f"Min call duration: {tech_support_df['duration_minutes'].min():.2f} minutes")
    print(f"Max call duration: {tech_support_df['duration_minutes'].max():.2f} minutes")
    
    print(f"\nPeak hour: {hour_counts.idxmax()}:00 with {hour_counts.max()} calls")
    print(f"Busiest day: {day_counts.idxmax()} with {day_counts.max()} calls")
    
    # Save the figure
    output_file = "technical_support_analysis.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"\nVisualization saved to: {output_file}")
    
    print("\nDisplaying plots...")
    plt.show()


def main():
    """Main execution function."""
    try:
        # Load and merge data
        merged_df = load_and_merge_data()
        
        # Filter for technical support calls
        tech_support_df = filter_technical_support(merged_df)
        
        if len(tech_support_df) == 0:
            print("\nWARNING: No technical support calls found!")
            return
        
        # Create visualizations
        create_visualizations(tech_support_df)
        
        print("\n" + "=" * 70)
        print("COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

