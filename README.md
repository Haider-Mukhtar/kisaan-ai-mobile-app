# Kisaan AI (کسان AI)

A voice-first farming companion for smallholder farmers in Pakistan. Kisaan AI helps farmers diagnose crop problems from photos, get irrigation and weather guidance, check daily mandi prices, and ask questions in **Urdu or English** — including when the phone is offline.

The app is designed for rural use: large, readable UI, spoken answers, Pakistani farm context (acres, canal turns / wari, mandis, rupees), and a one-time on-device model so field advice still works with patchy internet.

> Prototype / MVP. Phone login currently uses an on-device demo OTP (no SMS). Replace it with real SMS OTP before any production release.

## Highlights

- **Live Kisaan AI** — Gemini Live conversation by voice, text, or crop photo, tailored to the farmer’s profile, district, and today’s mandi rates
- **Offline farm helper** — Qwen3 0.6B on-device (ExecuTorch). Download once, then ask farming questions with no internet
- **Daily mandi rates** — Produce prices from IR Farm for Lahore, Karachi, Multan, and Islamabad, with speech playback
- **Local weather & farm alerts** — Open-Meteo forecast plus storm, rain, heat, frost, wind, and wet-weather disease-risk alerts
- **Urdu + English** — Full UI, RTL layout, Nastaliq/Naskh fonts, and spoken replies in the chosen language

---

## Features

### First-run experience

1. **Intro onboarding** — Welcome, crop-health overview, and farm-decision overview
2. **Language** — English or Urdu (change takes effect immediately; remembered on next launch)
3. **Appearance** — System, light, or dark theme
4. **Phone sign-in** — Pakistani mobile number (`+92`). A 6-digit demo code is shown in a toast until SMS is wired up
5. **Farm profile setup** — Name, village/area, nearest city, farm size (acres), crops, and farm location

After that, the farmer lands on the main tabs: **Home**, **AI**, **Mandi**, and **Profile**.

### Home

