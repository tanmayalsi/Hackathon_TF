"""
Example usage of the TranscriptFactory
======================================
This file demonstrates different ways to use the transcript generator.
"""

from generate_transcripts import TranscriptFactory
import os


def example_single_transcript():
    """Generate a single transcript."""
    print("\n=== Example 1: Generate Single Transcript ===")
    
    factory = TranscriptFactory()
    
    # Generate one billing inquiry transcript
    transcript = factory.generate_transcript("billing_inquiry")
    
    # Print preview (first 500 characters)
    print("\nGenerated transcript preview:")
    print("-" * 60)
    print(transcript[:500] + "...")
    print("-" * 60)
    
    # Save it
    filepath = factory.save_transcript("billing_inquiry", transcript)
    print(f"\n✅ Saved to: {filepath}")


def example_batch_generation():
    """Generate multiple transcripts for one category."""
    print("\n=== Example 2: Batch Generation ===")
    
    factory = TranscriptFactory()
    
    # Generate 3 technical support transcripts
    factory.generate_batch("technical_support", count=3)


def example_all_categories():
    """Generate transcripts for all categories."""
    print("\n=== Example 3: Generate All Categories ===")
    
    factory = TranscriptFactory()
    
    # Generate 2 transcripts for each category
    factory.generate_all_categories(count_per_category=2)


def example_custom_model():
    """Use a different Claude model."""
    print("\n=== Example 4: Custom Model ===")
    
    factory = TranscriptFactory()
    
    # Use Claude 3 Opus for higher quality (more expensive)
    transcript = factory.generate_transcript(
        "complaint",
        model="claude-3-opus-20240229",
        max_tokens=5000
    )
    
    factory.save_transcript("complaint", transcript, custom_filename="high_quality_complaint")


def example_with_custom_filename():
    """Save with a custom filename."""
    print("\n=== Example 5: Custom Filename ===")
    
    factory = TranscriptFactory()
    
    transcript = factory.generate_transcript("sales_inquiry")
    
    # Save with custom name
    factory.save_transcript(
        "sales_inquiry",
        transcript,
        custom_filename="example_sales_call_001"
    )


if __name__ == "__main__":
    print("=" * 60)
    print("Transcript Factory - Example Usage")
    print("=" * 60)
    
    # Check if API key is set
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n⚠️  WARNING: ANTHROPIC_API_KEY environment variable not set!")
        print("Please set it before running examples:")
        print("  Windows: $env:ANTHROPIC_API_KEY='your-key-here'")
        print("  Linux/Mac: export ANTHROPIC_API_KEY='your-key-here'")
        exit(1)
    
    # Uncomment the example you want to run:
    
    # example_single_transcript()
    # example_batch_generation()
    # example_all_categories()
    # example_custom_model()
    # example_with_custom_filename()
    
    print("\n💡 Uncomment an example function in the code to run it!")

