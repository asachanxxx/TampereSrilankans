# Event Management App

A modern, full-stack event management application built with Next.js 14, TypeScript, and Supabase.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Next.js App (Vercel)                            │
│                                                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │  UI Pages    │◄──────►│  API Routes  │                  │
│  │ (App Router) │        │              │                  │
│  └──────────────┘        └───────┬──────┘                  │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │      Backend Services          │
                    │  (Business Logic Layer)        │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │     Repositories Layer         │
                    │  (Data Access Layer)           │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │    Supabase Backend            │
                    │  • PostgreSQL Database         │
                    │  • Row Level Security (RLS)    │
                    │  • Authentication              │
                    └────────────────────────────────┘
```

## 📁 Project Structure

```
Src/
├── backend/                    # Backend business logic (separate from UI)
│   ├── services/              # Business logic layer
│   │   ├── EventService.ts
│   │   ├── RegistrationService.ts
│   │   ├── TicketService.ts
│   │   └── AdminService.ts
│   ├── repositories/          # Data access layer
│   │   ├── EventRepository.ts
│   │   ├── RegistrationRepository.ts
│   │   ├── TicketRepository.ts
│   │   └── ProfileRepository.ts
│   ├── validators/            # Input validation
│   │   ├── EventValidator.ts
│   │   └── RegistrationValidator.ts
│   ├── policies/              # Authorization logic
│   │   └── accessControl.ts
│   ├── lib/                   # Utilities
│   │   └── supabase/
│   │       ├── client.ts      # Browser client
│   │       └── server.ts      # Server-side client
│   └── database/
│       └── schema.sql         # Database schema with RLS policies
│
├── event-ui/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Next.js 14 App Router
│   │   │   ├── api/          # API routes
│   │   │   │   ├── events/
│   │   │   │   ├── registrations/
│   │   │   │   ├── tickets/
│   │   │   │   └── admin/
│   │   │   ├── admin/        # Admin pages
│   │   │   ├── events/       # Public event pages
│   │   │   ├── me/           # User dashboard
│   │   │   └── auth/         # Authentication pages
│   │   ├── components/        # React components
│   │   ├── models/           # TypeScript models
│   │   │   ├── event.ts
│   │   │   ├── user.ts
│   │   │   ├── ticket.ts
│   │   │   └── registration.ts
│   │   ├── config/           # JSON configuration
│   │   │   ├── event-categories.json
│   │   │   ├── event-statuses.json
│   │   │   └── event-visibility.json
│   │   ├── lib/              # Utility functions
│   │   ├── state/            # State management
│   │   └── mock/             # Mock data (for UI development)
│   └── package.json
│
└── Instructions/              # Documentation
    ├── Backend and other instructions.txt
    └── BACKEND_SETUP.md
```

## 🎯 Key Features

### For Users
- 📅 Browse public events
- 🎫 Register for events
- 🔖 View and download event tickets with QR codes
- 👤 User dashboard with registered events
- 🔐 Secure authentication (Email + OAuth)

### For Admins
- 📝 Create, edit, and delete events
- 👥 Manage user roles
- 📊 View event statistics and registrations
- 🎟️ View all issued tickets
- 📈 Platform analytics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Email + OAuth)
- **API**: Next.js API Routes
- **Security**: Row Level Security (RLS)
- **Validation**: Custom validators

### Deployment
- **Frontend/API**: Vercel
- **Database/Auth**: Supabase
- **Free Tier**: Optimized for free tier deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)

### Installation

1. **Install frontend dependencies**:
   ```bash
   cd event-ui
   npm install
   ```

2. **Install backend dependencies**:
   ```bash
   cd ../backend
   npm install
   ```

### Setup

Follow the complete setup guide in [BACKEND_SETUP.md](BACKEND_SETUP.md)

Quick steps:
1. Create Supabase project
2. Run database schema
3. Configure environment variables
4. Enable authentication providers
5. Create admin user

### Development

```bash
cd event-ui
npm run dev
```

Visit http://localhost:3000

## 📚 API Documentation

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
- `GET /api/admin/events?stats=platform` - Platform statistics
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users` - Update user roles

## 🔒 Security

### Authentication
- Email/password authentication
- Google OAuth integration
- Facebook OAuth integration
- Secure session management via Supabase

### Authorization
- Row Level Security (RLS) policies on all tables
- Server-side role verification
- Policy-based access control in services
- No direct database access from UI

### Data Protection
- Environment variables for sensitive keys
- Service role key kept server-side only
- Input validation on all endpoints
- SQL injection protection via Supabase SDK

## 📊 Database Schema

### Tables
- **profiles** - User profiles extending auth.users
- **events** - Event information
- **event_registrations** - User registrations for events
- **tickets** - Generated event tickets

### Key Features
- Foreign key constraints with cascade deletes
- Unique constraints (user can't double-register)
- Automatic profile creation via trigger
- Indexes for query optimization

## 🧪 Testing Checklist

- [ ] User registration and login
- [ ] Event creation (admin)
- [ ] Event registration (user)
- [ ] Ticket generation
- [ ] QR code display
- [ ] Admin dashboard
- [ ] User dashboard
- [ ] OAuth login (Google/Facebook)
- [ ] RLS policy enforcement
- [ ] API authorization checks

## 📈 Future Enhancements

- [ ] Event capacity limits
- [ ] Waitlist functionality
- [ ] Email notifications
- [ ] Event reminders
- [ ] Payment integration
- [ ] Event reviews and ratings
- [ ] Search and filters
- [ ] Calendar integration
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📄 License

Private - All rights reserved

## 📞 Support

For setup issues, refer to [BACKEND_SETUP.md](BACKEND_SETUP.md)

---

**Built with ❤️ using Next.js and Supabase**
