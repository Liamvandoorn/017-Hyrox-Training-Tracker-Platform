# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. **Clone & Install**
```bash
git clone <your-repo-url>
cd 016-Hyrox-Training-Tracker
npm install
```

### 2. **Set Up Neon Database**

Go to [Neon Console](https://console.neon.tech):
- Create a new project
- Create database named `hyrox_trainer`
- Copy connection string

### 3. **Configure Environment**

Create `.env.local`:
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_PASSCODE=1234
```

### 4. **Initialize Database**

Option A - Via npm script (add to package.json first):
```bash
npm run init-db
```

Option B - Manual:
```bash
node scripts/init-db.js
```

### 5. **Start Development**
```bash
npm run dev
```

Visit `http://localhost:3000` → Enter passcode `1234`

---

## 📱 Access the App

| Platform | How to Access |
|----------|---------------|
| Desktop | `http://localhost:3000` |
| iOS | Add to Home Screen (Safari) |
| Android | Install prompt or "Add to Home Screen" |

---

## 🔐 Security First!

**Before deploying to production:**

1. Change `NEXT_PUBLIC_PASSCODE` in `.env.local`
2. Use a strong, random passcode
3. Never commit `.env.local` to git
4. Add `.env.local` to `.gitignore` ✓ (already done)

---

## 📊 Test the App

### Add a Training Session
- Click "New Session"
- Select date, exercise (e.g., "Run")
- Enter duration (e.g., 30 minutes)
- Optional: Add distance and notes
- Click "Add Session"

### View History
- Sessions appear in reverse chronological order
- Click "Delete" to remove a session

### Logout
- Click "Logout" button in top right
- App clears from device memory

---

## 🐛 Troubleshooting

**"DATABASE_URL is not set"**
- ✓ Check `.env.local` exists
- ✓ Verify connection string is correct
- ✓ Restart development server

**"Connection refused"**
- ✓ Neon database might be paused
- ✓ Wake it up from Neon console
- ✓ Check your IP is whitelisted

**"Failed to fetch"**
- ✓ Development server running?
- ✓ Check browser console for errors
- ✓ Verify API route exists

---

## 📦 Deployment Options

### Vercel (Easiest)
```bash
npm i -g vercel
vercel
# Add env vars in Vercel dashboard
```

### Self-Hosted
```bash
npm run build
npm start
# Set environment variables
```

---

## 📚 File Reference

```
app/
  ├── page.tsx              ← Main app logic
  ├── layout.tsx            ← PWA setup
  ├── globals.css           ← Styling
  └── api/training/route.ts ← API endpoints

components/
  ├── PasscodeScreen.tsx    ← Login screen
  ├── AddSessionForm.tsx    ← Entry form
  └── SessionList.tsx       ← Display sessions

lib/
  ├── db.ts                 ← Database queries
  ├── auth.ts               ← Passcode logic
  └── types.ts              ← TypeScript definitions
```

---

## ✨ Features Explained

**Passcode Protection**
- All sessions stored in browser memory
- Logout clears data
- Persistent: Refresh keeps you logged in

**Dark Theme**
- Professional dark grey (#2a2a2a) background
- Off-white (#f5f5f5) text
- Easy on the eyes for outdoor training

**Training Exercises**
- 12 Hyrox-specific exercises included
- Customizable via AddSessionForm.tsx
- Add your own: Edit the `<select>` options

**Database**
- PostgreSQL via Neon
- Auto-indexed by date
- Stores: exercise, duration, distance, notes

---

## 🎯 Next Steps

1. ✅ Get it running locally
2. ✅ Test adding sessions
3. ✅ Deploy to Vercel
4. ✅ Add custom passcode
5. ✅ Customize exercises (optional)

**Need help?** Check README.md for detailed docs.
