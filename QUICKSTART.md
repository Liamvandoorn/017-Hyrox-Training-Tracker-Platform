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
PIN_PEPPER=replace-with-a-random-secret-at-least-32-characters
ADMIN_BOOTSTRAP_KEY=replace-with-a-different-random-secret-at-least-32-characters
```

Generate both secrets separately (for example, with `openssl rand -hex 32`).
Keep `PIN_PEPPER` stable: changing it invalidates every account PIN. Remove
`ADMIN_BOOTSTRAP_KEY` after creating the first administrator.

### 4. **Initialize Database**

Option A - Via npm script:
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

Visit `http://localhost:3000` and create the first administrator using the
bootstrap key. The administrator can then create accounts in Settings.

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

1. Keep `PIN_PEPPER` and `ADMIN_BOOTSTRAP_KEY` server-side and out of git
2. Remove `ADMIN_BOOTSTRAP_KEY` after creating the first administrator
3. Use a fresh Neon database for the owner-scoped schema
4. Remember 4-digit PINs are weak credentials

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
- Click the sign-out button on the dashboard
- The server session is revoked and the browser returns to sign in

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

**PIN Sign-in**
- Administrators create member accounts and assign each a unique 4-digit PIN.
- Users sign in with only their PIN; no self-registration is available.
- Sessions use an HttpOnly cookie and are enforced by the API.
- Login attempts are temporarily rate-limited.
- Four-digit PINs are weak credentials; use this only for low-risk training data.

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
