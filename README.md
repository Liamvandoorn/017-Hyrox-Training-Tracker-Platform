# Hyrox Training Tracker

A progressive web app (PWA) built with Next.js for tracking Hyrox training sessions. Secure passcode protection, offline-capable, and stores all training data in a Neon PostgreSQL database.

## Features

- 🔐 **Passcode Protected** - Secure access with customizable passcode
- 📱 **PWA Ready** - Works on mobile and desktop, installable as an app
- 📊 **Track Training** - Log exercises, duration, distance, and notes
- 🏋️ **Workout Builder** - Follow the sample plan or build a session from editable sets
- 🗄️ **Neon Database** - PostgreSQL database for persistent storage
- 📈 **Workout Recaps** - Complete sets and review session volume and set time
- 🎨 **Responsive UI** - Mobile-first dashboard and workout logging
- ⚡ **Fast & Responsive** - Built with Next.js and Tailwind CSS

## Setup Guide

### Prerequisites

- Node.js 16+ and npm
- A Neon PostgreSQL account (free tier available at [neon.tech](https://neon.tech))

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Create a new database named `hyrox_trainer`
4. Copy your connection string

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Your Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@ep-xxxxx.us-west-2.aws.neon.tech/hyrox_trainer

# Passcode to access the app (change for security)
NEXT_PUBLIC_PASSCODE=1234
```

### 4. Initialize the Database

```bash
npm run init-db
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) and enter the passcode to access the app.

## Exercises Available

- Run
- Sled Push
- Sled Pull
- Wall Balls
- Rowing
- Burpee Broad Jumps
- Sandbag Lunges
- Rope Climb
- Monkey Bars
- SkiErg
- Tire Flip
- Other

## Usage

1. **Unlock** - Enter the passcode to access the app
2. **Log Workout** - Choose Follow plan or Log own workout from the slide-up menu above the navigation
3. **Build sets** - Use the docked set composer to choose an exercise and enter distance/weight/reps, set time, and rest time
4. **Complete or abort** - Tap each numbered circle as you finish a set; finish to save a recap or abort after confirming
5. **Plan setup** - Planned workouts can be configured in Settings in a future update; Follow plan currently uses a clearly marked sample

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `DATABASE_URL` and `NEXT_PUBLIC_PASSCODE` environment variables in project settings
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom dark theme
- **Backend**: Next.js API routes
- **Database**: Neon (PostgreSQL)
- **PWA**: Web App Manifest for install capability

## Database Schema

```sql
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  distance DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_sessions_date ON training_sessions(date);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(10) NOT NULL CHECK (source IN ('own', 'plan')),
  sets JSONB NOT NULL CHECK (jsonb_typeof(sets) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_date ON workouts(date DESC);
```

Completed workouts are saved through `POST /api/workouts`; run `npm run init-db` after updating to create the workouts table in Neon.

## File Structure

```
├── app/
│   ├── api/training/          # API routes
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── PasscodeScreen.tsx     # Login screen
│   ├── AddSessionForm.tsx     # Add session form
│   └── SessionList.tsx        # Sessions display
├── lib/
│   ├── db.ts                  # Database utilities
│   ├── auth.ts                # Authentication
│   └── types.ts               # TypeScript types
├── public/
│   └── manifest.json          # PWA manifest
├── .env.local                 # Environment variables
└── package.json               # Dependencies
```

## Security Notes

⚠️ **Important**: The current implementation uses a simple passcode for demo purposes. For production:

1. Implement proper authentication (OAuth, JWT, etc.)
2. Use environment variables for sensitive data
3. Add HTTPS enforcement
4. Consider rate limiting on the API
5. Add input validation and sanitization
6. Use secure password hashing if needed

## Future Enhancements

- [ ] User profiles with authentication
- [ ] Statistics and analytics
- [ ] Export training data (CSV, PDF)
- [ ] Progress charts and graphs
- [ ] Rest day tracking
- [ ] Team tracking (share workouts)
- [ ] Offline sync capability

## Lighthouse Web App Manifest

The app includes a complete PWA manifest at `/public/manifest.json` for:
- Standalone app mode
- Add to Home Screen capability
- Offline support readiness

## License

ISC - See LICENSE file for details

## Support

For issues or suggestions, please create an issue on GitHub.
