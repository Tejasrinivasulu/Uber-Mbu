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
11. [Deploy to Netlify](#deploy-to-netlify)
12. [Deploy to Vercel](#deploy-to-vercel)
13. [Notes & Limitations](#notes--limitations)

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
git clone <repository-url>
```

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

The built files are output to the `dist/` folder.

---

## Deploy to Netlify

The project includes a `netlify.toml` file with the correct build settings.

### Method 1 — Deploy from GitHub (recommended)

1. **Push your project to GitHub**
   ```bash
   git init
   git add .
   git commit -m "MBUGO campus shuttle app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Sign in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Sign up or log in (use GitHub login for easiest setup)

3. **Add a new site**
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub** and authorize Netlify
   - Select your repository

4. **Build settings** (auto-filled from `netlify.toml`)
   | Setting | Value |
   |---------|-------|
   | Build command | `npm run build` |
   | Publish directory | `dist` |

5. Click **Deploy site**

6. Wait 1–2 minutes. Netlify gives you a live URL like:
   ```
   https://random-name-12345.netlify.app
   ```

7. **Optional:** Site settings → **Domain management** → change site name to something like `mbugo.netlify.app`

---

### Method 2 — Drag & drop (no GitHub)

1. Build locally:
   ```bash
   npm install
   npm run build
   ```

2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)

3. Drag the **`dist`** folder onto the page

4. Your site is live instantly

> Re-deploy manually each time you make changes.

---

### Method 3 — Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login:
   ```bash
   netlify login
   ```

3. From the project folder:
   ```bash
   npm run build
   netlify deploy --prod
   ```

4. Follow prompts — publish directory is **`dist`**

---

### After deployment

- Open your Netlify URL and test login with `student@test.com` / `password`
- **localStorage** works per browser — each visitor has their own demo data
- To redeploy after code changes: push to GitHub (Method 1) or run `netlify deploy --prod` again (Method 3)

---

## Deploy to Vercel

The project includes a `vercel.json` file with the correct Vite build settings.

### Method 1 — Deploy from GitHub (recommended)

1. **Push your project to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "MBUGO campus shuttle app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Sign in to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up or log in (use **Continue with GitHub** for easiest setup)

3. **Import project**
   - Click **Add New…** → **Project**
   - Import your GitHub repository
   - Vercel auto-detects **Vite**

4. **Build settings** (auto-filled from `vercel.json`)
   | Setting | Value |
   |---------|-------|
   | Framework Preset | Vite |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Install command | `npm install` |

5. Click **Deploy**

6. Wait 1–2 minutes. You get a live URL like:
   ```
   https://mbugo.vercel.app
   ```
   or `https://your-project-name.vercel.app`

7. **Optional:** Project **Settings** → **Domains** → add a custom domain

---

### Method 2 — Vercel CLI (no GitHub UI)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. From your project folder:
   ```bash
   vercel login
   vercel
   ```

3. Answer the prompts:
   - Set up and deploy? **Y**
   - Which scope? → your account
   - Link to existing project? **N** (first time)
   - Project name? → `mbugo` (or any name)
   - Directory? → `./` (press Enter)
   - Override settings? **N** (uses `vercel.json`)

4. For **production** deploy:
   ```bash
   vercel --prod
   ```

---

### After Vercel deployment

- Open your Vercel URL and test login: `student@test.com` / `password`
- Data is stored in each visitor's **browser localStorage** (no server database)
- Every **git push** to `main` auto-redeploys if GitHub is connected
- Check build logs under **Deployments** if something fails

### Vercel vs Netlify (for this project)

| | Vercel | Netlify |
|---|--------|---------|
| Best for | React / Vite apps | Static sites |
| Free tier | Yes | Yes |
| Auto deploy from Git | Yes | Yes |
| Config file | `vercel.json` | `netlify.toml` |

Both work perfectly for MBUGO — use whichever you prefer.

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
| **Emergency** | 8984298984 |

---

**MBUGO** — *Fast, safe, student-friendly campus rides.*
