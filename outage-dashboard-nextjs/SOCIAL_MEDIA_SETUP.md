# Social Media Analytics Setup Guide

This guide will help you set up and run the new Social Media Analytics feature.

## Prerequisites

Before starting, ensure you have:
- ✅ PostgreSQL database running
- ✅ Node.js 18+ installed
- ✅ Anthropic API key (Claude)
- ✅ Existing outage dashboard working

## Setup Steps

### Step 1: Install Dependencies

Navigate to the outage-dashboard-nextjs directory and install the new dependencies:

```bash
cd outage-dashboard-nextjs
npm install
```

This will install:
- `csv-parse` - for importing CSV data
- `tsx` - for running TypeScript scripts

### Step 2: Update Prisma Schema

The Prisma schema has been updated with a new `SocialMediaData` model. Generate the Prisma client:

```bash
npx prisma generate
```

Then push the schema to your database:

```bash
npx prisma db push
```

This will create the `social_media_data` table in your `public` schema.

### Step 3: Configure Anthropic API Key

Make sure your `.env` file includes the Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

If you don't have a key yet:
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Generate an API key
4. Add it to your `.env` file

### Step 4: Import Social Media Data

Run the import script to load the CSV data into the database:

```bash
npm run import-social-media
```

This will:
- Read `../data/social_media_data.csv`
- Clear existing social media data (if any)
- Import all ~1000 posts into the database
- Verify the import

Expected output:
```
Starting social media data import...
Parsed 1002 records from CSV
Clearing existing social media data...
Inserting data into database...
Inserted batch 1/11
Inserted batch 2/11
...
✅ Social media data import completed successfully!
Total records imported: 1002
Verification: Database now contains 1002 social media posts
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Features Overview

### Navigation

The dashboard now has two tabs:
- **Outage Dashboard** - Original technical support analytics
- **Social Media** - New social media analytics

### Social Media Tab Components

#### 1. Sentiment & Trends Dashboard
- Key metrics cards (Total Posts, Positive %, Negative %, Neutral %)
- Sentiment over time line chart
- Category breakdown doughnut chart
- Platform distribution bar chart

#### 2. AI Action Items Panel
- Click "Generate" to create AI-powered action items
- Items are prioritized (urgent/high/medium/low)
- Grouped by department (Sales/Support/PR/Tech)
- Expandable to view related posts
- Mark as done or dismiss

#### 3. Social Media Feed
- Filterable by platform, category, location
- Search functionality
- Select multiple posts
- Pagination

#### 4. Chat Interface
- Ask Claude questions about social media data
- Pre-filled suggested questions
- Context-aware responses based on current filters
- Examples:
  - "What are the top 3 complaints this week?"
  - "Show me all sales opportunities"
  - "Which locations have the most service issues?"

#### 5. Response Generator
- Select posts from the feed
- Choose tone (professional/empathetic/promotional)
- Generate AI-powered responses
- Copy responses to clipboard
- Perfect for social media managers

## API Endpoints

### GET `/api/social-media-data`
Fetch social media posts with filters
- Query params: `platform`, `category`, `location`, `hours`, `page`, `pageSize`, `search`

### GET `/api/social-sentiment`
Get sentiment analysis and aggregated statistics
- Query params: `hours`

### POST `/api/social-action-items`
Generate AI-powered action items
- Body: `{ hours: number }`

### POST `/api/social-chat`
Conversational AI interface
- Body: `{ messages: ChatMessage[], filters?: {...} }`

### POST `/api/social-response-generator`
Generate response drafts
- Body: `{ postIds: number[], tone?: string, template?: string }`

## Data Structure

The `social_media_data` table contains:
- `id` - Unique identifier
- `username` - Social media username
- `social_media` - Platform (Twitter/Reddit/Facebook)
- `comment` - Post content
- `location` - User location
- `timestamp` - Post timestamp
- `category` - Post category (8 categories)

### Categories
1. **Service Issue** - Technical problems, outages
2. **Billing Issue** - Charges, pricing concerns
3. **Customer Service Complaint** - Support quality
4. **Positive Feedback** - Happy customers
5. **Sales Opportunity** - Inquiries about plans
6. **Feature Request** - New feature suggestions
7. **Network Coverage** - Coverage requests
8. **Corporate/PR Issue** - Company policies

## Time Range Options

Both dashboards support these time ranges:
- Last Hour
- Last 6 Hours
- Last 24 Hours (default for outage)
- Last Week (default for social media)
- Last Month

## Troubleshooting

### Import Script Fails
```bash
# Make sure you're in the correct directory
cd outage-dashboard-nextjs

# Check if the CSV file exists
ls -la ../data/social_media_data.csv

# Verify database connection
npx prisma studio
```

### Prisma Client Not Found
```bash
npx prisma generate
```

### API Errors (500)
Check your `.env` file has:
- Correct `DATABASE_URL`
- Valid `ANTHROPIC_API_KEY`

### No Data Showing
1. Verify import completed successfully
2. Check browser console for errors
3. Check API responses in Network tab
4. Try refreshing the page

### Claude API Rate Limits
If you hit rate limits:
- The action items generator uses Claude Sonnet (more powerful)
- The chat uses Claude Haiku (faster, cheaper)
- Consider spacing out requests

## Development Tips

### Testing Different Filters
Try these combinations:
- Platform: Twitter + Category: Service Issue
- Location: "San Francisco" + Last 24 Hours
- Category: Sales Opportunity (find leads!)

### Suggested Chat Questions
- "What are the most common complaints?"
- "How many billing issues in the last 7 days?"
- "Which platforms have the most engagement?"
- "Summarize positive feedback"

### Response Generator Tips
- Use "empathetic" tone for complaints
- Use "promotional" tone for inquiries
- Use "professional" tone for general responses
- Select similar posts together for consistent responses

## Architecture Notes

### Frontend
- React 18 with Next.js 14 App Router
- Framer Motion for animations
- Chart.js for data visualization
- TanStack Query for data fetching/caching

### Backend
- Next.js API routes
- Prisma ORM for database queries
- Claude API integration
- PostgreSQL database

### AI Integration
- Claude Sonnet 4 for action items (complex reasoning)
- Claude Haiku 4.5 for chat (fast responses)
- Structured prompts for consistent output
- JSON parsing for action items and responses

## Performance Considerations

- Posts are limited to 150-200 for AI context
- Chat responses cached by TanStack Query
- Pagination for feed (10 posts per page)
- Auto-refresh every 60 seconds

## Security Notes

This is designed for internal use. For production:
- Add authentication
- Implement rate limiting
- Add input validation
- Set up CORS properly
- Use environment-specific API keys

## Next Steps

Once everything is working:
1. Explore the sentiment trends
2. Generate action items for your team
3. Try the chat interface
4. Generate responses for selected posts
5. Customize the time ranges and filters

## Support

For issues:
1. Check this guide
2. Review the code comments
3. Check browser console for errors
4. Verify API responses in Network tab
5. Check database contents with `npx prisma studio`

---

**Built with ❤️ using Next.js 14, React, TypeScript, Claude AI, and PostgreSQL**

**Last Updated:** 2025-11-18

