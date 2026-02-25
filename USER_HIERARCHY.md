# User Hierarchy and Privileges

This document outlines the three-tier user system implemented in the EventCal application, detailing the permissions and capabilities of each role.

## Overview

The application uses a role-based access control system with three distinct user levels:
- **Public** (Default role for new users)
- **Organizer** (Event creators and managers)
- **Admin** (System administrators with full access)

---

## Public Role

**Default Role**: All newly registered users start as Public users.

### Capabilities
- View all approved events on the calendar
- Filter and search events by:
  - Genre/category
  - Location (state, city, zip code)
  - Date range
  - Price range
  - Age restrictions
  - Distance from current location
- Save favorite events to personal list
- Manage personal preferences:
  - Calendar display settings (show/hide past events)
  - Menu interaction preferences (click vs hover)
  - Calendar sync options
- Update personal profile information
- Self-upgrade to Organizer role (no admin approval required)

### Restrictions
- **Cannot** create events
- **Cannot** manage events
- **Cannot** upload CSV files for bulk imports
- **Cannot** access "My Events" page
- **Cannot** view pending or rejected events
- **Cannot** access admin dashboard

### Database Permissions (RLS Policies)
- Read own profile data
- Update own profile data
- Read all approved events
- Manage own favorites
- Manage own preferences

---

## Organizer Role

**Upgrade Path**: Public users can self-upgrade through Settings or the My Events page.

### Capabilities
**All Public role capabilities, plus:**

- Create new events (requires admin approval before appearing publicly)
- Access "My Events" page showing all personally created events
- Edit own events:
  - Update event details
  - Modify date/time
  - Change location information
  - Update pricing and restrictions
  - Add or remove genre tags
- Delete own events
- Upload CSV/Excel files for bulk event imports
- View status of own events:
  - Pending (awaiting approval)
  - Approved (visible to public)
  - Rejected (with ability to edit and resubmit)

### Restrictions
- **Cannot** edit events created by other organizers
- **Cannot** delete events created by others
- **Cannot** approve or reject events
- **Cannot** change event status
- **Cannot** view other organizers' unpublished events
- **Cannot** manage user accounts
- **Cannot** access admin dashboard
- **Cannot** manage genres or system settings

### Database Permissions (RLS Policies)
- All Public role permissions
- Create events (with organizer_id set to own user ID)
- Read own events (regardless of status)
- Update own events
- Delete own events
- Manage genres for own events
- Insert CSV import records

---

## Admin Role

**Assignment**: The first user to register in the system automatically receives the Admin role. Additional admins can only be promoted by existing admins.

### Capabilities
**All Organizer role capabilities, plus:**

- **Event Management**:
  - View ALL events regardless of status (pending, approved, rejected)
  - Approve pending events to make them publicly visible
  - Reject events with reason
  - Edit ANY event regardless of who created it
  - Delete ANY event
  - Mark events as featured
  - View events from all organizers on calendar

- **User Management**:
  - View all user accounts
  - Update user roles (promote/demote users)
  - Change user subscription tiers
  - Delete user accounts
  - View user activity and statistics

- **System Management**:
  - Access admin dashboard
  - Manage genre categories:
    - Create new genres
    - Edit existing genres
    - Delete unused genres
  - Review CSV imports:
    - View all import history
    - Approve or reject bulk imports
    - Monitor import processing status
  - View system analytics and reports

### Database Permissions (RLS Policies)
- Full access to all tables
- Can bypass status filters on events
- Read all user profiles
- Update any user profile
- Delete any user account
- Manage all events regardless of ownership
- Full control over genres
- Access to all CSV imports and processing

### Special Calendar Behavior
When an admin views the calendar:
- Sees ALL events (approved, pending, rejected) with visual status indicators
- This provides the same view as non-signed-in users PLUS admin-level events
- Can quickly approve/reject events directly from calendar view

---

## Role Hierarchy Summary

```
Admin (Highest Privilege)
  ├── Full system access
  ├── All Organizer permissions
  ├── View/manage all events (any status)
  ├── User management capabilities
  └── System configuration access

Organizer (Medium Privilege)
  ├── All Public permissions
  ├── Create and manage own events
  ├── Upload CSV files
  └── Access My Events dashboard

Public (Default Privilege)
  ├── View approved events
  ├── Filter and search
  ├── Save favorites
  └── Manage personal settings
```

---

## Security Implementation

### Row Level Security (RLS)
All tables have RLS enabled with specific policies for each role:

1. **users table**: Users can read/update own profile; admins can manage any user
2. **events table**: Public sees approved events; organizers see own events; admins see all
3. **genres table**: Anyone can view; only admins can modify
4. **user_favorites**: Users can only manage their own favorites
5. **user_preferences**: Users can only access their own preferences
6. **csv_imports**: Only admins have access

### Authentication
- All authenticated actions use Supabase Auth with JWT tokens
- Role checks happen at both application and database level
- Policies use `auth.uid()` to verify user identity
- Admin actions require role verification in RLS policies

---

## Important Notes

1. **First User Becomes Admin**: The very first user to register automatically receives admin privileges through a database trigger. This ensures there's always at least one admin.

2. **Self-Service Organizer Upgrade**: Users can upgrade themselves to Organizer status without admin approval. This is intentional to encourage event creation.

3. **Admin Promotion**: Only existing admins can promote other users to admin status. This must be done through the admin dashboard.

4. **Event Approval Workflow**:
   - Organizers create events → Status: Pending
   - Admins review and approve → Status: Approved (visible to public)
   - Admins can reject → Status: Rejected (organizer can edit and resubmit)

5. **Data Safety**: Users can only delete their own data. Admins have deletion capabilities but should use them carefully as deletions are permanent.

---

## Testing User Roles

To verify the hierarchy is working correctly:

1. **Test Public User**:
   - Register a new account
   - Verify can only see approved events
   - Verify cannot access My Events
   - Verify can upgrade to Organizer

2. **Test Organizer**:
   - Upgrade to Organizer role
   - Create a test event
   - Verify can only see/edit own events
   - Verify cannot access admin features

3. **Test Admin**:
   - Use first registered account or admin-promoted account
   - Verify can see ALL events (pending, approved, rejected)
   - Verify can approve/reject any event
   - Verify can access admin dashboard
   - Verify can manage users

---

## Future Considerations

- Role-based notification preferences
- Organizer verification/badge system
- Event approval delegation to trusted organizers
- Time-limited admin sessions for security
- Audit logs for admin actions
