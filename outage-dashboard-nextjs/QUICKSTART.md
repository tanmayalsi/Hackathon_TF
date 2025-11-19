# 🚀 Quick Start Guide

Get your Next.js Outage Dashboard running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Existing data in the database (from Flask version)

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd outage-dashboard-nextjs
npm install
```

### 2. Configure Database (1 minute)

Copy the example environment file:
```bash
copy .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres?schema=team_thread_forge"
DB_PASSWORD=YOUR_PASSWORD
```

### 3. Initialize Prisma (1 minute)

```bash
npx prisma generate
```

### 4. Start the Server (30 seconds)

```bash
npm run dev
```

### 5. Open in Browser (30 seconds)

Navigate to: **http://localhost:3000**

## ✅ You're Done!

You should now see:
- 📊 Statistics cards at the top
- 🗺️ Interactive 2D heat map
- 📈 Timeline chart
- 🎛️ Time range selector

## 🎮 Try These Features

1. **Change Time Range** - Click "Last Hour", "Last 6 Hours", etc.
2. **Switch to 3D View** - Click the "3D View" button
3. **Explore the Map** - Zoom, pan, click markers
4. **Hover on 3D Bars** - See ZIP code details
5. **Manual Refresh** - Click the "Refresh" button

## 🐛 Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check your password in `.env`
- Run: `npx prisma studio` to test connection

### "Port 3000 already in use"
```bash
# Edit .env and change:
PORT=3001
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Customize ZIP codes in `lib/db.ts`
- Modify colors in `lib/utils.ts`
- Add authentication for production use

## 🆘 Need Help?

Check:
1. [README.md](README.md) - Full documentation
2. [MIGRATION.md](MIGRATION.md) - Migration from Flask
3. Browser console for errors
4. `npx prisma studio` for database issues

---

**Happy visualizing! 📊🗺️**
