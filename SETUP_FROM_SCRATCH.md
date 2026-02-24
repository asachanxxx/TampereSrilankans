# Complete Setup Guide — Tampere Sri Lankans Event App

This document is a step-by-step guide to get the entire app running from a fresh machine. Keep this somewhere safe.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Create the Supabase Project](#3-create-the-supabase-project)
4. [Get Supabase API Keys](#4-get-supabase-api-keys)
5. [Run the Database Schema](#5-run-the-database-schema)
6. [Set Up Google OAuth](#6-set-up-google-oauth)
7. [Set Up Facebook OAuth (Optional)](#7-set-up-facebook-oauth-optional)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Install Dependencies & Run Locally](#9-install-dependencies--run-locally)
10. [Create the First Admin User](#10-create-the-first-admin-user)
11. [Deploy to Vercel (Production)](#11-deploy-to-vercel-production)
12. [Post-Deployment: Update OAuth Redirect URLs](#12-post-deployment-update-oauth-redirect-urls)
13. [Run with Docker (Alternative)](#13-run-with-docker-alternative)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

Install these on your machine before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| npm | comes with Node | — |
| Git | any recent | https://git-scm.com |

Accounts you need:

- [Supabase](https://supabase.com) — free tier is enough
- [Google Cloud Console](https://console.cloud.google.com) — for Google login
- [Vercel](https://vercel.com) — for production deployment (optional for local dev)
- [Facebook Developers](https://developers.facebook.com) — only if you want Facebook login

---

## 2. Clone the Repository

```bash
git clone <your-repo-url>
cd TampereSrilankans
```

---

## 3. Create the Supabase Project

1. Go to https://supabase.com and sign in.
2. Click **New Project**.
3. Fill in:
   - **Project Name**: `TampereSrilankans` (or whatever you like)
   - **Database Password**: Choose a strong password — **save it somewhere safe**
   - **Region**: `eu-north-1` (Stockholm) — closest to Tampere
   - **Plan**: Free tier is fine
4. Click **Create new project** and wait 2–3 minutes for it to be ready.

---

## 4. Get Supabase API Keys

1. In the Supabase dashboard, go to **Settings → API** (left sidebar).
2. Note down these three values:

| Value | Where to find it |
|-------|-----------------|
| **Project URL** | `https://xxxxxxxxxxxx.supabase.co` |
| **anon / public key** | Long string starting with `eyJ...` |
| **service_role key** | Another long `eyJ...` string — keep this SECRET |

You will paste these into `.env.local` in step 8.

---

## 5. Run the Database Schema

This creates all tables, RLS policies, indexes, and triggers.

1. In Supabase dashboard, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `backend/database/schema.sql` from this repo.
4. Copy the **entire** file content and paste it into the SQL editor.
5. Click **Run** (bottom right).

You should see success messages for:
- Tables: `profiles`, `events`, `event_registrations`, `tickets`
- RLS enabled on all tables
- Policies created
- Indexes and triggers created

> If you see errors, make sure you are running it on a fresh project with no existing tables.

---

## 6. Set Up Google OAuth

Google login is the primary auth method.

### Step A — Create credentials in Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project (or select an existing one):
   - Click the project dropdown at the top → **New Project**
   - Name it `TampereSrilankans`
3. Go to **APIs & Services → OAuth consent screen**:
   - Choose **External**
   - Fill in **App name**, your email as support contact
   - Add your email as test user (for development)
   - Click **Save and Continue** through the rest
4. Go to **APIs & Services → Credentials**:
   - Click **Create Credentials → OAuth 2.0 Client ID**
   - Choose **Web application**
   - **Name**: `TampereSrilankans Web`
   - Under **Authorized redirect URIs**, add **both** of these:
     ```
     https://<your-supabase-project-id>.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
   - Replace `<your-supabase-project-id>` with the ID from your Supabase project URL

5. Click **Create** — a popup shows your:
   - **Client ID** — copy it
   - **Client Secret** — copy it

> You can always find these again at **APIs & Services → Credentials → your OAuth client**.

### Step B — Enable Google in Supabase

1. In Supabase dashboard, go to **Authentication → Providers**.
2. Find **Google** and click to expand it.
3. Toggle it **on**.
4. Paste your **Client ID** and **Client Secret**.
5. Click **Save**.

---

## 7. Set Up Facebook OAuth (Optional)

Only do this if you also want Facebook login.

### Step A — Create Facebook App

1. Go to https://developers.facebook.com
2. Click **My Apps → Create App**
3. Choose app type: **Consumer**
4. Fill in app name and contact email → **Create App**
5. In the app dashboard, go to **Settings → Basic**:
   - Copy the **App ID** and **App Secret**
6. Add the **Facebook Login** product:
   - Click **Add Product** → **Facebook Login → Set Up**
   - In Facebook Login **Settings**, add the OAuth redirect URI:
     ```
     https://<your-supabase-project-id>.supabase.co/auth/v1/callback
     ```
7. Save changes.

### Step B — Enable Facebook in Supabase

1. In Supabase dashboard, go to **Authentication → Providers**.
2. Find **Facebook** and toggle it **on**.
3. Paste your **App ID** and **App Secret**.
4. Click **Save**.

---

## 8. Configure Environment Variables

Create the local environment file for the Next.js app:

```bash
cd event-ui
copy .env.example .env.local
```

Open `event-ui/.env.local` and fill in all values:

```env
# ─── Supabase ────────────────────────────────────────────────
# From Settings → API in your Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR...

# ─── Site URL ────────────────────────────────────────────────
# Local development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# For production, change this to your Vercel URL, e.g.:
# NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# ─── Admin Users ─────────────────────────────────────────────
# Comma-separated list of email addresses that get admin role automatically
# on their FIRST login. Add your own Google email here.
ADMIN_EMAILS=your-email@gmail.com
```

> **Important**: Never commit `.env.local` to Git. It is already in `.gitignore`.

---

## 9. Install Dependencies & Run Locally

Install dependencies for both the UI and backend packages:

```bash
# Install the frontend + API layer
cd event-ui
npm install

# Install backend type-checking dependencies
cd ../backend
npm install
```

Start the development server:

```bash
cd ../event-ui
npm run dev
```

Open http://localhost:3000 — you should see the app running.

Test the flow:
1. Click **Sign in** and log in with your Google account
2. You should be redirected back to the app as a logged-in user
3. Your email (if in `ADMIN_EMAILS`) will automatically get admin privileges

---

## 10. Create the First Admin User

### Option A — Automatic via `ADMIN_EMAILS` (recommended)

Add your email to `ADMIN_EMAILS` in `.env.local` **before** you first log in:

```env
ADMIN_EMAILS=your-email@gmail.com
```

When you sign in for the first time, the app will automatically assign you the `admin` role.

### Option B — Manually via Supabase SQL

If you have already signed in and are not an admin yet:

1. Sign in to the app at http://localhost:3000/auth
2. In Supabase dashboard, go to **Authentication → Users**
3. Find your account and copy the **User ID** (a UUID like `abc123-...`)
4. Go to **SQL Editor** and run:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'paste-your-user-id-here';
```

5. Log out of the app and log back in — you will now see the **Admin** menu.

---

## 11. Deploy to Vercel (Production)

### Step A — Push to GitHub

Make sure your code is pushed to a GitHub repository.

### Step B — Import to Vercel

1. Go to https://vercel.com and sign in.
2. Click **Add New → Project**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `event-ui` (very important!).
5. Framework preset will be detected as **Next.js** automatically.

### Step C — Add Environment Variables in Vercel

In the Vercel project settings → **Environment Variables**, add all the same variables from your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL        ← set this to your Vercel production URL
ADMIN_EMAILS
```

### Step D — Deploy

Click **Deploy**. Vercel will build and deploy the app.

After deploy, your app URL will be something like `https://your-app.vercel.app`.

---

## 12. Post-Deployment: Update OAuth Redirect URLs

After deploying to production, you must add the production URL to your OAuth apps.

### Google Cloud Console

1. Go to **APIs & Services → Credentials → your OAuth 2.0 Client**
2. Under **Authorized redirect URIs**, add:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Save.

### Supabase — Site URL and Redirect URLs

1. In Supabase dashboard, go to **Authentication → URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://your-app.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://your-app.vercel.app/auth/callback
   ```
4. Save.

### Facebook (if used)

1. In Facebook App → **Facebook Login → Settings**
2. Add to **Valid OAuth Redirect URIs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```

---

## 13. Run with Docker (Alternative)

If you prefer Docker instead of running `npm run dev`:

```bash
# From the project root
docker compose up --build
```

The app will be available at http://localhost:3000.

Make sure `event-ui/.env.local` exists and is filled in before running Docker.

---

## 14. Troubleshooting

### "Failed to fetch events" on the home page

- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in `.env.local`
- Make sure `schema.sql` was run in Supabase
- Restart the dev server after changing `.env.local`

### Redirected to `/not-authorized` after login

- Your user does not have the admin role
- See [Step 10](#10-create-the-first-admin-user) to grant admin access

### Google login redirects to an error page

- Check that the redirect URI in Google Cloud Console exactly matches:
  `https://<project-id>.supabase.co/auth/v1/callback`
- Make sure Google OAuth is enabled and saved in Supabase **Authentication → Providers**

### "Invalid API key" or 401 errors from Supabase

- Double-check the keys copied from **Settings → API** in Supabase
- Make sure there are no extra spaces when pasting them

### Admin menu not showing after login

- Log out and log back in (role is read on session creation)
- Or manually check: in Supabase **Table Editor → profiles**, verify your row has `role = 'admin'`

### `SUPABASE_SERVICE_ROLE_KEY` not working

- This key is for **server-side only** — never use it in browser code
- Make sure it is NOT prefixed with `NEXT_PUBLIC_`

---

## Quick Reference

### Key files

| File | Purpose |
|------|---------|
| `event-ui/.env.local` | All environment variables — create from `.env.example` |
| `backend/database/schema.sql` | Full DB schema to run in Supabase SQL editor |
| `event-ui/src/app/auth/callback/` | OAuth callback handler |
| `event-ui/middleware.ts` | Route protection (admin, me pages) |

### Key URLs when running locally

| URL | What it is |
|-----|-----------|
| http://localhost:3000 | App home |
| http://localhost:3000/auth | Login page |
| http://localhost:3000/admin | Admin dashboard |
| http://localhost:3000/me | User dashboard |

### Environment variables summary

| Variable | Public/Secret | What it is |
|----------|--------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase service role key — server only |
| `NEXT_PUBLIC_SITE_URL` | Public | App base URL |
| `ADMIN_EMAILS` | Server | Comma-separated admin email list |

---

*Last updated: February 2026*
