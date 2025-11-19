#!/usr/bin/env python3
"""
Script to add customer_id to call_transcripts.csv based on outage events.

This script:
1. Loads customers.csv to get customer IDs by ZIP code
2. Loads call_transcripts.csv 
3. Assigns customer IDs to transcripts to simulate outage-related call patterns
4. Writes updated call_transcripts.csv with customer_id column

Outage Events:
- Event 1: TX Dallas (75201, 75234, 75219, 75232) - 219 customers
- Event 2: CT Bridgeport (06673, 06604) - 126 customers  
- Event 3: TX Dallas (75209, 75228, 75230) - 156 customers
- Event 4: CT Bridgeport (06611, 06606) - 101 customers
- Event 5: TX Dallas (75217, 75252) - 100 customers
Total: 702 customers
"""

import pandas as pd
import random
from collections import defaultdict

# Define outage events
OUTAGE_EVENTS = [
    {
        'event_id': 1,
        'zipcodes': ['75201', '75234', '75219', '75232'],
        'customer_count': 219,
        'technical_support_calls': 88  # 40% of customers call about technical issues
    },
    {
        'event_id': 2,
        'zipcodes': ['06673', '06604'],
        'customer_count': 126,
        'technical_support_calls': 50
    },
    {
        'event_id': 3,
        'zipcodes': ['75209', '75228', '75230'],
        'customer_count': 156,
        'technical_support_calls': 62
    },
    {
        'event_id': 4,
        'zipcodes': ['06611', '06606'],
        'customer_count': 101,
        'technical_support_calls': 40
    },
    {
        'event_id': 5,
        'zipcodes': ['75217', '75252'],
        'customer_count': 100,
        'technical_support_calls': 40
    }
]

def load_customers_by_zip(customers_file):
    """Load customers and organize by ZIP code."""
    print(f"Loading customers from {customers_file}...")
    
    try:
        # Try standard CSV reading first
        customers_df = pd.read_csv(customers_file)
        
        # Verify we have the required columns
        required_columns = ['customer_id', 'customer_name', 'zip', 'city']
        if not all(col in customers_df.columns for col in required_columns):
            print(f"ERROR: CSV columns found: {list(customers_df.columns)}")
            print(f"ERROR: Required columns: {required_columns}")
            raise ValueError(f"Missing required columns in {customers_file}")
        
        print(f"✓ Successfully loaded CSV with columns: {list(customers_df.columns)}")
        
    except Exception as e:
        print(f"ERROR: Failed to load customers: {e}")
        raise
    
    # Organize customers by ZIP code
    # Note: ZIP codes may be stored as integers, so we need to handle both formats
    customers_by_zip = defaultdict(list)
    for _, row in customers_df.iterrows():
        # Convert ZIP to string and remove decimal if it's a float
        zip_raw = str(row['zip']).strip()
        if '.' in zip_raw:
            zip_raw = zip_raw.split('.')[0]  # Remove .0 from floats
        
        # Store both with and without leading zeros for matching
        customer_id = str(row['customer_id']).strip()
        customers_by_zip[zip_raw].append(customer_id)
        
        # Also store with leading zeros if it's a short ZIP (for CT zips like 06604)
        if len(zip_raw) == 4:
            zip_with_zero = '0' + zip_raw
            customers_by_zip[zip_with_zero].append(customer_id)
        # Also store 5-digit zips without leading zeros (for matching)
        elif len(zip_raw) == 5 and zip_raw[0] == '0':
            zip_without_zero = zip_raw.lstrip('0')
            customers_by_zip[zip_without_zero].append(customer_id)
    
    print(f"Loaded {len(customers_df)} customers across {len(customers_by_zip)} ZIP codes")
    for zip_code, customers in sorted(customers_by_zip.items()):
        print(f"  ZIP {zip_code}: {len(customers)} customers")
    
    return customers_by_zip

