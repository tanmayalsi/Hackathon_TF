# Outage Explorer Feature

## Overview

The Outage Explorer feature allows users to dive deep into individual outages by viewing all associated call transcripts and interacting with them using Claude AI.

## How to Use

1. **Select an Outage**: On the 2D map view, click on any outage marker (colored circle) to open a popup
2. **Explore**: Click the "Explore outage" button in the popup
3. **View Transcripts**: A right-side pane will slide in showing:
   - Outage metadata (ZIP code, city, call count)
   - Collapsible list of all call transcripts for that outage
   - Each transcript shows call ID, duration, timestamp, and customer location
4. **Chat with Claude**: At the bottom of the pane, use the chat interface to ask questions about the outage:
   - "What are the common issues reported?"
   - "Summarize the main problems"
   - "How many customers mentioned router issues?"
   - Any other questions about patterns or specific details

## Setup Requirements

### Environment Variables

You need to add your Anthropic API key to the environment:

1. Create a `.env.local` file in the `outage-dashboard-nextjs` directory
2. Add the following line:
   ```
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```
3. Restart the development server

### Getting an Anthropic API Key

1. Sign up at [https://console.anthropic.com/](https://console.anthropic.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key to your `.env.local` file

## Technical Details

### API Routes

- **`/api/outage-transcripts`**: Fetches all call transcripts for a specific ZIP code and time range
  - Query params: `zip`, `hours` (or `start_date`/`end_date`)
  - Returns: Array of transcripts with call metadata

- **`/api/outage-chat`**: Handles Claude AI chat interactions
  - Method: POST
  - Body: `{ zip, hours, messages }`
  - Uses Claude 3.5 Haiku model for fast, cost-effective responses

### Components

- **`OutageDetailsPane`**: Main component for the slide-in pane
  - Manages transcript list state
  - Handles chat message flow
  - Auto-scrolls chat history

- **`OutageMap`**: Updated to include "Explore outage" button in popups
  - Accepts `onSelectOutage` callback prop

### Data Flow

1. User clicks "Explore outage" → `setSelectedOutage()` called
2. `OutageDetailsPane` mounts and fetches transcripts via `/api/outage-transcripts`
3. User sends chat message → POST to `/api/outage-chat`
4. API fetches transcripts, builds context, calls Anthropic API
5. Response displayed in chat interface

## Performance Considerations

- Transcripts are limited to 2000 characters each when sent to Claude to manage token usage
- Maximum of 50 transcripts per outage sent to Claude
- Chat uses Claude 3.5 Haiku for optimal speed and cost

## Future Enhancements

- Streaming responses from Claude for better UX
- Transcript search/filter functionality
- Export chat history
- Sentiment analysis visualization
- Multi-outage comparison

