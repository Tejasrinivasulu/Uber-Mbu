# MBUGO — Campus Auto Booking Platform

**MBUGO** is a web-based campus ride-booking application for **Mohan Babu University (MBU)** and nearby Tirupati routes. It connects **students** and **auto drivers** with separate dashboards for booking rides, managing trips, tracking earnings, and accessing emergency safety tools.

The app uses a modern **teal & white** UI, works in the browser with **local storage** for demo data (no server setup required), and supports **light/dark themes**.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Running the Application](#running-the-application)
6. [Demo Login Credentials](#demo-login-credentials)
7. [Step-by-Step Working Procedure](#step-by-step-working-procedure)
8. [Emergency Contact](#emergency-contact)
9. [Project Structure](#project-structure)
10. [Build for Production](#build-for-production)
11. [Notes & Limitations](#notes--limitations)

---

## Features

### Student Dashboard
| Module | Description |
|--------|-------------|
| **Home** | Quick actions, ride stats, and recent activity |
| **Ride Booking** | Book instant, shared, scheduled, or full-auto rides with live map & route |
| **Near Autos** | View nearby available autos on campus |
| **Scheduled Rides** | Manage upcoming ride plans |
| **Ride History** | View past trips, fares, and receipts |
| **Emergency & Safety** | SOS, live location sharing, campus hotline, admin support |
| **Profile** | Update personal details and emergency contact |
| **Wallet** | Check balance and transaction history |
| **Ride Planner** | AI-assisted weekly schedule planning |

### Driver Dashboard
| Module | Description |
|--------|-------------|
| **Home** | Daily overview, online/offline toggle, ride stats |
| **Ride Requests** | Accept or decline incoming student bookings |
| **Active Ride** | Phase-based navigation map (pickup → drop) |
| **Scheduled Rides** | View upcoming assigned rides |
| **Earnings** | Income charts, weekly stats, and transactions |
| **Ride History** | Completed trips with search |
| **Emergency & Support** | SOS, location sharing, campus hotline |
| **Profile** | Driver account and vehicle details |

### General
- **MBUGO branding** with auto-rickshaw logo in navbar
- **Login / Signup** with glass-style form and campus background image
- **Fare calculator** with breakdown and shared-ride discounts
- **Light & dark theme** toggle
- **Responsive layout** for mobile and desktop

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Custom CSS, Bootstrap 5, Font Awesome 6 |
| **Charts** | Recharts |
| **Maps & Routing** | Leaflet + OpenStreetMap, Google Maps / OSRM (route upgrade) |
| **State & Data** | React Context API + `localStorage` (`auth.ts`, `localStore.ts`) |
| **AI Scheduling** | Google Gemini API (`@google/genai`) — optional for ride planner |
| **Fonts** | Inter (Google Fonts) |

> **Note:** Core authentication and ride data run on **local storage** for easy demo use. Firebase packages are included in dependencies but are not required for the main student/driver flows.

---

## Prerequisites

Before running MBUGO, install:

1. **Node.js** — version **18 or higher** ([https://nodejs.org](https://nodejs.org))
2. **npm** — comes with Node.js
3. A modern browser — Chrome, Edge, or Firefox (recommended)

Optional (for enhanced maps):
- Google Maps API key (configured in project if available)

---

## Installation & Setup

Follow these steps in order:

### Step 1 — Download the project
```bash
# If using Git
git clone <repository-url>```

Or extract the downloaded ZIP and open the folder in your terminal.

### Step 2 — Install dependencies
```bash
npm install
```

Wait until all packages are installed without errors.

### Step 3 — Start the development server
```bash
npm run dev
```

### Step 4 — Open in browser
The terminal will show a local URL, usually:

```
http://localhost:5173
```

Open that URL in your browser.

---

## Running the Application

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build in `dist/` folder |
| `npm run preview` | Preview the production build locally |

---

## Demo Login Credentials

Use these accounts on the login screen (password for both: **`password`**):

| Role | Email | Password |
|------|-------|----------|
| **Student** | `student@test.com` | `password` |
| **Driver** | `driver@test.com` | `password` |

You can also click **Login as Student** or **Login as Driver** on the demo panel.

### Create a new account
1. On the login page, click **Sign Up**
2. Enter name, email, and password (minimum 6 characters)
3. Choose **Student** or **Driver**
4. Click **Sign Up** — you will be logged in automatically

---

## Step-by-Step Working Procedure

### A. Student — Complete Ride Flow

#### 1. Login
1. Open the app URL in your browser
2. Enter `student@test.com` / `password` (or use demo button)
3. Click **Login**

#### 2. Book a ride
1. From the sidebar, open **Ride Booking**
2. Select ride type: **Instant**, **Shared**, **Schedule**, or **Full Auto**
3. Choose **Pickup** and **Destination** from campus stops (e.g. MBU Main Gate → Railway Station)
4. View the route on the map and fare estimate
5. Apply fare discount if available
6. Click **Book Ride**

#### 3. Track & manage ride
1. After booking, the ride appears as active
2. Use **Home** or notifications to see ride status
3. Cancel from the ride card if needed (with reason)

#### 4. Other student features
- **Near Autos** — browse available autos and book quickly
- **Scheduled Rides** — view or create future rides
- **Ride History** — check past trips and print receipt
- **Wallet** — view balance (demo wallet with ₹500 default)
- **Profile** — add emergency contact name & phone
- **Emergency** — SOS, share live GPS, call campus hotline
- **Ride Planner** — plan recurring campus trips

---

### B. Driver — Complete Ride Flow

#### 1. Login
1. Log out if logged in as student
2. Login with `driver@test.com` / `password`
3. Complete **Driver Onboarding** if prompted (first-time setup)

#### 2. Go online
1. On **Home**, toggle **Online** status
2. Wait for ride requests to appear

#### 3. Accept a ride
1. Open **Ride Requests** from the sidebar
2. Review student pickup, destination, and fare
3. Click **Accept**
4. You are redirected to **Active Ride**

#### 4. Complete the trip
1. Follow the phase stepper: **Navigate to Pickup** → **Arrived** → **Picked Up** → **In Progress** → **Completed**
2. Use the map for navigation
3. Click **Complete Ride** when the student is dropped off

#### 5. Other driver features
- **Earnings** — view charts and total income from real completed rides
- **Ride History** — search past trips
- **Scheduled Rides** — see upcoming bookings
- **Emergency & Support** — SOS and campus hotline

---

### C. Emergency & Safety Flow (Student)

1. Open **Emergency** from the sidebar
2. **SOS** — tap the red button to alert security (confirmation modal)
3. **Share Location** — share live GPS via WhatsApp or clipboard
4. **Emergency Contact** — call campus hotline **8984298984**
5. **Contact Admin** — raise a support ticket
6. Read **Safety Guidelines** at the bottom

---

### D. Theme Switch

1. Click the **theme toggle** (sun/moon icon) in the top-right navbar
2. Switch between **light** and **dark** mode

---

## Emergency Contact

| Field | Value |
|-------|-------|
| **Name** | MBUGO Emergency |
| **Available on** | Student & Driver emergency pages |

Students can also save a **personal emergency contact** in **Profile** for SOS and location sharing.

---

## Project Structure

```
Campus-Shuttle-main/
├── public/
│   ├── auth-bg.png          # Login background image
│   └── brand-logo.png       # Auto-rickshaw logo
├── components/
│   ├── BrandLogo.tsx        # MBUGO navbar logo
│   ├── student/             # Student layout & components
│   ├── driver/              # Driver layout & map components
│   └── RouteMap.tsx         # Leaflet route map
├── views/
│   ├── AuthScreen.tsx       # Login & signup
│   ├── StudentDashboard.tsx
│   ├── driver/              # Driver page sections
│   └── student/             # Student page sections
├── styles/
│   ├── student-dashboard.css
│   ├── driver-dashboard.css
│   └── brand-logo.css
├── data/
│   ├── campusStops.ts       # MBU & Tirupati stops
│   └── emergencyContacts.ts
├── contexts/
│   ├── FirebaseContext.tsx  # App state (localStorage-backed)
│   └── ThemeContext.tsx
├── auth.ts                  # Login, signup, demo accounts
├── localStore.ts            # Rides, wallet, waitlist data
├── App.tsx                  # Main routing
└── index.html               # Global styles & theme variables
```

---

## Build for Production

```bash
npm run build
npm run preview
```

The built files are output to the `dist/` folder. Deploy `dist/` to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

## Notes & Limitations

- Data is stored in the **browser localStorage** — clearing browser data will reset rides and accounts (except demo accounts on re-login).
- Maps use **OpenStreetMap** by default; routing may upgrade via Google/OSRM when available.
- This is a **demo/academic project** — not connected to real payment gateways or live GPS hardware.
- For best experience, use **Chrome** or **Edge** on desktop or mobile.

---

## Summary

| Item | Detail |
|------|--------|
| **App Name** | MBUGO |
| **Purpose** | Campus auto booking for MBU students & drivers |
| **Run Command** | `npm install` → `npm run dev` |
| **Student Login** | `student@test.com` / `password` |
| **Driver Login** | `driver@test.com` / `password` |
---

**MBUGO** — *Fast, safe, student-friendly campus rides.*
