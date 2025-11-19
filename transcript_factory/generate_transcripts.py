"""
Synthetic Transcript Generator using Anthropic API
==================================================
This script generates synthetic call transcripts for different categories
using the Anthropic Claude API.
"""

import os
import anthropic
from datetime import datetime
from pathlib import Path


class TranscriptFactory:
    """Factory for generating synthetic call transcripts."""
    
    CATEGORIES = [
        "billing_inquiry",
        "technical_support",
        "account_management",
        "complaint",
        "sales_inquiry",
        "service_activation"
    ]
    
    # Map categories to their corresponding detail files
    CATEGORY_DETAILS_MAP = {
        "billing_inquiry": "billing_details.txt",
        "technical_support": "outage_details.txt",
        "account_management": "upgrade_details.txt",
        "complaint": "billing_details.txt",
        "sales_inquiry": "upgrade_details.txt",
        "service_activation": "upgrade_details.txt"
    }
    
    def __init__(self, api_key=None):
        """Initialize the factory with Anthropic API key."""
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found. Set it as environment variable or pass to constructor.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.base_dir = Path(__file__).parent
        self.prompt_template = self._load_prompt()
    
    def _load_prompt(self):
        """Load the prompt template from prompt.txt"""
        # Look for prompt.txt in parent directory's prompts folder
        prompt_path = self.base_dir.parent / "prompts" / "prompt.txt"
        if not prompt_path.exists():
            # Fallback to local directory
            prompt_path = self.base_dir / "prompt.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    
    def _load_call_details(self, category):
        """Load call details for the given category."""
        if category not in self.CATEGORY_DETAILS_MAP:
            raise ValueError(f"No call details mapped for category: {category}")
        
        details_file = self.CATEGORY_DETAILS_MAP[category]
        details_path = self.base_dir.parent / "prompts" / "call_category" / details_file
        
        with open(details_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    
    def generate_transcript(self, category, model="claude-haiku-4-5-20251001", max_tokens=20000, temperature=1):
        """
        Generate a synthetic transcript for the given category.
        
        Args:
            category: Call category (e.g., "billing_inquiry")
            model: Anthropic model to use
            max_tokens: Maximum tokens in response
            temperature: Temperature for generation (default: 1)
            
        Returns:
            Generated transcript as string
        """
        if category not in self.CATEGORIES:
            raise ValueError(f"Invalid category. Must be one of: {self.CATEGORIES}")
        
        # Load call details for this category
        call_details = self._load_call_details(category)
        
        # Replace {{CALL_DETAILS}} placeholder in prompt
        prompt = self.prompt_template.replace("{{CALL_DETAILS}}", call_details)
        
        print(f"Generating transcript for category: {category}...")
        
        # Call Anthropic API using the format from api_call_sample.py
        message = self.client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        
        transcript = message.content[0].text
        return transcript
    
    def save_transcript(self, category, transcript, custom_filename=None):
        """
        Save transcript to the appropriate category directory.
        
        Args:
            category: Call category
            transcript: Generated transcript text
            custom_filename: Optional custom filename (without extension)
        """
        category_dir = self.base_dir / category
        
        if not category_dir.exists():
            raise ValueError(f"Category directory not found: {category_dir}")
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if custom_filename:
            filename = f"{custom_filename}.txt"
        else:
            filename = f"transcript_{timestamp}.txt"
        
        filepath = category_dir / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(transcript)
        
        print(f"Saved transcript to: {filepath}")
        return filepath
    
    def generate_batch(self, category, count=5):
        """
        Generate multiple transcripts for a category.
        
        Args:
            category: Call category
            count: Number of transcripts to generate
        """
        print(f"\nGenerating {count} transcripts for {category}...")
        
        for i in range(count):
            print(f"\n--- Transcript {i+1}/{count} ---")
            transcript = self.generate_transcript(category)
            self.save_transcript(category, transcript)
        
        print(f"\n✅ Completed generating {count} transcripts for {category}")
    
    def generate_all_categories(self, count_per_category=3):
        """
        Generate transcripts for all categories.
        
        Args:
            count_per_category: Number of transcripts per category
        """
        print(f"\n🚀 Starting bulk generation: {count_per_category} transcripts per category")
        
        for category in self.CATEGORIES:
            self.generate_batch(category, count_per_category)
        
        print(f"\n🎉 All done! Generated {len(self.CATEGORIES) * count_per_category} total transcripts")


def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate synthetic call transcripts")
    parser.add_argument("--category", choices=TranscriptFactory.CATEGORIES, 
                       help="Category to generate transcripts for")
    parser.add_argument("--count", type=int, default=1, 
                       help="Number of transcripts to generate")
    parser.add_argument("--all", action="store_true", 
                       help="Generate for all categories")
    parser.add_argument("--api-key", help="Anthropic API key (or set ANTHROPIC_API_KEY env var)")
    
    args = parser.parse_args()
    
    try:
        factory = TranscriptFactory(api_key=args.api_key)
        
        if args.all:
            factory.generate_all_categories(count_per_category=args.count)
        elif args.category:
            factory.generate_batch(args.category, count=args.count)
        else:
            print("Please specify --category or --all")
            parser.print_help()
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

