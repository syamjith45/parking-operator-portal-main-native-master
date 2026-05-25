# Parking Operator Portal — React Native Setup Guide

A React Native mobile app built with Expo SDK 52 for managing parking operations. Equivalent to the web portal but runs natively on Android and iOS.

---

## Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.x or 20.x (LTS) | https://nodejs.org |
| npm | 9.x+ (bundled with Node) | — |
| Expo CLI | Latest | `npm install -g expo-cli` |
| Expo Go app | Latest | iOS App Store / Google Play |

> **For emulator testing (optional):**
> - **Android:** Install Android Studio + Android SDK (API 34). Create an AVD (virtual device) via the AVD Manager.
> - **iOS (macOS only):** Install Xcode 15+ from the Mac App Store. Open Simulator from Xcode → Open Developer Tool → Simulator.

---

## 1. Clone / Navigate to the Project

```bash
cd /home/goutham/Desktop/react/parking-operator-portal-main-native
```

---

## 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is needed because some Expo/React Navigation packages have peer dependency version conflicts that are safe to ignore.

This installs all ~890 packages listed in `package.json`.

---

## 3. Environment Variables

The `.env` file is already present at the project root with the correct values:

```env
EXPO_PUBLIC_GRAPHQL_URI=https://api.keraai.in/graphql
EXPO_PUBLIC_SUPABASE_URL=https://fiwkmeqfdwhmkvdmtkgk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Expo reads variables prefixed with `EXPO_PUBLIC_` at build time. Do not rename these keys.

---

## 4. Start the Development Server

```bash
npm start
# or
npx expo start
```

This opens the **Expo Metro bundler** in your terminal and displays a QR code.

---

## 5. Run on a Device or Emulator

### Option A — Physical Device (Easiest)
1. Install **Expo Go** from the App Store (iOS) or Google Play (Android).
2. Make sure your phone and computer are on the **same Wi-Fi network**.
3. Scan the QR code shown in the terminal with your camera (iOS) or the Expo Go app (Android).

### Option B — Android Emulator
1. Open Android Studio → AVD Manager → start a virtual device.
2. In the Metro terminal, press `a`.

### Option C — iOS Simulator (macOS only)
1. Open Xcode at least once to install command-line tools.
2. In the Metro terminal, press `i`.

### Option D — Web Preview (limited)
In the Metro terminal, press `w`. Some native features will not work in the browser.

---

## 6. NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo Metro bundler (interactive) |
| `npm run android` | Start and open on Android emulator |
| `npm run ios` | Start and open on iOS simulator (macOS only) |
| `npm run web` | Start in the browser (limited native support) |

---

## Dependencies — Full Reference

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~52.0.0 | Expo SDK — managed workflow runtime |
| `react` | 18.3.1 | React core |
| `react-native` | 0.76.3 | React Native core |

### Expo SDK Modules

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-status-bar` | ~2.0.0 | Controls the device status bar style |
| `expo-secure-store` | ~13.0.0 | Encrypted key-value storage (used by Supabase) |
| `@expo/vector-icons` | ^14.0.0 | Icon library (Ionicons set used throughout) |

### Navigation

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-navigation/native` | ^6.1.17 | Core navigation library |
| `@react-navigation/stack` | ^6.3.29 | Stack navigator (Login → Main, modal screens) |
| `@react-navigation/bottom-tabs` | ^6.5.20 | Bottom tab navigator (Operator & Admin tabs) |
| `react-native-screens` | ~4.3.0 | Native screen components (required by React Navigation) |
| `react-native-safe-area-context` | 4.12.0 | Safe area insets for notches/home indicators |
| `react-native-gesture-handler` | ~2.20.2 | Native gesture recognition (required by stack navigator) |

### GraphQL / Data Fetching

| Package | Version | Purpose |
|---------|---------|---------|
| `@apollo/client` | ^3.8.8 | GraphQL client — queries, mutations, caching |
| `graphql` | ^16.8.1 | GraphQL core (peer dependency of Apollo) |

### Authentication / Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.39.0 | Supabase client — authentication (sign in/out, session management) |
| `react-native-url-polyfill` | ^2.0.0 | URL API polyfill required by Supabase in React Native |

### Storage

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-async-storage/async-storage` | 1.21.0 | Persistent key-value storage (replaces localStorage from web) |

### UI

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-picker/picker` | 2.6.1 | Native picker component (installed but custom SelectPicker used instead) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@babel/core` | ^7.24.0 | JavaScript transpiler (required by Expo/Metro bundler) |
| `@types/react` | ~18.3.12 | TypeScript type definitions for React (for editor autocomplete) |

