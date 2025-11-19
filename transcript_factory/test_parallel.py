"""
Quick test script for parallel generation
Generates just 5 transcripts to test if the parallel code works
"""

import asyncio
from generate_bulk_transcripts_parallel import ParallelTranscriptFactory
from datetime import datetime


async def test_parallel():
    """Test with just a few transcripts."""
    
    print("=" * 80)
    print("PARALLEL GENERATION TEST")
    print("=" * 80)
    print("\nGenerating 5 test transcripts...")
    print("  - technical_support: 3")
    print("  - billing_inquiry: 1")
    print("  - account_management: 1")
    print()
    
    try:
        factory = ParallelTranscriptFactory(max_concurrent=5)
        print("✓ Factory initialized")
        print(f"  - API Key: {'*' * 20}{factory.api_key[-4:]}")
        print(f"  - Max concurrent: {factory.max_concurrent}")
        print(f"  - Requests per minute: {factory.requests_per_minute}")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return 1
    
    start_time = datetime.now()
    
    try:
        print("Starting generation...\n")
        
        # Test technical_support
        print("1. Generating technical_support transcripts...")
        results1 = await factory.generate_batch("technical_support", 3, start_index=1)
        print(f"   ✓ Got {len(results1)} results")
        
        # Test billing_inquiry
        print("2. Generating billing_inquiry transcript...")
        results2 = await factory.generate_batch("billing_inquiry", 1, start_index=1)
        print(f"   ✓ Got {len(results2)} results")
        
        # Test account_management
        print("3. Generating account_management transcript...")
        results3 = await factory.generate_batch("account_management", 1, start_index=1)
        print(f"   ✓ Got {len(results3)} results")
        
        # Save results
        print("\nSaving transcripts...")
        all_results = results1 + results2 + results3
        for category, transcript, index in all_results:
            filepath = factory.save_transcript(category, transcript, index)
            print(f"   ✓ Saved: {filepath.name}")
        
        elapsed = (datetime.now() - start_time).total_seconds()
        
        print("\n" + "=" * 80)
        print("✅ TEST SUCCESSFUL!")
        print("=" * 80)
        print(f"\nGenerated: {len(all_results)} transcripts")
        print(f"Errors: {factory.stats['errors']}")
        print(f"Time: {elapsed:.2f} seconds")
        print(f"Rate: {len(all_results)/elapsed:.2f} transcripts/second")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(test_parallel())
        exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        exit(1)

