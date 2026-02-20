# API Reference Guide

Complete API documentation for the Event Management App.

---

## 🔐 Authentication

All authenticated endpoints require a valid Supabase session. The session is managed via HTTP-only cookies.

### Headers
No special headers required - authentication is handled automatically via cookies.

### Error Responses
- `401` - Authentication required
- `403` - Insufficient permissions (admin required)
- `404` - Resource not found
- `409` - Conflict (e.g., already registered)
- `500` - Server error

---

## 📅 Events API

### List Events
```http
GET /api/events
```

**Query Parameters:**
- `query` (optional) - Search term for title/description
- `category` (optional) - Filter by category ID
- `status` (optional) - Filter by status ID

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Summer Music Festival",
      "subtitle": "Electronic & House Music",
      "eventDate": "2026-08-15",
      "startAt": "2026-08-15T16:00:00Z",
      "endAt": "2026-08-15T23:00:00Z",
      "statusId": "upcoming",
      "categoryId": "music",
      "visibilityId": "public",
      "locationName": "Central Park",
      "city": "New York",
      "coverImageUrl": "https://...",
      "shortDescription": "...",
      "description": "...",
      "organizerName": "MusicCo Events",
      "ratingAverage": 4.5,
      "ratingCount": 120,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Get Event by ID
```http
GET /api/events/:id
```

**Response:**
```json
{
  "event": { /* Event object */ }
}
```

**Access:**
- Public events: Anyone
- Private events: Admin or registered users only

### Create Event (Admin Only)
```http
POST /api/events
```

**Request Body:**
```json
{
  "title": "New Event",
  "subtitle": "Optional subtitle",
  "eventDate": "2026-03-01",
  "startAt": "2026-03-01T18:00:00Z",
  "endAt": "2026-03-01T22:00:00Z",
  "statusId": "upcoming",
  "categoryId": "music",
  "visibilityId": "public",
  "locationName": "Venue Name",
  "city": "City Name",
  "shortDescription": "Brief description",
  "description": "Full description",
  "organizerName": "Organizer Name",
  "coverImageUrl": "https://..." // optional
}
```

**Response:** `201 Created`
```json
{
  "event": { /* Created event */ }
}
```

**Validation:**
- Required fields: title, eventDate, startAt, statusId, categoryId, visibilityId, shortDescription, description, organizerName
- statusId must be valid ('upcoming', 'ongoing', 'past')
- categoryId must be valid ('music', 'sports', 'community', 'workshop', 'other')
- visibilityId must be valid ('public', 'private')
- endAt must be after startAt

### Update Event (Admin Only)
```http
PUT /api/events/:id
```

**Request Body:** (partial update supported)
```json
{
  "title": "Updated Title",
  "statusId": "ongoing"
}
```

**Response:** `200 OK`

### Delete Event (Admin Only)
```http
DELETE /api/events/:id
```

**Response:** `200 OK`
```json
{
  "message": "Event deleted successfully"
}
```

---

## 🎫 Registrations API

### Register for Event
```http
POST /api/registrations
```

**Request Body:**
```json
{
  "eventId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "registration": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid",
    "registeredAt": "2026-02-20T10:30:00Z"
  },
  "message": "Successfully registered for event. Ticket has been generated."
}
```

**Rules:**
- User must be authenticated
- Cannot register twice for same event
- Cannot register for past events
- Automatically generates ticket

**Errors:**
- `409` - Already registered
- `404` - Event not found
- `400` - Past event

### Check Registration Status
```http
GET /api/registrations?eventId=:eventId
```

**Response:**
```json
{
  "isRegistered": true
}
```

### Get User Registrations
```http
GET /api/registrations
```

**Response:**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "userId": "uuid",
      "registeredAt": "2026-02-20T10:30:00Z"
    }
  ]
}
```

### Cancel Registration
```http
DELETE /api/registrations?eventId=:eventId
```

**Response:** `200 OK`
```json
{
  "message": "Registration cancelled successfully"
}
```

**Rules:**
- Cannot cancel registration for past events

---

## 🎟️ Tickets API

### Get User Tickets
```http
GET /api/tickets
```

**Response:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "userId": "uuid",
      "ticketNumber": "EVT-A1B2C3D4",
      "issuedAt": "2026-02-20T10:30:00Z",
      "issuedToName": "John Doe",
      "issuedToEmail": "john@example.com"
    }
  ]
}
```

