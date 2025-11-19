# Outage Dashboard - Next.js Edition

A modern, real-time visualization dashboard for technical support calls featuring interactive 2D heat maps. Built with Next.js 14, React, TypeScript, Leaflet, and Tailwind CSS.

![Dashboard Preview](https://img.shields.io/badge/Status-Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue)
![React](https://img.shields.io/badge/React-18+-blue)

## 🚀 Features

### Core Functionality
- **Real-time Data Visualization** - Auto-refreshing every 30 seconds
- **Interactive 2D Heat Map** - Leaflet-based geographic visualization with color-coded intensity
- **Timeline Analytics** - Hourly call patterns with Chart.js
- **Live Statistics Dashboard** - Total calls, unique customers, average duration, and last call time
- **Flexible Time Ranges** - View data for last hour, 6 hours, 24 hours, week, or month

### Technical Highlights
- **Next.js 14** with App Router and Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive styling
- **Prisma ORM** for type-safe database queries
- **TanStack Query** for efficient data fetching and caching
- **Framer Motion** for smooth animations
- **Leaflet** for 2D mapping
- **Chart.js** for timeline charts

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ and npm/yarn/pnpm
- **PostgreSQL** database with existing data
- **Git** (optional, for version control)

## 🛠️ Installation

### Step 1: Install Node.js Dependencies

```bash
cd outage-dashboard-nextjs
npm install
```

Or with yarn:
```bash
yarn install
```

Or with pnpm:
```bash
pnpm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=team_thread_forge"

# PostgreSQL Connection Details
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application Configuration
PORT=3000
NODE_ENV=development

# Auto-refresh interval (milliseconds)
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=30000
```

### Step 3: Initialize Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

(Optional) If you need to sync your database schema:

```bash
npx prisma db push
```

### Step 4: Start Development Server

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Basic Operations

1. **View Dashboard** - Open http://localhost:3000 in your browser
2. **Change Time Range** - Click time range buttons (Last Hour, 6 Hours, 24 Hours, etc.)
3. **Manual Refresh** - Click the "Refresh" button to update data immediately
4. **Auto-Refresh** - Toggle the "Auto-refresh" checkbox to enable/disable automatic updates

### 2D Map View
- **Zoom/Pan** - Use mouse wheel to zoom, drag to pan
- **View Details** - Click on any circle marker to see ZIP code details
- **Color Legend** - Green (low volume) → Yellow (medium) → Red (high volume)
- **Circle Size** - Larger circles indicate more calls

## 📁 Project Structure

```
outage-dashboard-nextjs/
├── app/
│   ├── api/                        # Next.js API Routes
│   │   ├── outage-data/           # Outage data endpoint
│   │   ├── timeline-data/         # Timeline data endpoint
│   │   └── stats/                 # Statistics endpoint
│   ├── components/                 # React components
│   │   ├── OutageMap.tsx          # Leaflet 2D map
│   │   ├── Timeline.tsx           # Chart.js timeline
│   │   ├── Stats.tsx              # Stats cards
│   │   └── TimeRangeSelector.tsx  # Time range controls
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main dashboard page
│   └── providers.tsx               # React Query provider
├── lib/
│   ├── db.ts                       # Prisma client & ZIP coordinates
│   ├── hooks.ts                    # Custom React hooks
│   └── utils.ts                    # Utility functions
├── prisma/
│   └── schema.prisma               # Database schema
├── types/
│   └── index.ts                    # TypeScript types
├── public/                         # Static assets
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind CSS config
└── next.config.mjs                 # Next.js config
```

## 🔧 Configuration

### Database Schema

The application expects three tables in your PostgreSQL database:

#### `team_thread_forge.call_data`
```sql
- call_id (INTEGER, PK)
- customer_id (VARCHAR 255)
- startdatetime (TIMESTAMP)
- enddatetime (TIMESTAMP)
```

#### `team_thread_forge.transcript_data`
```sql
- call_id (INTEGER, PK)
- customer_id (VARCHAR 255)
- call_reason (VARCHAR 255)  -- Filter: 'technical_support'
- transcript (TEXT)
```

#### `public.customers`
```sql
- customer_id (VARCHAR 50, PK)
- customer_name (VARCHAR 255)
- location (VARCHAR 255)      -- ZIP code for mapping
- [other customer fields...]
```

### Adding New ZIP Codes

Edit [lib/db.ts](lib/db.ts) and add to `ZIP_COORDINATES`:

```typescript
export const ZIP_COORDINATES = {
  // ... existing codes ...
  '06001': { lat: 41.8798, lon: -72.7479, city: 'Avon' },
  // Add your ZIP code here:
  '12345': { lat: 40.7128, lon: -74.0060, city: 'New York' },
};
```

### Customizing Colors

Edit [lib/utils.ts](lib/utils.ts) to modify the heat map gradient:

```typescript
const colors = [
  { threshold: 0.0, color: '#00ff00' }, // Green (low)
  { threshold: 0.5, color: '#ffff00' }, // Yellow (medium)
  { threshold: 1.0, color: '#ff0000' }, // Red (high)
];
```

### Adjusting Auto-Refresh

Edit `.env`:
```env
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=60000  # 60 seconds
```

Or modify [lib/hooks.ts](lib/hooks.ts):
```typescript
refetchInterval: 60000, // milliseconds
```

## 🚢 Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t outage-dashboard .
docker run -p 3000:3000 --env-file .env outage-dashboard
```

### Option 3: Traditional Node.js Hosting

```bash
npm run build
npm start
```

Set `NODE_ENV=production` in your environment.

## 🧪 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (caution!)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

## 📊 API Endpoints

### GET `/api/outage-data`
Returns aggregated call data by ZIP code.

**Query Parameters:**
- `hours` (optional): Number of hours to look back (default: 24)

**Response:**
```json
{
  "data": [
    {
      "zip_code": "06105",
      "call_count": 42,
      "avg_duration": 15.5,
      "coordinates": { "lat": 41.7662, "lon": -72.7009, "city": "Hartford" },
      "customer_ids": ["CUST001", "CUST002"]
    }
  ],
  "timestamp": "2025-11-18T10:30:00Z",
  "time_range_hours": 24
}
```

### GET `/api/timeline-data`
Returns hourly call counts for timeline visualization.

**Query Parameters:**
- `hours` (optional): Number of hours to look back (default: 24)

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2025-11-18T10:00:00Z",
      "call_count": 12,
      "hour_label": "Nov 18, 10am"
    }
  ],
  "time_range_hours": 24
}
```

### GET `/api/stats`
Returns summary statistics.

**Query Parameters:**
- `hours` (optional): Number of hours to look back (default: 24)

**Response:**
```json
{
  "total_calls": 245,
  "unique_customers": 87,
  "avg_duration_minutes": 18.3,
  "last_call_time": "2025-11-18T10:25:00Z",
  "time_range_hours": 24
}
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Test connection: `npx prisma studio`

### Prisma Client Errors
```bash
# Regenerate Prisma client
npx prisma generate
```

### Leaflet Map Not Displaying
- Ensure you're viewing in a browser (not SSR)
- Check browser console for errors
- Verify Leaflet CSS is imported

## 🔒 Security Notes

This is designed for **internal/development use**. For production:

- [ ] Add authentication (NextAuth.js, Auth0, etc.)
- [ ] Implement rate limiting
- [ ] Add input validation/sanitization
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Add audit logging
- [ ] Use connection pooling (PgBouncer)
- [ ] Implement role-based access control

## 🆚 Comparison with Flask Version

### Advantages of Next.js Version:
- ✅ Modern React architecture with hooks
- ✅ TypeScript for type safety
- ✅ Server-side rendering capabilities
- ✅ Automatic code splitting
- ✅ Built-in API routes
- ✅ Hot module replacement
- ✅ Optimized production builds
- ✅ Better developer experience
- ✅ Smooth animations with Framer Motion

### Migration Path:
Both versions can run simultaneously:
- Flask version: http://localhost:5000
- Next.js version: http://localhost:3000

## 📚 Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Next.js 14 | React framework with SSR/SSG |
| **Language** | TypeScript | Type-safe JavaScript |
| **UI Library** | React 18 | Component-based UI |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **2D Maps** | Leaflet + React Leaflet | Interactive mapping |
| **Charts** | Chart.js + React Chartjs 2 | Data visualization |
| **Animations** | Framer Motion | Smooth UI animations |
| **Data Fetching** | TanStack Query | Server state management |
| **Database** | PostgreSQL | Relational database |
| **ORM** | Prisma | Type-safe database client |
| **Icons** | Lucide React | Icon library |
| **Utils** | date-fns, clsx, tailwind-merge | Utilities |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is for internal use. Modify as needed for your organization.

## 📞 Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Check browser console for errors
4. Verify database connectivity
5. Consult Next.js documentation: https://nextjs.org/docs

## 🎉 Acknowledgments

- Original Flask implementation team
- Next.js team for the amazing framework
- Leaflet community for mapping tools
- All open-source contributors

---

**Built with ❤️ using Next.js 14, React, TypeScript, Leaflet, and Tailwind CSS**

**Version:** 2.0.0
**Last Updated:** 2025-11-18
**Status:** ✅ Production Ready
