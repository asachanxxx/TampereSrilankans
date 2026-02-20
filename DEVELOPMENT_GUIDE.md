# Development Workflow

Best practices and workflows for developing the Event Management App.

---

## 🏗️ Architecture Principles

### Separation of Concerns
- **UI Layer**: Components only handle presentation
- **API Layer**: Routes handle HTTP, delegate to services
- **Service Layer**: Business logic and rules
- **Repository Layer**: Database access only
- **Policy Layer**: Authorization decisions

### Data Flow
```
User Action → Component → API Route → Service → Repository → Database
                                         ↓
                                    Validators
                                    Policies
```

---

## 📂 File Organization

### Adding a New Feature

Example: Adding event comments

1. **Model** (`event-ui/src/models/comment.ts`)
```typescript
export type Comment = {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
};
```

2. **Repository** (`backend/repositories/CommentRepository.ts`)
```typescript
export class CommentRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async getEventComments(eventId: string): Promise<Comment[]> {
    // Database queries only
  }
  
  async createComment(comment: Partial<Comment>): Promise<Comment> {
    // Insert logic
  }
}
```

3. **Validator** (`backend/validators/CommentValidator.ts`)
```typescript
export class CommentValidator {
  static validateCreate(comment: Partial<Comment>): void {
    // Validation rules
  }
}
```

4. **Service** (`backend/services/CommentService.ts`)
```typescript
export class CommentService {
  constructor(private supabase: SupabaseClient) {
    this.commentRepo = new CommentRepository(supabase);
  }
  
  async createComment(eventId: string, content: string, user: AppUser): Promise<Comment> {
    // Business logic
    // Authorization checks
    // Call validator
    // Call repository
  }
}
```

5. **API Route** (`event-ui/src/app/api/comments/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const service = new CommentService(supabase);
    
    const body = await request.json();
    const comment = await service.createComment(
      body.eventId,
      body.content,
      user
    );
    
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

6. **UI Component** (`event-ui/src/components/events/CommentList.tsx`)
```typescript
async function handleSubmit() {
  const response = await fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ eventId, content })
  });
  // Handle response
}
```

---

## 🔒 Security Checklist

When adding new features, verify:

- [ ] **RLS Policy** - Database policy created
- [ ] **Service Authorization** - Policy checks in service layer
- [ ] **Input Validation** - Validator created and used
- [ ] **Auth Check in API** - `requireAuth()` or `requireAdmin()` called
- [ ] **Type Safety** - TypeScript types defined
- [ ] **Error Handling** - Proper error messages
- [ ] **No Direct DB Access** - UI never calls Supabase directly

---

## 🧪 Testing Strategy

### Manual Testing Workflow

1. **Unauthenticated User**
   - Can view public events
   - Cannot register
   - Cannot access admin pages

2. **Authenticated User**
   - Can register for events
   - Can view own tickets
   - Can cancel registrations
   - Cannot access admin pages

3. **Admin User**
   - Can create/edit/delete events
   - Can view all registrations
   - Can manage users
   - Can view statistics

### Test Scenarios

#### Event Creation
```bash
# As admin, create private event
POST /api/events
{
  "title": "Private VIP Event",
  "visibilityId": "private",
  ...
}

# Verify regular user cannot see it
GET /api/events (as regular user)
# Should not include private event

# Verify admin can see it
GET /api/events (as admin)
# Should include private event
```

#### Registration Flow
```bash
# Register user for event
POST /api/registrations
{ "eventId": "..." }

# Verify ticket generated
GET /api/tickets?eventId=...
# Should return ticket

# Try to register again
POST /api/registrations
{ "eventId": "..." }
# Should return 409 Conflict

# Verify ticket number works
GET /api/tickets?ticketNumber=EVT-XXXXXXXX
# Should return ticket details
```

---

## 📊 Database Management

### Viewing Data

Use Supabase Table Editor or SQL Editor:

```sql
-- View all events
SELECT * FROM events ORDER BY created_at DESC;