### Get Ticket for Specific Event
```http
GET /api/tickets?eventId=:eventId
```

**Response:**
```json
{
  "ticket": { /* Ticket object */ }
}
```

### Get Ticket by Number (Public)
```http
GET /api/tickets?ticketNumber=EVT-A1B2C3D4
```

**Response:**
```json
{
  "ticket": { /* Ticket object */ }
}
```

**Note:** This endpoint is public and doesn't require authentication - used for ticket verification.

### Verify Ticket (Public)
```http
GET /api/tickets?ticketNumber=EVT-A1B2C3D4&verify=true
```

**Response:**
```json
{
  "valid": true,
  "ticket": { /* Ticket object */ }
}
```

---

## 👑 Admin API

### Get All Events with Statistics
```http
GET /api/admin/events
```

**Response:**
```json
{
  "events": [
    {
      ...eventFields,
      "registrationCount": 45,
      "ticketCount": 45
    }
  ]
}
```

### Get Event Statistics
```http
GET /api/admin/events?eventId=:eventId
```

**Response:**
```json
{
  "event": { /* Event object */ },
  "registrationCount": 45,
  "ticketCount": 45,
  "registrations": [ /* Array of registrations */ ]
}
```

### Get Platform Statistics
```http
GET /api/admin/events?stats=platform
```

**Response:**
```json
{
  "totalEvents": 25,
  "totalUsers": 150,
  "totalRegistrations": 320,
  "totalTickets": 320,
  "eventsByStatus": {
    "upcoming": 10,
    "ongoing": 5,
    "past": 10
  },
  "eventsByCategory": {
    "music": 8,
    "sports": 6,
    "community": 7,
    "workshop": 3,
    "other": 1
  }
}
```

### Bulk Update Event Status
```http
PUT /api/admin/events
```

**Request Body:**
```json
{
  "eventIds": ["uuid1", "uuid2", "uuid3"],
  "statusId": "past"
}
```

**Response:** `200 OK`

### Get All Users
```http
GET /api/admin/users
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Get User by ID
```http
GET /api/admin/users?userId=:userId
```

**Response:**
```json
{
  "user": { /* User object */ }
}
```

### Update User Role
```http
PUT /api/admin/users
```

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "admin"
}
```

**Response:**
```json
{
  "user": { /* Updated user */ },
  "message": "User role updated successfully"
}
```

**Rules:**
- Cannot demote yourself
- Role must be 'user' or 'admin'

### Delete User
```http
DELETE /api/admin/users?userId=:userId
```

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

**Rules:**
- Cannot delete yourself
- Cascades to registrations and tickets

---

## 📋 Configuration Enums

### Event Statuses
```json
[
  { "id": "upcoming", "label": "Upcoming" },
  { "id": "ongoing", "label": "Ongoing" },
  { "id": "past", "label": "Past" }
]
```

### Event Categories
```json
[
  { "id": "music", "label": "Music" },
  { "id": "sports", "label": "Sports" },
  { "id": "community", "label": "Community" },
  { "id": "workshop", "label": "Workshop" },
  { "id": "other", "label": "Other" }
]
```

### Event Visibility
```json
[
  { "id": "public", "label": "Public" },
  { "id": "private", "label": "Private" }
]
```

---

## 🔧 Testing with cURL

### Create Event (Admin)
```bash
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

### Register for Event
```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId": "your-event-id-here"}'
```

### Verify Ticket
```bash
curl http://localhost:3000/api/tickets?ticketNumber=EVT-A1B2C3D4&verify=true
```

---

## 🚨 Error Handling

All API endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate registration)
- `500` - Internal Server Error

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Backend Setup Guide](BACKEND_SETUP.md)