- Personalized greeting using the farmer’s name
- **Today’s farm alerts** — Ranked weather-based warnings for the saved district and crops, with a full alerts list and detail screens
- **Crop guides** — Latest farming articles from [IR Farm](https://irfarm.com/blogs/latest) in English and Urdu
- **Weather card** — Current conditions, farming advisory (one clear next action), and a 5-day forecast
- **Offline farm helper card** — Download / ready / unsupported status, with a shortcut into the on-device chat
- Pull-to-refresh for weather and alerts
- Offline banner when the connection drops; cached weather still shows with a “saved forecast” notice

### Live AI assistant (AI tab)

A live session with Gemini (`gemini-3.1-flash-live-preview`) over WebSocket:

- Speak, type, or attach a crop photo (camera or library; JPEG, PNG, WebP, HEIC up to 8 MB)
- Spoken replies in everyday village Urdu (Urdu script, not Roman Urdu) or simple English
- Advice uses the saved farm profile (crops, village, city, district, farm size)
- Current mandi rates are injected so the assistant can quote app-provided prices instead of inventing them
- Crop-health guidance describes what is visible and offers 1–2 likely causes — never a certain disease name from a photo alone
- Irrigation, weather protection, and selling/timing advice in Pakistani units (acre, kg, mound, rupees, canal turn)
- Suggested starter questions for crop leaves, watering, and today’s weather
- Auto-reconnect, live connection status, and a fallback to the offline helper when there is no internet

Live voice needs a **development build on a physical device** (microphone + native audio). Expo Go is not enough.

### Offline farm helper

For fields with no signal:

- One-time download of a quantized **Qwen3 0.6B** model (~400 MB) via ExecuTorch
- After that, text Q&A runs entirely on the phone
- Uses the same farm profile and language as live AI, with a shorter prompt suited to a small model
- Listen to answers with on-device text-to-speech
- Requires **Android 13+** or **iOS 17+** and enough memory; otherwise the card explains that live AI should be used when online

### Mandi rates

- Daily produce prices scraped from [IR Farm daily mandi rates](https://irfarm.com/pages/daily-mandi-rates)
- Pakistan average plus city ranges for **Lahore, Karachi, Multan, Islamabad**
- Search in English or Urdu
- Detail sheet with min/max, day-over-day change, and **listen to prices** (TTS)
- Device cache so yesterday’s list still opens offline, with a pull-to-refresh when back online

### Weather & alerts

- Forecast from [Open-Meteo](https://open-meteo.com/) for the farmer’s district (no API key)
- Shared Supabase cache so other farmers in the same district reuse a recent fetch
- Advisories for storms, rain today/tomorrow, heat, frost, wind, and a dry-weather work window
- Alerts also include **wet-weather crop disease risk** (a weather-based signal, not a confirmed outbreak)
- Location from GPS or a searchable district list covering Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad, AJK, and Gilgit-Baltistan

### Crop guides

- Fetches the five latest IR Farm articles
- English and Urdu body text on the same article
- Cached on device for offline reading

### Profile & settings

- View and edit name, phone, village, city, farm size, crops, and district
- Change language and theme at any time
- Change farm location (GPS or district picker)
- Sign out
- Crops: wheat, rice, cotton, sugarcane, maize, mustard, gram, potato, tomato, onion, chili, plus custom crop names

---

## How a typical session works

```text
Open app
  → language + theme (first launch)
  → Pakistani phone + demo OTP
  → farm profile (name, place, size, crops, location)
  → Home: alerts, weather, guides, offline helper

From Home or the AI tab:
  → Ask by voice / text / crop photo  (needs internet)
  → or open Offline farm helper        (after one download)

From Mandi:
  → search today’s rates → open a crop → listen to prices
```

---

## Tech stack

| Area | Choice |
| --- | --- |
| App | [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57, React Native 0.86, React 19, Expo Router |
| Language / UI | TypeScript, English + Urdu (RTL), Inter + Noto Arabic/Nastaliq fonts |
| Auth & data | [Supabase](https://supabase.com/) (profiles, weather cache, RLS) |
| Live AI | Gemini Live API (WebSocket, audio + images) |
| On-device AI | [react-native-executorch](https://github.com/software-mansion/react-native-executorch) (Qwen3 0.6B) |
| Weather | Open-Meteo |
| Mandi & blogs | IR Farm (HTML parse + device cache) |
| Location | Expo Location + district catalogue |
| Speech | Native TTS (`expo-speech`) and Gemini live audio (`react-native-audio-api`) |
| Builds | EAS Build (`development` / `preview` / `production`) |

**Platform targets:** Android-first (min SDK 33 / Android 13), iOS 17+. Portrait only.

---

## Project structure

```text
src/
  app/                 # Expo Router screens (onboarding, auth, tabs, details)
  components/          # UI for AI, weather, mandi, alerts, offline, profile
  providers/           # Auth, profile, language, theme, weather, network, alerts
  services/
    gemini/            # Live session, farmer context, mandi injection
    offline-llm/       # ExecuTorch runtime, prompt, download
    weather/           # Open-Meteo + advisories
    alerts/            # Forecast → farm alerts
    mandi/             # Daily rates fetch + cache
    blogs/             # IR Farm articles
    supabase/          # Auth, profiles, weather cache
  locales/             # en.json, ur.json
  constants/           # Crops, districts, theme
supabase/migrations/   # Profiles, location, weather cache, RLS
```

---

## Getting started

Live AI, ExecuTorch, and the microphone need a **development build**. Expo Go will not run this app fully.

### 1. Clone and install

```bash
git clone https://github.com/Haider-Mukhtar/kisaan-ai-mobile-app.git
cd kisaan-ai-mobile-app
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Gemini API key for live voice/chat (prototype only; do not ship a production key in the client) |

Apply the SQL in `supabase/migrations/` to the same project. In Supabase Auth, **disable “Confirm email”** — phone login currently creates a synthetic email user and needs an immediate session.

### 3. Run a development build

```bash
npx expo start
```

Then open it in a development client:

```bash
npx expo run:android
# or
npx expo run:ios
```

Or use EAS:

```bash
eas build --profile development --platform android
```

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start Expo |
| `npm run android` | Native Android run |
| `npm run ios` | Native iOS run |
| `npm run web` | Web (limited: no on-device LLM, limited live audio) |
| `npm run lint` | ESLint (`expo lint`) |

---

## Permissions

The app asks for:

- **Microphone** — live voice with Kisaan AI
- **Camera / photos** — crop photos for guidance
- **Location** — weather and district-matched advice (optional; farmers can pick a district from the list instead)

---

## Prototype notes

- **Demo OTP** is generated on the device and shown in a toast. It is not sent by SMS.
- Phone sessions are bridged onto Supabase email/password with a derived credential. Knowing a phone number is enough to sign in until real OTP is added (`src/services/supabase/phone-auth.ts`).
- Gemini and IR Farm calls run from the client. Treat keys and scraping as prototype wiring, not a production architecture.
- AI guidance can be wrong. The UI tells farmers to verify important decisions locally (agriculture officer, trusted dealer, product labels).

---

## License

Source in this repository follows the [MIT License](LICENSE) from the Expo template unless otherwise noted.
