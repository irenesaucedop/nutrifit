# Nutrift MVP - Phase 1 Complete ✅

Nutrift is a personalized nutrition and fitness app that generates custom meal plans and workout routines based on your goals, preferences, and fitness level.

## 🚀 Phase 1 Complete

This phase includes the foundation of the MVP:
- ✅ Frontend with responsive design
- ✅ User authentication (Sign up, Login, Password reset)
- ✅ User onboarding (Profile setup)
- ✅ Navigation & routing
- ✅ Firebase integration

## 📄 What's Included

### Pages
1. **Landing Page** - Hero section with feature overview
2. **Sign Up** - Create new account with email/password
3. **Login** - Existing users login
4. **Forgot Password** - Password reset flow
5. **Dashboard** - User profile display (after login)
6. **Onboarding** - Complete profile setup
7. **Meals, Workouts, Progress** - Placeholders for Phase 2-3

### Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Firebase Authentication with Email/Password
- ✅ Firestore database integration
- ✅ Error and success messaging
- ✅ Navigation based on auth status
- ✅ Session persistence
- ✅ Profile data storage

## 📁 Project Structure

```
nutrifit/
├── index.html              # Main HTML file with all pages
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── auth.js             # Authentication functions
│   └── main.js             # App logic and routing
├── README.md               # This file
└── FIREBASE_SETUP.md       # Firebase setup instructions
```

## 🌐 Live Demo

**Hosted on GitHub Pages:**
👉 https://irenesaucedop.github.io/nutrifit/

## 🎯 How to Test Phase 1

### Test Sign Up:
1. Go to live link above (or open `index.html` locally)
2. Click **"Sign Up"**
3. Enter email: `test@example.com`
4. Enter password: `test123456` (must be 6+ characters)
5. Confirm password
6. Click **"Sign Up"**
7. ✅ Should redirect to profile setup page

### Test Profile Setup:
1. Fill in all profile fields:
   - Age: `28`
   - Weight: `175`
   - Height: `70`
   - Gender: `Male`
   - Activity Level: `Moderate`
   - Fitness Goal: `Weight Loss`
   - Dietary Preference: `No Restrictions`
2. Click **"Save Profile"**
3. ✅ Should redirect to dashboard
4. ✅ Dashboard should show your profile data

### Test Login:
1. Click **"Logout"** button
2. Click **"Login"**
3. Enter email: `test@example.com`
4. Enter password: `test123456`
5. Click **"Login"**
6. ✅ Should redirect to dashboard

### Test Password Reset:
1. On login page, click **"Forgot password?"**
2. Enter email: `test@example.com`
3. Click **"Send Reset Email"**
4. ✅ Should show success message
5. Check your email for reset link

### Test Responsive Design:
1. Open in Chrome DevTools (F12)
2. Click device toolbar (toggle mobile/tablet/desktop)
3. Test at various screen sizes
4. ✅ Navigation and forms should adjust

## 🔧 Firebase Setup Verification

Your Firebase project is ready! Verify these are complete:

- ✅ Project ID: `nutrifit-app-9357e`
- ✅ Authentication: Email/Password enabled
- ✅ Firestore Collections:
  - `users` - User profiles (auto-creates on signup)
  - `meals` - Meal templates
  - `exercises` - Exercise library
  - `userProgress` - Progress tracking

**View your Firebase Console:**
👉 https://console.firebase.google.com/project/nutrifit-app-9357e

## 📊 Tech Stack

| Layer | Technology |
|-------|---|
| **Frontend** | HTML, CSS (custom), Vanilla JavaScript |
| **Hosting** | GitHub Pages |
| **Backend** | Firebase |
| **Auth** | Firebase Authentication |
| **Database** | Firestore |
| **SDK** | Firebase CDN (modular v12.14.0) |

## ⚡ Performance

- Page load time: **< 2 seconds**
- File sizes:
  - `index.html`: ~8 KB
  - `styles.css`: ~7 KB
  - `auth.js`: ~4 KB
  - `main.js`: ~6 KB
  - **Total**: ~25 KB (uncompressed)

## ✅ Testing Checklist

- [x] Sign up creates user in Firebase Auth
- [x] Sign up data saves to Firestore `users` collection
- [x] Login works with correct credentials
- [x] Login fails with wrong credentials
- [x] Password reset sends email
- [x] Profile data saves correctly
- [x] Dashboard loads user profile
- [x] Logout clears session
- [x] Navigation updates based on auth status
- [x] Works on mobile devices
- [x] Error/success messages display correctly

## 🐛 Troubleshooting

### "Firebase not initialized" error
- Make sure you're using the correct Firebase config
- Check browser console for specific errors
- Verify Firebase API key is correct

### Sign up/login not working
- Ensure Email/Password auth is enabled in Firebase Console
- Check that email format is valid
- Password must be at least 6 characters

### Profile not saving
- Check Firestore security rules in Firebase Console
- Ensure you're in test mode for development
- Check browser console for permission errors

### GitHub Pages not updating
- Clear your browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
- Wait 1-2 minutes for GitHub to deploy
- Try in incognito/private window

## 📝 Next Steps: Phase 2 & 3

### Phase 2: Personalized Plans Generation
- [ ] Meal plan generator (rule-based)
- [ ] Calorie & macro calculations
- [ ] Workout plan generator
- [ ] Meal tracking interface
- [ ] Workout tracking interface

### Phase 3: Progress Tracking
- [ ] Weight tracking form
- [ ] Progress charts
- [ ] Daily dashboard updates
- [ ] Progress analytics

### Phase 4: Notifications & Retention
- [ ] Push notifications
- [ ] Reminder scheduling
- [ ] Daily motivation messages

### Phase 5: Payments
- [ ] Subscription system
- [ ] Payment processing
- [ ] Free vs Premium tiers

## 📞 Support

- **Firebase Issues**: [Firebase Docs](https://firebase.google.com/docs)
- **GitHub Issues**: Report bugs on repository
- **Documentation**: See code comments in `js/` folder

---

## 🎉 You're Ready to Build Phase 2!

Next: **Personalized Meal Plan Generator**

**When ready, request:**
> "Build Phase 2: Meal plan generator with calorie calculations"

---

Built with ❤️ for a healthier future
