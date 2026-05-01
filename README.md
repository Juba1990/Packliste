# 🎒 Packliste App

Smarte Packlisten-App mit Wetter, Live-Sharing und Gewichts-Tracking.

## Features

- ✅ Login / Registrierung (Shared Account für Partner)
- ✅ Wettervorhersage (Temperatur, Nacht, Niederschlag in mm)
- ✅ Packlisten mit Kategorien, Items, Menge, Person
- ✅ Gewicht-Tracking (🏋️ Toggle)
- ✅ Personenfilter (A, B, C, + Person)
- ✅ Listen speichern & laden
- ✅ Share-Link (nur Anschauen + Abhaken)
- ✅ Live-Sync (Firebase Realtime DB)
- ✅ PWA (Mobile App-like)
- ✅ Violett Design

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Firebase Setup

Die Firebase Config ist bereits eingebaut in `src/firebase.ts`.

**Wichtig:** Aktiviere in der Firebase Console:
- Authentication → Email/Password
- Realtime Database → erstellen (europe-west1)

**Realtime Database Rules** (Firebase Console → Realtime Database → Rules):
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "shared": {
      ".read": true,
      "$shareId": {
        ".write": "auth != null"
      }
    }
  }
}
```

### 3. Lokal starten

```bash
npm run dev
```

### 4. Bauen für Produktion

```bash
npm run build
```

## Deployment (Vercel)

1. Repo auf GitHub pushen
2. vercel.com → "Import Project" → GitHub Repo wählen
3. Framework: **Vite**
4. Deploy klicken
5. ✅ Live!

## Tech Stack

- React 18 + TypeScript
- Firebase (Auth + Realtime Database)
- Vite + PWA Plugin
- Open-Meteo API (Wetter, kostenlos)
- Lucide React (Icons)