def load_transcripts(transcripts_file):
    """Load call transcripts."""
    print(f"\nLoading transcripts from {transcripts_file}...")
    
    try:
        transcripts_df = pd.read_csv(transcripts_file)
        print(f"✓ Loaded {len(transcripts_df)} transcripts")
        
        # Verify required columns
        required_columns = ['call_id', 'call_reason', 'transcript']
        if not all(col in transcripts_df.columns for col in required_columns):
            print(f"ERROR: CSV columns found: {list(transcripts_df.columns)}")
            print(f"ERROR: Required columns: {required_columns}")
            raise ValueError(f"Missing required columns in {transcripts_file}")
        
        # Count by call reason
        reason_counts = transcripts_df['call_reason'].value_counts()
        print("\nTranscript distribution by call reason:")
        for reason, count in reason_counts.items():
            print(f"  {reason}: {count}")
        
        return transcripts_df
        
    except Exception as e:
        print(f"ERROR: Failed to load transcripts: {e}")
        raise

def assign_customer_ids(transcripts_df, customers_by_zip, outage_events):
    """
    Assign customer IDs to transcripts based on outage events.
    
    Strategy:
    1. For each outage event, select customers from affected ZIP codes
    2. Assign technical_support transcripts to simulate outage calls
    3. Assign remaining call types (billing, account management) to all customers
    """
    print("\n" + "="*70)
    print("ASSIGNING CUSTOMER IDs TO TRANSCRIPTS")
    print("="*70)
    
    # Separate transcripts by call reason
    technical_transcripts = transcripts_df[transcripts_df['call_reason'] == 'technical_support'].copy()
    billing_transcripts = transcripts_df[transcripts_df['call_reason'] == 'billing_inquiry'].copy()
    account_transcripts = transcripts_df[transcripts_df['call_reason'] == 'account_management'].copy()
    
    print(f"\nSeparated transcripts:")
    print(f"  Technical support: {len(technical_transcripts)}")
    print(f"  Billing inquiry: {len(billing_transcripts)}")
    print(f"  Account management: {len(account_transcripts)}")
    
    # Collect all customer IDs
    all_customers = []
    for zip_code, customers in customers_by_zip.items():
        all_customers.extend(customers)
    print(f"\nTotal customers available: {len(all_customers)}")
    
    # Track which technical transcripts have been assigned
    technical_idx = 0
    assigned_technical = []
    
    # Process each outage event
    print("\n" + "-"*70)
    print("PROCESSING OUTAGE EVENTS")
    print("-"*70)
    
    for event in outage_events:
        event_id = event['event_id']
        zipcodes = event['zipcodes']
        calls_needed = event['technical_support_calls']
        
        print(f"\nOutage Event {event_id}:")
        print(f"  ZIP codes: {', '.join(zipcodes)}")
        print(f"  Technical support calls to assign: {calls_needed}")
        
        # Get customers from affected ZIP codes
        affected_customers = []
        for zipcode in zipcodes:
            if zipcode in customers_by_zip:
                affected_customers.extend(customers_by_zip[zipcode])
                print(f"    ZIP {zipcode}: found {len(customers_by_zip[zipcode])} customers")
            else:
                print(f"    ZIP {zipcode}: WARNING - no customers found")
        
        print(f"  Customers affected: {len(affected_customers)}")
        
        # Check if we have customers for this event
        if len(affected_customers) == 0:
            print(f"  ERROR: No customers found for this outage event!")
            print(f"  Available ZIP codes: {sorted(customers_by_zip.keys())}")
            raise ValueError(f"Outage event {event_id} has no customers in ZIP codes {zipcodes}")
        
        # Assign technical support calls for this outage
        # Some customers may call multiple times
        for i in range(calls_needed):
            if technical_idx >= len(technical_transcripts):
                print(f"  WARNING: Ran out of technical transcripts at index {technical_idx}")
                break
            
            # Randomly select a customer from affected area
            # Weight it so some customers call multiple times (realistic behavior)
            customer_id = random.choice(affected_customers)
            
            assigned_technical.append({
                'call_id': technical_transcripts.iloc[technical_idx]['call_id'],
                'customer_id': customer_id,
                'event_id': event_id
            })
            
            technical_idx += 1
        
        print(f"  Assigned {len([a for a in assigned_technical if a['event_id'] == event_id])} technical calls")
    
    print(f"\nTotal technical transcripts assigned: {len(assigned_technical)}")
    print(f"Remaining technical transcripts: {len(technical_transcripts) - technical_idx}")
    
    # Assign remaining technical transcripts to random customers (non-outage related issues)
    print("\nAssigning remaining technical transcripts to random customers...")
    remaining_technical = len(technical_transcripts) - technical_idx
    for i in range(remaining_technical):
        customer_id = random.choice(all_customers)
        assigned_technical.append({
            'call_id': technical_transcripts.iloc[technical_idx]['call_id'],
            'customer_id': customer_id,
            'event_id': None  # Not outage-related
        })
        technical_idx += 1
    
    # Create a mapping of call_id to customer_id
    customer_mapping = {}
    for assignment in assigned_technical:
        customer_mapping[assignment['call_id']] = assignment['customer_id']
    
    # Assign billing and account management calls to random customers
    print(f"\nAssigning {len(billing_transcripts)} billing inquiry calls...")
    for _, row in billing_transcripts.iterrows():
        customer_mapping[row['call_id']] = random.choice(all_customers)
    
    print(f"Assigning {len(account_transcripts)} account management calls...")
    for _, row in account_transcripts.iterrows():
        customer_mapping[row['call_id']] = random.choice(all_customers)
    
    print(f"\nTotal customer assignments: {len(customer_mapping)}")
    
    # Add customer_id column to transcripts
    print("\nAdding customer_id column to transcripts dataframe...")
    transcripts_df['customer_id'] = transcripts_df['call_id'].map(customer_mapping)
    
    # Verify no missing assignments
    missing = transcripts_df['customer_id'].isna().sum()
    if missing > 0:
        print(f"WARNING: {missing} transcripts have no customer_id assigned!")
    else:
        print("✓ All transcripts have customer_id assigned")
    
    return transcripts_df