---

## Project Structure

```
parking-operator-portal-main-native/
├── App.jsx                          # Root entry point
├── app.json                         # Expo configuration
├── babel.config.js                  # Babel config (expo preset)
├── package.json                     # npm dependencies
├── .env                             # Environment variables
├── dependencies.txt                 # Full dependency list
├── SETUP.md                         # This file
├── assets/
│   ├── icon.png                     # App icon (1024×1024)
│   ├── splash.png                   # Splash screen (1284×2778)
│   ├── adaptive-icon.png            # Android adaptive icon (1024×1024)
│   └── favicon.png                  # Web favicon (64×64)
└── src/
    ├── constants/
    │   ├── colors.js                # Color palette (light + dark)
    │   └── parkingModes.js          # HOURLY / CUSTOM_DATE enum
    ├── lib/
    │   ├── apolloClient.js          # Apollo Client setup + auth link
    │   ├── supabase.js              # Supabase client (AsyncStorage session)
    │   └── utils.js                 # formatCurrency, formatDate, etc.
    ├── context/
    │   ├── AuthContext.jsx          # Auth state, login/logout, staff profile
    │   └── ThemeContext.jsx         # Dark/light theme toggle
    ├── navigation/
    │   ├── AppNavigator.jsx         # Root navigator (Login / Operator / Admin)
    │   ├── OperatorTabNavigator.jsx # Bottom tabs for operators/managers
    │   └── AdminTabNavigator.jsx    # Bottom tabs for admin
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx           # Reusable button (variants: default, outline, destructive…)
    │   │   ├── Input.jsx            # Themed TextInput wrapper
    │   │   ├── Card.jsx             # Card / CardHeader / CardContent
    │   │   ├── Modal.jsx            # Bottom sheet modal
    │   │   ├── Badge.jsx            # Status badge (success, error, muted…)
    │   │   ├── Logo.jsx             # Kera AI logo component
    │   │   ├── ScreenHeader.jsx     # Reusable screen header
    │   │   └── SelectPicker.jsx     # Custom dropdown (replaces HTML select)
    │   ├── monitor/
    │   │   └── ExitModal.jsx        # Vehicle exit + payment collection modal
    │   └── entry/
    │       ├── EntryFormRouter.jsx  # Routes to slab-based or hourly form
    │       ├── SlabBasedEntryForm.jsx  # Entry form for slab-based orgs
    │       └── HourlyEntryForm.jsx  # Entry form for hourly-rate orgs
    └── screens/
        ├── auth/
        │   └── LoginScreen.jsx      # Email + password login
        ├── operator/
        │   ├── MonitorScreen.jsx    # Live active vehicle monitor (polls every 30s)
        │   ├── AddEntryScreen.jsx   # Log new vehicle entry
        │   ├── HistoryScreen.jsx    # Transaction history with filters + pagination
        │   ├── StatsScreen.jsx      # Revenue & session statistics
        │   ├── ProfileScreen.jsx    # User profile, theme toggle, logout
        │   ├── PricingScreen.jsx    # Manage overstay slabs (manager only)
        │   └── SettingsScreen.jsx   # Configure hourly pricing rules (manager only)
        └── admin/
            ├── AdminDashboardScreen.jsx   # Global revenue & session stats
            ├── OrganizationsScreen.jsx    # Manage organizations
            └── SpacesScreen.jsx           # Manage parking spaces
```

---

## User Roles

| Role | Access |
|------|--------|
| `operator` | Monitor, Add Entry, History, Stats, Profile |
| `manager` | All operator screens + Pricing Management + Settings |
| `admin` | Admin Dashboard, Organizations, Spaces |

Login with Supabase credentials. The app automatically routes to the correct tab navigator based on the role returned from the GraphQL `myProfile` query.

---

## Common Issues

**Metro bundler stuck / cache issue:**
```bash
npx expo start --clear
```

**Dependency install fails:**
```bash
npm install --legacy-peer-deps --force
```

**App shows blank screen:**
- Check that `.env` values are correct.
- Make sure the GraphQL API (`https://api.keraai.in/graphql`) is reachable from your network.

**"Unable to resolve module" error:**
```bash
npx expo start --clear
# or delete node_modules and reinstall
rm -rf node_modules && npm install --legacy-peer-deps
```

**Expo Go version mismatch:**
Update the Expo Go app on your device to the latest version, as Expo SDK 52 requires a recent Expo Go release.
