# Development Notes & Customization Guide

## 🎨 Customizing the Application

### Changing the Passcode
Edit `.env.local`:
```env
NEXT_PUBLIC_PASSCODE=your-new-passcode
```
Then restart the development server.

### Adding Custom Exercises
Edit `components/AddSessionForm.tsx`, line ~80:
```tsx
<select name="exercise" ... required>
  <option value="">Select an exercise</option>
  <option value="Your Custom Exercise">Your Custom Exercise</option>
  {/* Add more options */}
</select>
```

### Changing Theme Colors
Edit `tailwind.config.js`:
```js
colors: {
  darkgrey: "#your-color",
  offwhite: "#your-color",
}
```

### Adding App Icons for PWA
1. Create 192x192 and 512x512 PNG images
2. Save to `public/` as `icon-192.png` and `icon-512.png`
3. The manifest.json already references them

---

## 🔧 Development Guide

### Adding a New Training Field
Example: Add "intensity" field

1. **Update Database Schema** (lib/db.ts):
```sql
ALTER TABLE training_sessions 
ADD COLUMN intensity VARCHAR(20);
```

2. **Update Types** (lib/types.ts):
```ts
export interface TrainingSession {
  // ... existing fields
  intensity?: string;
}
```

3. **Update Form** (components/AddSessionForm.tsx):
```tsx
const [formData, setFormData] = useState({
  // ... existing fields
  intensity: "",
});

// Add to form:
<select name="intensity" ... >
  <option value="">Select intensity</option>
  <option value="Low">Low</option>
  <option value="Medium">Medium</option>
  <option value="High">High</option>
</select>
```

4. **Update API** (app/api/training/route.ts):
```ts
const { intensity } = body;

const result = await query(
  `INSERT INTO ... intensity, ...)
   VALUES (..., $6, ...)`,
  [..., intensity]
);
```

---

## 📊 Adding Analytics

### View Total Training Sessions
```ts
// In lib/db.ts
export async function getTrainingStats() {
  return await query(
    `SELECT 
      COUNT(*) as total_sessions,
      SUM(duration) as total_minutes,
      AVG(duration) as avg_duration,
      COUNT(DISTINCT exercise) as unique_exercises
     FROM training_sessions`
  );
}
```

### Add Stats Dashboard
Create `components/StatsPanel.tsx` and import in `app/page.tsx`

---

## 🔒 Enhancing Security

### Add Session Timeout
Edit `components/PasscodeScreen.tsx`:
```ts
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.removeItem('hyrox_authenticated');
    location.reload();
  }, 30 * 60 * 1000); // 30 minutes
  
  return () => clearTimeout(timer);
}, []);
```

### Add Rate Limiting
Create `lib/rateLimit.ts`:
```ts
const attempts = new Map();
const LIMIT = 5;
const WINDOW = 60000; // 1 minute

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key) || [];
  const valid = record.filter(t => now - t < WINDOW);
  
  if (valid.length >= LIMIT) return false;
  
  valid.push(now);
  attempts.set(key, valid);
  return true;
}
```

---

## 📱 PWA Offline Support

### Add Service Worker
Create `public/sw.js`:
```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/icon-192.png',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Register Service Worker
Add to `app/layout.tsx`:
```tsx
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

---

## 🧪 Testing the Application

### Manual Testing Checklist
- [ ] Login with correct passcode
- [ ] Try wrong passcode (should error)
- [ ] Add a training session with all fields
- [ ] Add a session with only required fields
- [ ] View sessions in list (newest first)
- [ ] Delete a session
- [ ] Logout and verify auth clears
- [ ] Refresh page while logged in (should persist)
- [ ] Test on mobile device

### Testing Database Connection
```bash
# Test connection
psql 'your-connection-string'

# Check tables
\dt

# View data
SELECT * FROM training_sessions;
```

---

## 🚀 Performance Optimization

### Enable Caching
Edit `next.config.js`:
```js
export default {
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/api/training',
      headers: [
        { key: 'Cache-Control', value: 'max-age=60' }
      ]
    }
  ]
};
```

### Optimize Images
Future: Add `Image` component from Next.js instead of `<img>`

### Database Query Optimization
- ✅ Already has index on date column
- Consider pagination for large datasets

---

## 🐛 Common Issues & Solutions

### Issue: Sessions don't persist after logout
**Solution**: localStorage is cleared by design on logout. Add a remember-me option:
```ts
// PasscodeScreen.tsx
const [rememberMe, setRememberMe] = useState(false);

if (rememberMe) {
  localStorage.setItem('hyrox_remember', 'true');
}
```

### Issue: API returns 500 error
**Solution**: Check:
1. DATABASE_URL is correct
2. Neon database is awake
3. Table exists (run `npm run init-db`)
4. Network request shows actual error in console

### Issue: Build fails with TypeScript errors
**Solution**: 
```bash
npm run build -- --debug
# Check console output for specific errors
```

---

## 📚 Useful Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [PostgreSQL](https://www.postgresql.org/docs)
- [Neon Docs](https://neon.tech/docs)

### Deployment
- [Vercel Deployment](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com)

### PWA
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 🎯 Roadmap Ideas

### Phase 1: MVP (Current)
- ✅ Basic training logging
- ✅ Passcode protection
- ✅ Database persistence

### Phase 2: Enhanced Features
- [ ] User profiles (multiple users)
- [ ] Weekly summaries
- [ ] Export to CSV
- [ ] Photo attachments

### Phase 3: Advanced
- [ ] Social features (friend comparison)
- [ ] AI coaching tips
- [ ] Integration with wearables
- [ ] Mobile app (React Native)

---

## 🔄 Update Guide

### Updating Dependencies
```bash
npm update              # Update to latest versions
npm outdated           # Check for outdated packages
npm install next@latest  # Update specific package
```

### Updating Next.js
```bash
npm install next@latest
npm run build          # Test the build
npm run dev           # Test development
```

---

## 📝 Code Style

### Current Standards
- TypeScript strict mode enabled
- Tailwind CSS for styling (no inline CSS)
- React functional components with hooks
- Single quotes in imports, double quotes in strings
- Minimal comments - self-documenting code

### Naming Conventions
- Components: PascalCase (AddSessionForm.tsx)
- Files: kebab-case for utilities (add-session.ts)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: PascalCase with I prefix optional

---

## 🎓 Learning Resources

If you want to understand the codebase:
1. Start with `app/page.tsx` (main logic flow)
2. Understand `components/PasscodeScreen.tsx` (auth)
3. Learn `lib/db.ts` (database queries)
4. Review `app/api/training/route.ts` (backend)
5. Check `components/AddSessionForm.tsx` (form handling)

---

**Last Updated**: November 14, 2024
**Version**: 1.0.0-initial
**Maintainer**: Development Team