def save_updated_transcripts(transcripts_df, output_file):
    """Save updated transcripts with customer_id column."""
    print(f"\nSaving updated transcripts to {output_file}...")
    
    # Reorder columns to put customer_id after call_id
    columns = ['call_id', 'customer_id', 'call_reason', 'transcript']
    transcripts_df = transcripts_df[columns]
    
    transcripts_df.to_csv(output_file, index=False)
    print(f"✓ Saved {len(transcripts_df)} transcripts with customer IDs")
    
    # Print sample
    print("\nSample of updated data:")
    print(transcripts_df[['call_id', 'customer_id', 'call_reason']].head(10))

def main():
    """Main execution function."""
    print("="*70)
    print("ADD CUSTOMER IDs TO CALL TRANSCRIPTS")
    print("="*70)
    
    # Set random seed for reproducibility
    random.seed(42)
    
    # File paths
    customers_file = '../data/customers.csv'
    transcripts_file = 'call_transcripts.csv'
    output_file = 'call_transcripts_with_customers.csv'
    
    # Load data
    customers_by_zip = load_customers_by_zip(customers_file)
    transcripts_df = load_transcripts(transcripts_file)
    
    # Assign customer IDs
    updated_transcripts_df = assign_customer_ids(transcripts_df, customers_by_zip, OUTAGE_EVENTS)
    
    # Save updated transcripts
    save_updated_transcripts(updated_transcripts_df, output_file)
    
    print("\n" + "="*70)
    print("COMPLETE!")
    print("="*70)
    print(f"\nUpdated transcripts saved to: {output_file}")
    print("\nNext steps:")
    print("1. Review the output file to verify customer assignments")
    print("2. Use this file to add datetime stamps for outage events")
    print("3. Analyze call patterns by customer and ZIP code")

if __name__ == "__main__":
    main()

