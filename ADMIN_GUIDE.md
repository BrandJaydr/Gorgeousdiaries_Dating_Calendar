# Admin Guide - Entertainment Calendar

## Your Administrator Access

You now have full administrator privileges with the following capabilities:

### Admin Dashboard Tabs

#### 1. Pending Events
- **Review Queue**: See all events submitted by organizers waiting for approval
- **Approve/Reject**: Quick actions to approve or reject events
- **Visual Preview**: View full event details including images, dates, locations before approving
- **Bulk Management**: Manage multiple events efficiently

#### 2. CSV Import
- **Bulk Upload**: Import multiple events at once using CSV files
- **Flexible Format**: Automatic column mapping handles various CSV formats
- **Expected Columns**:
  - title, event, or name → Event name
  - description or details → Event description
  - date or event_date → Date (YYYY-MM-DD)
  - time or event_time → Time (HH:MM)
  - venue or location → Venue name
  - address → Street address
  - city, state, zip → Location details
  - price, dress_code, age_limit, phone, image → Optional details
- **Auto-Pending**: All imported events start in pending status for your review

#### 3. User Management (NEW!)
- **View All Users**: See complete user list with activity stats
- **Edit Roles**: Change user roles between:
  - **Public**: Can only view events (default)
  - **Organizer**: Can create and manage their own events
  - **Admin**: Full system access (like you!)
- **Manage Subscriptions**: Update subscription tiers:
  - **Free**: Basic access
  - **Organizer**: Event creation privileges
  - **Premium**: All features unlocked
- **Activity Stats**: See how many events each user has created and favorited
- **Quick Edit**: Click edit icon, change role/tier, and save instantly

### Admin Privileges

As an admin, you can:
- ✅ Approve or reject any pending event
- ✅ View, edit, and delete any event in the system
- ✅ Import events via CSV in bulk
- ✅ Manage user roles and subscription levels
- ✅ Feature events to highlight them on the calendar
- ✅ Access all organizer features
- ✅ View system-wide analytics and user activity

### Quick Actions

**To approve an event:**
1. Navigate to Admin → Pending Events tab
2. Review the event details
3. Click the green "Approve" button

**To import events from CSV:**
1. Navigate to Admin → CSV Import tab
2. Click to upload your CSV file
3. Review the format guidelines
4. Click "Import Events"
5. Check Pending Events tab to approve imported items

**To manage a user:**
1. Navigate to Admin → User Management tab
2. Find the user in the list
3. Click the edit icon (pencil)
4. Select new role and subscription tier
5. Click the checkmark to save

### Security Features

- **Row Level Security**: Database enforces admin-only access to sensitive operations
- **First User Admin**: The first registered user automatically becomes admin
- **Audit Trail**: All user changes are timestamped
- **Role Validation**: System prevents invalid role assignments

### Best Practices

1. **Review Before Approving**: Check event details for accuracy and appropriateness
2. **Verify Locations**: Ensure addresses are complete for proper geocoding
3. **Image Quality**: Confirm event images are appropriate and load correctly
4. **User Roles**: Only grant organizer/admin roles to trusted users
5. **Featured Events**: Use sparingly to maintain impact
6. **CSV Imports**: Review a sample of imported events before bulk approval

### Managing Featured Events

Featured events appear prominently in:
- The mega menu's featured section
- Top of calendar views
- Search results priority

To feature an event:
1. Edit the event (as organizer or admin)
2. Check the "featured" option
3. Save changes

### User Role Definitions

**Public Users:**
- View all approved events
- Use filters and search
- Export to calendar
- No login required for viewing

**Event Organizers:**
- All public features
- Create and submit events
- Edit their own events
- View submission status
- Access organizer dashboard

**Administrators:**
- All organizer features
- Approve/reject any event
- Manage all users
- CSV bulk imports
- System-wide access
- Feature events

### System Statistics

View key metrics in the User Management tab:
- Total registered users
- Event creation activity
- User engagement (favorites)
- Role distribution
- Account creation dates

### Support & Troubleshooting

**If an event won't approve:**
- Check that required fields are filled (title, date, city, state, address)
- Verify date format is YYYY-MM-DD
- Ensure state code is valid (e.g., CA, NY, TX)

**If CSV import fails:**
- Verify file is .csv format
- Check that columns are comma-separated
- Ensure at least title, date, city, and state are present
- Review example format in the import interface

**If a user can't create events:**
- Verify their role is set to "organizer" or "admin"
- Check their subscription tier allows event creation
- Confirm they're logged in

### Next Steps for Development

Consider adding:
- Email notifications to organizers on event approval/rejection
- Automated CSV imports on a schedule (bi-weekly as planned)
- Analytics dashboard showing popular events and trends
- Bulk approval/rejection for CSV imports
- Event moderation comments/feedback system
- User suspension/ban capabilities
- Event duplication detection
- Image upload (currently URL-based)
