# 🚀 Setup Instructions - Step by Step

## Quick Setup (Manual - Most Reliable)

Follow these exact steps:

### Step 1: Install Node.js (if needed)

Check if you have Node.js:
```cmd
node --version
```

If you see an error, install from: https://nodejs.org/ (Version 18 or higher)

### Step 2: Navigate to Project

```cmd
cd C:\Users\ftrhack15\Desktop\hackathon\outage-dashboard-nextjs
```

### Step 3: Install Dependencies

```cmd
npm install
```

This will take 2-3 minutes. Wait for it to complete.

### Step 4: Create .env File

```cmd
copy .env.example .env
```

### Step 5: Edit .env File

Open .env in a text editor:
```cmd
notepad .env
```

Change these lines (replace `YOUR_PASSWORD` with your actual PostgreSQL password):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres?schema=team_thread_forge"
DB_PASSWORD=YOUR_PASSWORD
```

Save and close the file.

### Step 6: Generate Prisma Client

```cmd
npx prisma generate
```

### Step 7: Start Development Server

```cmd
npm run dev
```

### Step 8: Open Browser

Open: **http://localhost:3000**

---

## ✅ Success!

You should now see the dashboard with:
- Statistics cards at the top
- Interactive map in the middle
- Timeline chart at the bottom
- Time range selector buttons

---

## 🐛 Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "npm install" fails
```cmd
# Delete any existing node_modules
rmdir /s /q node_modules
# Try again
npm install
```

### "Cannot find module @prisma/client"
```cmd
npx prisma generate
```

### "Cannot connect to database"
1. Make sure PostgreSQL is running
2. Check your password in `.env`
3. Test connection:
   ```cmd
   npx prisma studio
   ```

### Port 3000 already in use
Edit `.env` and change:
```env
PORT=3001
```

---

## 📝 What Each Step Does

1. **npm install** - Downloads all required packages (React, Next.js, Leaflet, Three.js, etc.)
2. **copy .env.example .env** - Creates your environment configuration file
3. **Edit .env** - Sets your database password so the app can connect
4. **npx prisma generate** - Creates the database client code
5. **npm run dev** - Starts the development server

---

## 🎯 Verification Checklist

After completing setup, verify:

- [ ] `node_modules/` folder exists (created by npm install)
- [ ] `.env` file exists (created by copy command)
- [ ] `.env` has your PostgreSQL password (not "your_password_here")
- [ ] `npx prisma generate` completed without errors
- [ ] `npm run dev` starts without errors
- [ ] Browser shows dashboard at http://localhost:3000
- [ ] Statistics cards show numbers (not zeros)
- [ ] Map displays with markers
- [ ] Timeline chart has data

---

## ⏱️ Estimated Time

- **First time setup**: 5-10 minutes
- **npm install**: 2-3 minutes
- **Other steps**: 1-2 minutes each

---

## 🆘 Still Having Issues?

1. Make sure you're in the correct directory:
   ```cmd
   cd C:\Users\ftrhack15\Desktop\hackathon\outage-dashboard-nextjs
   ```

2. Check that `package.json` exists:
   ```cmd
   dir package.json
   ```

3. Verify Node.js version (must be 18+):
   ```cmd
   node --version
   ```

4. Make sure PostgreSQL is running and accessible

5. Check the browser console (F12) for errors

---

**Need more help?** See [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)
