# Hyrox Training Tracker

*100% Vibe coded* But i'll leave it forkable for anyone wanting their own Hyrox Tracker without needing to spend tokens for the initial setup.

A progressive web app (PWA) built with Next.js for tracking Hyrox training sessions. Secure passcode protection, offline-capable, and stores all training data in a Neon PostgreSQL database.

## Features

- 🔐 **Passcode Protected** - Secure access with customizable passcode
- 📱 **PWA Ready** - Works on mobile and desktop, installable as an app
- 📊 **Track Training** - Log exercises, duration, distance, and notes
- 🏋️ **Workout Builder** - Follow saved plans or build a session from editable sets
- 🗓️ **Workout Plans** - Create, edit, and reuse workout templates from Settings
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
- Farmer Carries
- Rope Climb
- Monkey Bars
- SkiErg
- Tire Flip
- Other

## Usage

1. **Unlock** - Enter the passcode to access the app
2. **Log Workout** - Choose Follow plan or Log own workout from the slide-up menu above the navigation
3. **Build sets** - Use the docked composer to enter distance, weight, or reps; sled pushes/pulls, sandbag lunges, and farmer carries take both distance and weight (farmer carry weight is per kettlebell), while wall balls include a weight field. Enter time and rest with numeric minute/second fields separated by a fixed colon.
4. **Complete or abort** - Tap each numbered circle as you finish a set; finish to save a recap or abort after confirming
5. **Build a plan** - Create and edit reusable workout plans in Settings. Choose Follow plan to import a saved plan into a new workout.

## HYROX Best-Time Eligibility

Best times use completed sets only. Running times are normalized to a 1,000 m equivalent using each set's average pace, and the fastest equivalent is shown. The Best HYROX time is calculated as eight times the best running 1,000 m pace plus the best eligible time for each of the eight stations. It is shown after all nine benchmarks have qualifying results. Other stations count only at or above the following distance, rep, and load minimums:

- SkiErg and rowing: 1,000 m
- Sled pull: 12.5 m at 78 kg or more
- Sled push: 12.5 m at 102 kg or more
- Burpee broad jumps: 80 m
- Sandbag lunges: 100 m at 10 kg or more
- Farmer carries: 200 m with 16 kg or heavier per kettlebell
- Wall balls: 100 reps at 4 kg or more

The dashboard's exercise charts show the fastest completed timed set per day, even if it does not meet the benchmark minimums; distance, reps, and weight may differ. The best running pace chart shows the cumulative personal best 1,000 m equivalent over the latest seven days with timed runs. The weekly workout frequency chart counts saved workouts.

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

CREATE TABLE workout_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sets JSONB NOT NULL CHECK (jsonb_typeof(sets) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_updated_at ON workout_plans(updated_at DESC);
```

Completed workouts are saved through `POST /api/workouts`, and reusable plans through `/api/plans`. Run `npm run init-db` to create the workout and plan tables in Neon.

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
