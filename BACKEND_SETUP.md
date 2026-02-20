# Backend Setup Guide

## Complete Backend Implementation

This guide will help you set up the complete backend infrastructure for the Event Management App using Supabase.

---

## 📋 Architecture Overview

```
Browser
   ↓
Vercel (Next.js UI + API routes)
   ↓
Supabase (PostgreSQL + Auth + RLS)
```

**Backend Structure:**
- `backend/` - All backend logic (services, repositories, policies, validators)
- `event-ui/src/app/api/` - Next.js API routes
- `event-ui/src/lib/` - Supabase client initialization

---

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: event-management-app
   - **Database Password**: (Save this securely!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is fine for development

5. Wait 2-3 minutes for project initialization

---

## 🔑 Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**

2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this secret!)

3. Create `.env.local` in `event-ui/` folder:

```bash
cd event-ui
cp .env.example .env.local
```

4. Edit `.env.local` and paste your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

⚠️ **NEVER commit `.env.local` to git!** (It's already in .gitignore)

---

## 🗄️ Step 3: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**

2. Click **New Query**

3. Copy the entire contents of `backend/database/schema.sql`

4. Paste into the SQL editor

5. Click **Run** (bottom right)

6. Verify success - you should see:
   - ✅ Tables created: `profiles`, `events`, `event_registrations`, `tickets`
   - ✅ RLS enabled on all tables
   - ✅ Policies created
   - ✅ Indexes created
   - ✅ Trigger created

---

## 🔐 Step 4: Configure Authentication

### Enable Email/Password Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Enable it
4. Set:
   - **Confirm email**: OFF (for development) or ON (for production)
   - **Secure password**: ON

### Enable Google OAuth (Optional)

1. Create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project
   - Enable Google+ API
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```
   
2. In Supabase **Authentication** → **Providers**:
   - Enable **Google** provider
   - Paste **Client ID** and **Client Secret**

### Enable Facebook OAuth (Optional)

1. Create Facebook App:
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create new app
   - Add Facebook Login product
   - Add OAuth redirect URIs

2. In Supabase **Authentication** → **Providers**:
   - Enable **Facebook** provider
   - Paste **App ID** and **App Secret**

---

## 👤 Step 5: Create Admin User

1. Start your Next.js app:
   ```bash
   cd event-ui
   npm run dev
   ```

2. Open http://localhost:3000

3. Register a new account using the UI

4. After registration, go to Supabase dashboard → **Table Editor** → **profiles**

5. Find your user row

6. Edit the `role` column from `user` to `admin`

7. Save changes

Your account now has admin privileges! 🎉

---

## ✅ Step 6: Verify Setup

### Test RLS Policies

1. In Supabase **SQL Editor**, run:

```sql
-- Should return your profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Try to read events (should work for public events)
SELECT * FROM events WHERE visibility_id = 'public';
```

### Test API Routes

1. Start the dev server:
   ```bash
   cd event-ui
   npm run dev
   ```

2. Test endpoints:

```bash
# Get public events
curl http://localhost:3000/api/events

# Create event (requires admin auth)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "eventDate": "2026-03-01",
    "startAt": "2026-03-01T18:00:00Z",
    "shortDescription": "A test event",
    "description": "Full description here",
    "organizerName": "Test Organizer",
    "statusId": "upcoming",
    "categoryId": "music",
    "visibilityId": "public"
  }'
```

---

## 📊 Step 7: Seed Test Data (Optional)

Create some test events in Supabase **SQL Editor**:

```sql
INSERT INTO events (
  title, subtitle, event_date, start_at, status_id, 
  category_id, visibility_id, short_description, 
  description, organizer_name
) VALUES
  (
    'Summer Music Festival 2026',
    'Electronic & House Music',
    '2026-08-15',
    '2026-08-15T16:00:00Z',
    'upcoming',
    'music',
    'public',
    'The biggest electronic music festival of the summer',
    'Join us for an unforgettable day of music...',
    'MusicCo Events'
  ),
  (
    'Community Cleanup Day',
    'Make our city cleaner together',
    '2026-03-20',
    '2026-03-20T09:00:00Z',
    'upcoming',
    'community',
    'public',
    'Help clean up local parks and streets',
    'Bring your family and friends...',
    'City Community Board'
  );
```

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch events"

**Solution**: Check:
1. Is Supabase project running?
2. Are environment variables set correctly in `.env.local`?
3. Did you run the schema.sql script?
4. Check browser console for errors

### Issue: "Authentication required"

**Solution**: 
1. Make sure you're logged in
2. Check if your session is valid
3. Try logging out and back in

### Issue: "Only admins can create events"

**Solution**:
1. Check your role in the `profiles` table
2. Update role to `admin` manually in Supabase dashboard
3. Log out and log back in

### Issue: RLS Policy blocking access

**Solution**:
1. Verify RLS policies in Supabase dashboard
2. Check if user is authenticated
3. Review policy logic in `schema.sql`

---

## 📚 Next Steps

1. **Deploy to Production**:
   - Push code to GitHub
   - Connect Vercel to your repo
   - Add environment variables in Vercel dashboard
   - Deploy!

2. **Configure Email Templates**:
   - Go to Supabase **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails

3. **Set Up Domain**:
   - Add custom domain in Vercel
   - Update OAuth redirect URLs
   - Update Supabase site URL

4. **Monitor Usage**:
   - Check Supabase **Database** tab for usage metrics
   - Monitor API requests in Vercel dashboard

---

## 🎯 API Endpoints Reference

### Public Endpoints
- `GET /api/events` - List public events
- `GET /api/events/[id]` - Get event details
- `GET /api/tickets?ticketNumber=XXX` - Verify ticket

### Authenticated Endpoints
- `POST /api/registrations` - Register for event
- `GET /api/registrations` - Get user registrations
- `GET /api/tickets` - Get user tickets
- `DELETE /api/registrations?eventId=XXX` - Cancel registration

### Admin Endpoints
- `POST /api/events` - Create event
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event
- `GET /api/admin/events` - Get events with stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users` - Update user role

---

## 📝 Database Schema

### Tables
- **profiles** - User profiles (extends auth.users)
- **events** - Event information
- **event_registrations** - User event registrations
- **tickets** - Generated tickets

### Key Features
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Automatic profile creation via trigger
- ✅ Cascade deletes configured
- ✅ Indexes for performance
- ✅ Unique constraints on registrations

---

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] Service role key stored securely (server-side only)
- [x] Admin role verified server-side
- [x] Input validation in validators
- [x] Authorization checks in services
- [x] No direct Supabase client usage in UI components

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Setup Complete! 🎉**

Your backend is now fully implemented and ready to use.
