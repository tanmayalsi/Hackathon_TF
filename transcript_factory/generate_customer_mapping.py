"""
Generate Customer Metadata CSV
Maps call transcripts to synthetic customer IDs with realistic call patterns.
"""

import os
import csv
import random
from pathlib import Path


def collect_transcripts(base_dir):
    """
    Collect all transcript files from the three categories.
    
    Returns:
        list of tuples: (filename, category)
    """
    categories = ['account_management', 'billing_inquiry', 'technical_support']
    transcripts = []
    
    for category in categories:
        category_path = os.path.join(base_dir, category)
        if os.path.exists(category_path):
            files = [f for f in os.listdir(category_path) if f.endswith('.txt')]
            for filename in files:
                transcripts.append((filename, category))
            print(f"Found {len(files)} transcripts in {category}")
    
    return transcripts


def assign_customer_ids(transcripts, single_call_ratio=0.65):
    """
    Assign customer IDs to transcripts with realistic patterns.
    
    Args:
        transcripts: list of (filename, category) tuples
        single_call_ratio: proportion of customers with only 1 call (default 0.65 = 65%)
    
    Returns:
        list of dicts with keys: transcript_filename, customer_id, transcript_category
    """
    # Shuffle transcripts for random assignment
    shuffled = transcripts.copy()
    random.shuffle(shuffled)
    
    mappings = []
    customer_id = 1
    i = 0
    
    while i < len(shuffled):
        # Decide if this customer gets 1 or 2 calls
        if random.random() < single_call_ratio or i == len(shuffled) - 1:
            # Single call customer
            filename, category = shuffled[i]
            mappings.append({
                'transcript_filename': filename,
                'customer_id': customer_id,
                'transcript_category': category
            })
            i += 1
        else:
            # Two-call customer
            filename1, category1 = shuffled[i]
            mappings.append({
                'transcript_filename': filename1,
                'customer_id': customer_id,
                'transcript_category': category1
            })
            
            # Assign second call if available
            if i + 1 < len(shuffled):
                filename2, category2 = shuffled[i + 1]
                mappings.append({
                    'transcript_filename': filename2,
                    'customer_id': customer_id,
                    'transcript_category': category2
                })
                i += 2
            else:
                i += 1
        
        customer_id += 1
    
    return mappings


def write_csv(mappings, output_file):
    """Write the mappings to a CSV file."""
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['transcript_filename', 'customer_id', 'transcript_category']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(mappings)
    
    print(f"\nWrote {len(mappings)} mappings to {output_file}")


def print_statistics(mappings):
    """Print statistics about the customer mapping."""
    # Count customers
    customer_ids = set(m['customer_id'] for m in mappings)
    total_customers = len(customer_ids)
    total_transcripts = len(mappings)
    
    # Count calls per customer
    calls_per_customer = {}
    for mapping in mappings:
        cid = mapping['customer_id']
        calls_per_customer[cid] = calls_per_customer.get(cid, 0) + 1
    
    single_call = sum(1 for count in calls_per_customer.values() if count == 1)
    two_calls = sum(1 for count in calls_per_customer.values() if count == 2)
    
    # Count by category
    category_counts = {}
    for mapping in mappings:
        cat = mapping['transcript_category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print("\n=== Customer Mapping Statistics ===")
    print(f"Total transcripts: {total_transcripts}")
    print(f"Total unique customers: {total_customers}")
    print(f"\nCustomers with 1 call: {single_call} ({single_call/total_customers*100:.1f}%)")
    print(f"Customers with 2 calls: {two_calls} ({two_calls/total_customers*100:.1f}%)")
    print(f"\nTranscripts by category:")
    for category, count in sorted(category_counts.items()):
        print(f"  {category}: {count}")


def main():
    """Main function to generate customer mapping CSV."""
    # Set random seed for reproducibility
    random.seed(42)
    
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Collecting transcripts from directories...")
    transcripts = collect_transcripts(script_dir)
    print(f"\nTotal transcripts found: {len(transcripts)}")
    
    print("\nAssigning customer IDs...")
    mappings = assign_customer_ids(transcripts, single_call_ratio=0.65)
    
    # Sort by customer_id, then by filename for better readability
    mappings.sort(key=lambda x: (x['customer_id'], x['transcript_filename']))
    
    # Write to CSV
    output_file = os.path.join(script_dir, 'customer_transcript_mapping.csv')
    write_csv(mappings, output_file)
    
    # Print statistics
    print_statistics(mappings)
    
    print("\n✓ Customer mapping generation complete!")


if __name__ == '__main__':
    main()

