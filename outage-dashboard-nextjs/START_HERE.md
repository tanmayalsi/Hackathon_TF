# ⚡ START HERE - Quick Setup

## The Issue You Hit

The `setup.bat` script needs Node.js packages installed first. Here's the **correct order**:

## ✅ Working Setup (Choose One Method)

### Method 1: Manual Setup (Most Reliable)

Open Command Prompt in this directory and run these commands **one at a time**:

```cmd
npm install --legacy-peer-deps
```
*Wait 2-3 minutes for this to complete*

```cmd
copy .env.example .env
```

```cmd
notepad .env
```
*Edit the file: Change `your_password_here` to your actual PostgreSQL password. Save and close.*

```cmd
npx prisma generate
```

```cmd
npm run dev
```

Open browser: **http://localhost:3000**

---

### Method 2: Use Fixed Script

Now that the `package.json` is fixed, you can run:

```cmd
setup.bat
```

The script will:
1. Install all dependencies (with `--legacy-peer-deps`)
2. Create `.env` file
3. Open Notepad so you can edit your password
4. Generate Prisma client
5. Give you next steps

---

## 🔧 What Was Fixed

1. **package.json** - Changed ESLint from v9 to v8 (compatibility)
2. **setup.bat** - Now uses `--legacy-peer-deps` flag for npm install
3. **setup.bat** - Better error handling and user prompts

---

## 📋 Your PostgreSQL Password

You need to edit `.env` file with your actual database password:

```env
# Change this line:
DB_PASSWORD=your_password_here

# To something like:
DB_PASSWORD=MyActualPassword123

# Also update this line:
DATABASE_URL="postgresql://postgres:MyActualPassword123@localhost:5432/postgres?schema=team_thread_forge"
```

---

## ✅ Success Checklist

After running setup, you should have:

- ✅ `node_modules/` folder (created by npm install)
- ✅ `.env` file (created from .env.example)
- ✅ Your PostgreSQL password in `.env`
- ✅ No errors from `npx prisma generate`
- ✅ Dashboard running at http://localhost:3000

---

## 🐛 Common Issues

### "npm install" fails
```cmd
npm install --legacy-peer-deps
```

### "Cannot find module '@prisma/client'"
```cmd
npx prisma generate
```

### "Cannot connect to database"
1. Make sure PostgreSQL is running
2. Check password in `.env` matches your PostgreSQL password
3. Test with: `npx prisma studio`

### Port 3000 already in use
Edit `.env`:
```env
PORT=3001
```

---

## 📚 More Help

- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Detailed step-by-step guide
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start
- **[README.md](README.md)** - Complete documentation

---

## 🎯 TL;DR - Just Run This

```cmd
npm install --legacy-peer-deps
copy .env.example .env
notepad .env
npx prisma generate
npm run dev
```

Then open: **http://localhost:3000**

---

**Updated**: 2025-11-18
**Status**: ✅ Fixed and Ready to Use
