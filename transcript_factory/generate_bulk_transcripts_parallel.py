"""
Parallel Bulk Transcript Generator
===================================
Generates 1,000 transcripts with specific category ratios using parallel requests:
- 700 outage (technical_support)
- 150 billing (billing_inquiry)
- 150 upgrade (account_management)

Uses asyncio for concurrent API calls with rate limiting to respect:
- 4K requests per minute
- 4M input tokens per minute
"""

import os
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import anthropic
from collections import defaultdict


class ParallelTranscriptFactory:
    """Factory for generating synthetic call transcripts with parallel processing."""
    
    CATEGORY_DETAILS_MAP = {
        "billing_inquiry": "billing_details.txt",
        "technical_support": "outage_details.txt",
        "account_management": "upgrade_details.txt",
        "complaint": "billing_details.txt",
        "sales_inquiry": "upgrade_details.txt",
        "service_activation": "upgrade_details.txt"
    }
    
    def __init__(self, api_key=None, max_concurrent=50, requests_per_minute=3800):
        """
        Initialize the factory with Anthropic API key and rate limiting.
        
        Args:
            api_key: Anthropic API key (defaults to env var)
            max_concurrent: Maximum concurrent requests (default: 50)
            requests_per_minute: Max requests per minute (default: 3800, under 4K limit)
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found. Set it as environment variable or pass to constructor.")
        
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        self.base_dir = Path(__file__).parent
        self.prompt_template = self._load_prompt()
        
        # Rate limiting
        self.max_concurrent = max_concurrent
        self.requests_per_minute = requests_per_minute
        self.min_delay_between_requests = 60.0 / requests_per_minute  # seconds between requests
        
        # Semaphore for controlling concurrent requests
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Stats tracking
        self.stats = {
            "total_generated": 0,
            "errors": 0,
            "by_category": defaultdict(int)
        }
    
    def _load_prompt(self):
        """Load the prompt template from prompt.txt"""
        prompt_path = self.base_dir.parent / "prompts" / "prompt.txt"
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
    
    async def generate_transcript(
        self, 
        category: str, 
        index: int,
        model="claude-haiku-4-5-20251001",
        max_tokens=20000,
        temperature=1
    ) -> Tuple[str, str, int]:
        """
        Generate a single transcript asynchronously.
        
        Args:
            category: Call category
            index: Index number for this transcript
            model: Anthropic model to use
            max_tokens: Maximum tokens in response
            temperature: Temperature for generation
            
        Returns:
            Tuple of (category, transcript_text, index)
        """

        # Use semaphore to limit concurrent requests
        async with self.semaphore:
            try:
                # Debug: Log when request starts
                if index <= 3 or index % 100 == 0:
                    print(f"🔄 Starting {category} #{index}...", flush=True)
                
                # Load call details for this category
                call_details = self._load_call_details(category)
                
                # Replace {{CALL_DETAILS}} placeholder in prompt
                prompt = self.prompt_template.replace("{{CALL_DETAILS}}", call_details)
                
                # Call Anthropic API asynchronously with timeout
                message = await asyncio.wait_for(
                    self.client.messages.create(
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
                    ),
                    timeout=60.0  # 60 second timeout per request
                )
                
                # Debug: Log when request completes
                if index <= 3 or index % 100 == 0:
                    print(f"✅ Completed {category} #{index}", flush=True)
                
                # Update stats immediately when a transcript completes
                self.stats["total_generated"] += 1
                self.stats["by_category"][category] += 1
                
                transcript = message.content[0].text
                return category, transcript, index
                
            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout generating {category} #{index} (60s limit exceeded)")
                self.stats["errors"] += 1
                raise
            except anthropic.APIError as e:
                print(f"\n⚠️  API Error generating {category} #{index}: {e}")
                self.stats["errors"] += 1
                raise
            except Exception as e:
                print(f"\n⚠️  Unexpected error generating {category} #{index}: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                self.stats["errors"] += 1
                raise
    
    def get_existing_transcript_count(self, category: str) -> int:
        """
        Count how many transcripts already exist for a category.
        
        Args:
            category: Call category
            
        Returns:
            Count of existing transcript files
        """
        category_dir = self.base_dir / category
        if not category_dir.exists():
            return 0
        
        # Count files matching the pattern: {category}_XXXX.txt
        existing_files = list(category_dir.glob(f"{category}_*.txt"))
        return len(existing_files)
    
    def get_next_index(self, category: str) -> int:
        """
        Get the next available index for a category.
        
        Args:
            category: Call category
            
        Returns:
            Next available index number (1-based)
        """
        category_dir = self.base_dir / category
        if not category_dir.exists():
            return 1
        
        # Find all existing files and extract their indices
        existing_files = list(category_dir.glob(f"{category}_*.txt"))
        if not existing_files:
            return 1
        
        # Extract the numeric indices from filenames
        indices = []
        for file in existing_files:
            try:
                # Extract number from filename like "technical_support_0001.txt"
                filename = file.stem  # Gets filename without extension
                number_part = filename.split('_')[-1]  # Get last part after underscore
                indices.append(int(number_part))
            except (ValueError, IndexError):
                continue
        
        if not indices:
            return 1
        
        # Return the next index after the highest existing one
        return max(indices) + 1
    
    def save_transcript(self, category: str, transcript: str, index: int):
        """
        Save transcript to the appropriate category directory.
        
        Args:
            category: Call category
            transcript: Generated transcript text
            index: Index number for filename
        """
        category_dir = self.base_dir / category
        category_dir.mkdir(exist_ok=True)
        
        filename = f"{category}_{index:04d}.txt"
        filepath = category_dir / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(transcript)
        
        return filepath
    
    async def generate_batch(
        self, 
        category: str, 
        count: int,
        start_index: int = 1
    ) -> List[Tuple[str, str, int]]:
        """
        Generate multiple transcripts for a category in parallel.
        
        Args:
            category: Call category
            count: Number of transcripts to generate
            start_index: Starting index for numbering
            
        Returns:
            List of (category, transcript, index) tuples
        """
        tasks = [
            self.generate_transcript(category, i)
            for i in range(start_index, start_index + count)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions (errors already logged and stats already updated in generate_transcript)
        successful_results = []
        for result in results:
            if isinstance(result, Exception):
                continue  # Already logged in generate_transcript
            else:
                successful_results.append(result)
                # Stats already updated in generate_transcript
        
        return successful_results


async def generate_all_parallel():
    """Generate all 1,000 transcripts in parallel with progress tracking."""
    
    # Define the TARGET counts for each category
    target_category_counts = {
        "technical_support": 1400,  # outage calls
        "billing_inquiry": 300,    # billing calls
        "account_management": 300  # upgrade calls
    }
    
    # Initialize factory first to check existing files
    try:
        factory = ParallelTranscriptFactory()
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease set your ANTHROPIC_API_KEY environment variable:")
        print("  Windows: set ANTHROPIC_API_KEY=your_api_key_here")
        print("  Linux/Mac: export ANTHROPIC_API_KEY=your_api_key_here")
        return 1
    
    # Check existing transcripts and calculate what needs to be generated
    print("=" * 80)
    print("PARALLEL BULK TRANSCRIPT GENERATION")
    print("=" * 80)
    print("\n🔍 Checking for existing transcripts...\n")
    
    category_counts = {}  # Actual counts to generate
    start_indices = {}    # Starting index for each category
    existing_counts = {}  # Existing transcript counts
    
    for category, target_count in target_category_counts.items():
        existing_count = factory.get_existing_transcript_count(category)
        existing_counts[category] = existing_count
        
        if existing_count >= target_count:
            print(f"  ✓ {category}: {existing_count}/{target_count} (target already met, skipping)")
            category_counts[category] = 0
            start_indices[category] = factory.get_next_index(category)
        else:
            needed = target_count - existing_count
            start_index = factory.get_next_index(category)
            category_counts[category] = needed
            start_indices[category] = start_index
            print(f"  ⚡ {category}: {existing_count}/{target_count} existing, will generate {needed} more (starting from #{start_index})")
    
    total_count = sum(category_counts.values())
    total_target = sum(target_category_counts.values())
    total_existing = sum(existing_counts.values())
    
    if total_count == 0:
        print("\n✅ All targets met! No new transcripts needed.")
        print("\n" + "=" * 80)
        return 0
    
    print(f"\n📊 Summary:")
    print(f"  - Total target: {total_target} transcripts")
    print(f"  - Already exist: {total_existing} transcripts")
    print(f"  - To generate: {total_count} transcripts")
    print(f"\nConcurrency settings:")
    print(f"  - Max concurrent requests: 50")
    print(f"  - Target rate: ~3,800 requests/minute")
    if total_count > 0:
        print(f"  - Expected completion time: ~{max(10, total_count/200):.0f}-{max(15, total_count/150):.0f} seconds")
    print("\n" + "=" * 80)
    
    # Test API connection first
    print("\n🔍 Testing API connection...")
    try:
        test_message = await factory.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": "Hello"}]
        )
        print("✅ API connection successful!")
    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        print("\nPlease check:")
        print("  1. Your ANTHROPIC_API_KEY is set correctly")
        print("  2. Your API key has sufficient credits")
        print("  3. You have internet connectivity")
        return 1
    
    start_time = datetime.now()
    
    # Create all tasks for all categories
    print("\n🚀 Starting parallel generation...\n")
    
    # Progress tracking task
    async def track_progress():
        """Display progress updates while generation is running."""
        last_count = 0
        start_progress_time = datetime.now()
        while True:
            await asyncio.sleep(2)  # Update every 2 seconds
            current_count = factory.stats["total_generated"]
            
            # Only show progress if count changed
            if current_count != last_count:
                elapsed = (datetime.now() - start_progress_time).total_seconds()
                if elapsed > 0:
                    rate = current_count / elapsed
                    remaining = total_count - current_count
                    eta = remaining / rate if rate > 0 else 0
                    
                    # Use newline instead of carriage return to avoid conflicts with debug messages
                    print(f"\n📊 Progress: {current_count}/{total_count} ({current_count/total_count*100:.1f}%) | "
                          f"Rate: {rate:.1f}/s | Errors: {factory.stats['errors']} | ETA: {eta:.0f}s")
            
            last_count = current_count
            
            # Stop when all done
            if current_count + factory.stats['errors'] >= total_count:
                break
    
    # Start progress tracking
    progress_task = asyncio.create_task(track_progress())
    
    try:
        # Execute all generation tasks concurrently (not sequentially!)
        print("Creating generation tasks...")
        
        # Create all batch tasks at once and gather them
        # Filter out categories with 0 count (already at target)
        categories_to_generate = {k: v for k, v in category_counts.items() if v > 0}
        categories_list = list(categories_to_generate.keys())
        batch_tasks = []
        
        for category in categories_list:
            count = category_counts[category]
            start_index = start_indices[category]
            print(f"  - Queuing {count} transcripts for {category} (starting from #{start_index})")
            # Create task objects (not just coroutines) to start execution
            task = asyncio.create_task(factory.generate_batch(category, count, start_index=start_index))
            batch_tasks.append(task)
        
        print("\n⏳ Generating all transcripts in parallel...\n")
        print(f"✓ Started {len(batch_tasks)} batch tasks")
        
        # Wait for ALL batches to complete concurrently using gather
        all_results = await asyncio.gather(*batch_tasks)
        
        # Map results back to categories
        results_by_category = {}
        for i, category in enumerate(categories_list):
            results_by_category[category] = all_results[i]
        
        print("\n✓ All generation tasks completed!")
        
    except Exception as e:
        print(f"\n\n❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # Stop progress tracking
        progress_task.cancel()
        try:
            await progress_task
        except asyncio.CancelledError:
            pass
    
    print("\n\n💾 Saving transcripts to disk...", end="", flush=True)
    
    # Save all results
    saved_count = 0
    for category, results in results_by_category.items():
        for cat, transcript, index in results:
            factory.save_transcript(cat, transcript, index)
            saved_count += 1
    
    print(f" ✅ Saved {saved_count} files")
    
    # Final summary
    end_time = datetime.now()
    total_time = (end_time - start_time).total_seconds()
    
    print("\n" + "=" * 80)
    print("🎉 GENERATION COMPLETE!")
    print("=" * 80)
    print(f"\nTotal transcripts generated: {factory.stats['total_generated']}/{total_count}")
    print(f"Errors: {factory.stats['errors']}")
    print(f"\nBreakdown by category:")
    for category in target_category_counts.keys():
        generated = factory.stats['by_category'][category]
        target = target_category_counts[category]
        existing = existing_counts[category]
        current_total = existing + generated
        print(f"  - {category}: {current_total}/{target} total ({existing} existing + {generated} new)")
    
    print(f"\n⏱️  Performance:")
    print(f"  - Total time: {total_time:.2f} seconds ({total_time/60:.2f} minutes)")
    if factory.stats['total_generated'] > 0:
        print(f"  - Average time per transcript: {total_time/factory.stats['total_generated']:.2f}s")
        print(f"  - Throughput: {factory.stats['total_generated']/total_time:.1f} transcripts/second")
    
    print("\n📁 Files saved in:")
    for category in target_category_counts.keys():
        category_dir = Path(__file__).parent / category
        count = len(list(category_dir.glob(f"{category}_*.txt")))
        print(f"  - {category_dir} ({count} files)")
    
    print("\n" + "=" * 80)
    
    return 0


def main():
    """Main entry point."""
    try:
        # Run the async function
        exit_code = asyncio.run(generate_all_parallel())
        return exit_code
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())

