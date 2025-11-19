# Synthetic Transcript Data Factory

This directory contains tools for generating realistic synthetic call transcripts using the Anthropic API.

## Directory Structure

```
hackathon/
├── prompts/
│   ├── prompt.txt              # Main prompt template
│   └── call_category/          # Call scenario details
│       ├── billing_details.txt
│       ├── outage_details.txt
│       └── upgrade_details.txt
└── transcript_factory/
    ├── generate_transcripts.py      # Core transcript generator class
    ├── generate_bulk_transcripts.py # Bulk generation script (1,000 transcripts)
    ├── requirements.txt             # Python dependencies
    ├── README.md                    # This file
    ├── billing_inquiry/             # Generated billing transcripts
    ├── technical_support/           # Generated tech support transcripts (outages)
    ├── account_management/          # Generated account mgmt transcripts (upgrades)
    ├── complaint/                   # Generated complaint transcripts
    ├── sales_inquiry/              # Generated sales transcripts
    └── service_activation/         # Generated activation transcripts
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your Anthropic API key:**
   
   **Option A - Environment Variable (Recommended):**
   ```bash
   # Windows PowerShell
   $env:ANTHROPIC_API_KEY="your-api-key-here"
   
   # Windows CMD
   set ANTHROPIC_API_KEY=your-api-key-here
   
   # Linux/Mac
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
   
   **Option B - Pass as argument:**
   ```bash
   python generate_transcripts.py --api-key "your-api-key-here" --category billing_inquiry
   ```

## Usage

### Generate 1,000 transcripts with specific ratio (Quick Start)

For the hackathon dataset, run the bulk generation script:

```bash
python generate_bulk_transcripts.py
```

This will generate **1,000 transcripts** with the following distribution:
- **700** outage/technical support calls
- **150** billing inquiry calls  
- **150** upgrade/account management calls

The script includes:
- Progress tracking every 10 transcripts
- Time estimates for completion
- Error handling and recovery
- Automatic file naming (e.g., `technical_support_0001.txt`)

### Generate a single transcript

```bash
python generate_transcripts.py --category billing_inquiry
```

### Generate multiple transcripts for one category

```bash
python generate_transcripts.py --category technical_support --count 5
```

### Generate transcripts for all categories

```bash
python generate_transcripts.py --all --count 3
```

This will generate 3 transcripts for each of the 6 categories (18 total).

## Categories

The factory supports the following call categories:

1. **billing_inquiry** - Questions about bills, charges, payments
2. **technical_support** - Technical issues and troubleshooting (outages)
3. **account_management** - Account updates, changes, profile management (upgrades)
4. **complaint** - Customer complaints and escalations
5. **sales_inquiry** - Questions about products, services, pricing
6. **service_activation** - New service setup and activation

### Call Details Mapping

Each category is mapped to specific call scenarios from `prompts/call_category/`:

- `technical_support` → `outage_details.txt` (Internet not working, troubleshooting fails)
- `billing_inquiry` → `billing_details.txt` (Dispute charges, price increases)
- `account_management` → `upgrade_details.txt` (Customer wants to upgrade service)
- `complaint` → `billing_details.txt` (Billing-related complaints)
- `sales_inquiry` → `upgrade_details.txt` (Upgrade/sales scenarios)
- `service_activation` → `upgrade_details.txt` (New service setup)

## Customizing the Prompt

Edit `prompt.txt` to customize how transcripts are generated. The prompt template includes:
- Format guidelines
- Tone specifications per category
- Structure requirements
- Example format

The `{category}` placeholder is automatically replaced with the selected category.

## Output Format

Generated transcripts are saved as text files in their respective category directories with timestamps:
```
transcript_20241117_113045.txt
```

Each transcript includes:
- Timestamps for each speaker turn
- Natural conversation flow
- Realistic details (names, account numbers, etc.)
- Appropriate tone for the category

## Python API Usage

You can also use the `TranscriptFactory` class in your own Python code:

```python
from generate_transcripts import TranscriptFactory

# Initialize factory
factory = TranscriptFactory(api_key="your-api-key")

# Generate a single transcript
transcript = factory.generate_transcript("billing_inquiry")

# Save it
factory.save_transcript("billing_inquiry", transcript)

# Generate a batch
factory.generate_batch("technical_support", count=10)

# Generate for all categories
factory.generate_all_categories(count_per_category=5)
```

## Notes

- Each API call generates a unique transcript
- The script uses Claude 3.5 Sonnet by default (configurable)
- Transcripts are typically 15-30 exchanges long
- Cost: ~$0.003-0.015 per transcript (depending on length)

### Bulk Generation Estimates

For generating 1,000 transcripts:
- **Time**: ~45-90 minutes (varies based on API response time)
- **Cost**: ~$3-15 (depending on transcript length and API pricing)
- **Average**: ~2-5 seconds per transcript
- Progress is saved incrementally, so you can stop/resume if needed

## Example Output

Based on the prompt format, transcripts look like:

```
Agent: Thank you for calling Frontier Communications, my name is Sarah. How can I help you today?

Customer: Hi Sarah, um... I'm calling about my internet. It's not working at all.

Agent: I'm sorry to hear you're having trouble with your internet service. Let me pull up your account. Can I have your account number or the phone number associated with the account?

Customer: Sure, it's... (pause) 555-0123.

Agent: (typing sounds) Thank you. Okay, I have your account here, Mr. Johnson. Let me run a quick diagnostic on your modem...
...
```

Transcripts include:
- Natural conversation flow with filler words
- Action descriptions in parentheses
- Realistic pauses and hesitations
- No timestamps (per prompt requirements)

