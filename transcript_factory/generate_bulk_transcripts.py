"""
Bulk Transcript Generator
=========================
Generates 1,000 transcripts with specific category ratios:
- 700 outage (technical_support)
- 150 billing (billing_inquiry)
- 150 upgrade (account_management)
"""

import os
from pathlib import Path
from generate_transcripts import TranscriptFactory
from datetime import datetime


def generate_bulk_with_ratio():
    """Generate 1,000 transcripts with specified ratio."""
    
    # Define the counts for each category
    category_counts = {
        "technical_support": 700,  # outage calls
        "billing_inquiry": 150,    # billing calls
        "account_management": 150  # upgrade calls
    }
    
    total_count = sum(category_counts.values())
    
    print("=" * 80)
    print("BULK TRANSCRIPT GENERATION")
    print("=" * 80)
    print(f"\nTotal transcripts to generate: {total_count}")
    print("\nBreakdown by category:")
    for category, count in category_counts.items():
        print(f"  - {category}: {count} transcripts")
    print("\n" + "=" * 80)
    
    # Initialize the factory
    try:
        factory = TranscriptFactory()
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease set your ANTHROPIC_API_KEY environment variable:")
        print("  Windows: set ANTHROPIC_API_KEY=your_api_key_here")
        print("  Linux/Mac: export ANTHROPIC_API_KEY=your_api_key_here")
        return 1
    
    # Track progress
    start_time = datetime.now()
    total_generated = 0
    
    # Generate transcripts for each category
    for category, count in category_counts.items():
        print(f"\n{'=' * 80}")
        print(f"Starting generation for: {category.upper()}")
        print(f"Target: {count} transcripts")
        print(f"{'=' * 80}\n")
        
        for i in range(count):
            try:
                # Generate transcript
                transcript = factory.generate_transcript(category)
                
                # Save with numbered filename
                filename = f"{category}_{i+1:04d}"
                factory.save_transcript(category, transcript, custom_filename=filename)
                
                total_generated += 1
                
                # Progress update every 10 transcripts
                if (i + 1) % 10 == 0:
                    elapsed = (datetime.now() - start_time).total_seconds()
                    avg_time = elapsed / total_generated
                    remaining = (total_count - total_generated) * avg_time
                    
                    print(f"\n📊 Progress Update:")
                    print(f"  - {category}: {i+1}/{count} completed")
                    print(f"  - Overall: {total_generated}/{total_count} ({total_generated/total_count*100:.1f}%)")
                    print(f"  - Avg time per transcript: {avg_time:.2f}s")
                    print(f"  - Est. time remaining: {remaining/60:.1f} minutes")
                
            except Exception as e:
                print(f"\n⚠️  Error generating transcript {i+1} for {category}: {e}")
                print("Continuing with next transcript...")
                continue
        
        print(f"\n✅ Completed {category}: {count} transcripts generated")
    
    # Final summary
    end_time = datetime.now()
    total_time = (end_time - start_time).total_seconds()
    
    print("\n" + "=" * 80)
    print("🎉 GENERATION COMPLETE!")
    print("=" * 80)
    print(f"\nTotal transcripts generated: {total_generated}/{total_count}")
    print(f"Total time: {total_time/60:.2f} minutes ({total_time:.1f} seconds)")
    print(f"Average time per transcript: {total_time/total_generated:.2f} seconds")
    
    print("\n📁 Files saved in:")
    for category in category_counts.keys():
        category_dir = Path(__file__).parent / category
        print(f"  - {category_dir}")
    
    print("\n" + "=" * 80)
    
    return 0


if __name__ == "__main__":
    try:
        exit_code = generate_bulk_with_ratio()
        exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