-- View registrations with user info
SELECT 
  er.id,
  e.title as event_title,
  p.display_name as user_name,
  er.registered_at
FROM event_registrations er
JOIN events e ON e.id = er.event_id
JOIN profiles p ON p.id = er.user_id;

-- Count registrations per event
SELECT 
  e.title,
  COUNT(er.id) as registration_count
FROM events e
LEFT JOIN event_registrations er ON er.event_id = e.id
GROUP BY e.id, e.title
ORDER BY registration_count DESC;
```

### Updating Data

```sql
-- Make user admin
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';

-- Update event status
UPDATE events SET status_id = 'ongoing' WHERE event_date = CURRENT_DATE;

-- Delete test data
DELETE FROM events WHERE title LIKE 'Test%';
```

### Backup Important Queries

```sql
-- Export all events
SELECT * FROM events;

-- Export all registrations
SELECT * FROM event_registrations;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Authentication required"
**Solution**: 
- Check if user is logged in
- Verify session cookie exists
- Check Supabase auth status

### Issue: "Admin access required"
**Solution**:
- Verify user role in `profiles` table
- Update role to 'admin' manually if needed
- Log out and log back in

### Issue: Module not found in API routes
**Solution**:
- Check relative path (use `../../../../../../../backend/...`)
- Verify backend dependencies installed
- Restart dev server

### Issue: RLS policy blocking query
**Solution**:
- Check if user is authenticated
- Verify policy logic in SQL
- Use admin client for testing (bypass RLS)

### Issue: CORS errors
**Solution**:
- Should not occur (same origin)
- If testing externally, configure Next.js CORS

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in Vercel
- [ ] Supabase production project created
- [ ] Database schema applied to production
- [ ] RLS policies verified
- [ ] Admin user created
- [ ] OAuth redirect URLs updated

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test event creation
- [ ] Test registration flow
- [ ] Test ticket generation
- [ ] Verify admin access
- [ ] Check error logging
- [ ] Monitor Supabase usage

---

## 📈 Performance Tips

### Frontend
- Use Next.js Image component for event images
- Implement pagination for event lists
- Cache public event list
- Lazy load components

### Backend
- Add database indexes on frequently queried fields
- Use select() to fetch only needed columns
- Implement pagination in repositories
- Cache config JSON files

### Database
```sql
-- Useful indexes already created:
CREATE INDEX idx_events_visibility ON events(visibility_id);
CREATE INDEX idx_events_status ON events(status_id);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
```

---

## 🔄 Git Workflow

### Branch Strategy
```bash
main          # Production
└── develop   # Development
    └── feature/event-comments
    └── feature/email-notifications
    └── bugfix/registration-error
```

### Commit Messages
```bash
feat: Add event comment feature
fix: Resolve double registration bug
docs: Update API documentation
refactor: Extract validation logic
style: Format code with prettier
test: Add registration flow tests
```

---

## 📝 Code Style

### TypeScript
- Use explicit types, avoid `any`
- Use interfaces for complex objects
- Export types from models
- Use async/await over promises

### Naming Conventions
- **Files**: PascalCase for classes (`EventService.ts`)
- **Functions**: camelCase (`createEvent`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_EVENTS`)
- **Types**: PascalCase (`EventStatus`)

### Comments
```typescript
/**
 * Service-level documentation with purpose
 */
export class EventService {
  /**
   * Method documentation with params and return
   */
  async createEvent(data: EventData): Promise<Event> {
    // Implementation comments when logic is complex
  }
}
```

---

## 🛠️ Useful Commands

### Development
```bash
# Start frontend dev server
cd event-ui
npm run dev

# Type check backend
cd backend
npm run type-check

# Build for production
cd event-ui
npm run build
```

### Database
```bash
# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id your-project-id

# Run migrations
npx supabase db push
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs/primitives/overview/introduction)

---

**Happy Coding! 🚀**
