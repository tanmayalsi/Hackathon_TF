# 🚀 ThreadForge - AI-Powered Customer Intelligence Dashboard

An enterprise-grade dashboard that combines outage detection, social media analytics, and AI-powered churn prediction to help telecom companies proactively retain customers and improve service quality.

![ThreadForge Dashboard](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 1. 🗺️ Outage Dashboard
- **Real-time anomaly detection** from call transcripts and volume
- **Interactive geographic mapping** of service issues by ZIP code
- **Timeline visualization** of technical support calls
- **AI-powered correlation** between call spikes and outages
- Chat with AI to ask questions about outage patterns

### 2. 📱 Social Media Analytics
- **Multi-platform monitoring** (Twitter, Facebook, Instagram, Reddit)
- **Sentiment trend analysis** with time-series visualization
- **AI-generated action items** from customer feedback
- **Interactive feed** with filtering and search
- **Conversational AI chat** to query social media insights
- **Auto-response generator** for customer engagement

### 3. 🧠 Customer Intelligence & Churn Prediction
- **AI-powered churn risk scoring** (0-100 scale)
- **Transcript analysis** to detect cancellation signals
- **Social sentiment correlation** with customer behavior
- **Personalized retention strategies** for at-risk customers
- **Geographic pattern recognition** for service issues
- **ROI calculator** showing cost to save vs. customer lifetime value

## 🎯 Use Cases

- **Customer Success Teams**: Identify at-risk customers before they churn
- **Operations**: Detect service outages early from call patterns
- **Social Media Managers**: Respond to customer feedback efficiently
- **Product Teams**: Understand top customer pain points
- **Executive Leadership**: Monitor customer health metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Data Visualization**: Chart.js, Leaflet (maps)
- **State Management**: TanStack Query (React Query)
- **Database**: PostgreSQL, Prisma ORM
- **AI**: Claude 3 Opus (Anthropic)
- **Data Processing**: CSV parsing, real-time aggregation

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (with sample data loaded)
- Anthropic API key (for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/threadforge-dashboard.git
cd threadforge-dashboard/thread-forge-hackathon-main
```

### 2. Install Dependencies

```bash
cd outage-dashboard-nextjs
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=team_thread_forge"

# Anthropic API Key (Get from https://console.anthropic.com/)
ANTHROPIC_API_KEY="sk-ant-api03-your-api-key-here"
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# (Optional) Push schema to database
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Data Sources

The dashboard uses three main data sources:

1. **Call Transcripts** (`team_thread_forge.transcript_data`)
   - AI-generated customer support call transcripts
   - Categories: technical_support, billing_inquiry, account_management

2. **Call Data** (`team_thread_forge.call_data`)
   - Call metadata: start/end times, customer IDs, call IDs

3. **Social Media Posts** (`data/social_media_data.csv`)
   - 1000+ social media comments from multiple platforms
   - Categories: Service Issue, Billing Issue, Positive Feedback, etc.

4. **Customer Information** (`public.customers`)
   - Customer profiles with service plans and locations

## 🎨 Dashboard Tabs

### Outage Dashboard
Navigate to the main page to view:
- Geographic heat map of technical support calls
- Timeline of call volume anomalies
- Detailed transcripts for affected areas
- AI chat interface for outage insights

### Social Media
Navigate to `/social-media` to access:
- Sentiment trends (positive/negative/neutral)
- Category breakdown (pie chart)
- Platform distribution
- Location-based sentiment analysis
- AI action items generator
- Interactive feed with filters
- Response draft generator

### Customer Intelligence
Navigate to `/customer-intelligence` to see:
- At-risk customer list (sortable by risk score)
- Batch churn analysis
- Top churn reasons and patterns
- Geographic churn distribution
- Detailed customer analysis modal
- AI-generated retention strategies

## 🔒 Security & Privacy

- ✅ **Read-only database access** - No writes to production data
- ✅ **API keys protected** - `.env` files excluded from Git
- ✅ **No sensitive data in code** - All credentials via environment variables
- ✅ **Proper `.gitignore`** - node_modules, logs, and sensitive files excluded

## 🌟 Key AI Features

### 1. Churn Prediction Algorithm
```typescript
// Analyzes multiple signals:
- Transcript keyword detection ("cancel", "switching", "frustrated")
- Call frequency patterns (5+ calls = warning)
- Technical support repetition (3+ tech calls = risk)
- Social media sentiment correlation
- Time-series sentiment decline
```

### 2. Action Items Generation
- Scans 200 most recent social media posts
- Groups similar issues
- Prioritizes by urgency and impact
- Assigns recommended department

### 3. Retention Strategies
- Root cause analysis from transcripts
- Recommended interventions with costs
- Success probability estimation
- ROI calculation

## 📈 Performance

- **Fast CSV loading** with in-memory caching
- **Optimized SQL queries** with indexes and aggregations
- **Client-side caching** via React Query
- **Lazy loading** for large datasets
- **Responsive design** for all screen sizes

## 🤝 Contributing

This project was built for a hackathon. Contributions welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Anthropic** for the Claude API
- **Next.js** team for the amazing framework
- **Vercel** for hosting platform
- **Prisma** for database tooling

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review setup guides: `QUICKSTART.md`, `SETUP_INSTRUCTIONS.md`

---

**Built with ❤️ for improving customer experience through AI**
