# Entertainment Calendar SaaS Application

A professional SaaS calendar application for discovering and managing live entertainment events with AI-powered features, location-based filtering, and multiple calendar views.

## Features

### Public Features (No Login Required)
- **Browse Events**: View all approved entertainment events on an interactive calendar
- **Multiple Calendar Views**:
  - Week View - See events for the current week with detailed cards
  - Month View - Traditional calendar grid showing all events for the month
  - Rolling Month View - Scrollable list showing the next 60 days of events
- **Advanced Filtering**:
  - Filter by location (State, City, Zip Code)
  - Mileage-based radius search (5-200 miles)
  - Filter by genre (Boxing, MMA, Sports, Wrestling, Jazz, Kids Events, etc.)
  - Date range filtering
  - Price range filtering
  - Age restrictions
- **Geolocation Support**:
  - Use current location for "Near Me" searches
  - Manual location entry for travel planning
  - Distance calculation to events
- **Calendar Export**:
  - Export events to Apple Calendar, Google Calendar, Outlook
  - Download individual event .ics files
  - Add events to personal calendars with one click

### Event Organizer Features (Requires Account)
- **Event Management Dashboard**:
  - Create and submit new events
  - Edit existing events
  - View event approval status (Pending, Approved, Rejected)
  - Upload event images
  - Set event details (date, time, venue, price, age limit, dress code)
- **Multi-Category Support**: Tag events with multiple genres
- **Automatic Geocoding**: Addresses automatically converted to coordinates
- **Event Analytics**: Track event views and engagement

### Admin Features (Admin Role Only)
- **Event Approval Queue**:
  - Review all pending events
  - Approve or reject submitted events
  - Bulk approval actions
- **CSV Import System**:
  - Upload CSV or Excel files with event data
  - Automatic column mapping and data parsing
  - Batch import events organized by state and genre
  - AI-powered data validation and cleanup
- **Featured Events Management**: Promote special events

### Mega Menu Navigation
- Multi-level navigation with genre categories
- Hover effects with background transitions
- Featured events section
- Visual genre cards with color coding
- Smooth animations and transitions

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Tables
- **users**: User profiles with roles (public, organizer, admin)
- **events**: Main events table with full event details
- **genres**: Entertainment categories
- **event_genres**: Many-to-many relationship between events and genres
- **csv_imports**: Track CSV upload history
- **user_favorites**: User bookmarked events

### Security
- Row Level Security (RLS) enabled on all tables
- Public can read approved events
- Organizers can create and edit their own events
- Admins have full access to all data

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (provided)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## User Roles and Permissions

### Public (Default)
- View all approved events
- Use all filtering and search features
- Export events to calendar
- No authentication required

### Event Organizer
- All public features
- Create and manage own events
- Submit events for admin approval
- View event status and analytics

### Admin
- All organizer features
- Approve/reject pending events
- Import events via CSV upload
- Manage featured events
- Full system access

## CSV Import Format

For bulk event imports, CSV files should include these columns:
- title, event, or name - Event name
- description or details - Event description
- date or event_date - Event date (YYYY-MM-DD format)
- time or event_time - Event time (HH:MM format)
- venue or location - Venue name
- address - Street address
- city - City name
- state - State code (e.g., CA, NY)
- zip or zipcode - Zip code
- price or admission - Ticket price
- dress_code - Dress code requirement
- age_limit - Age restrictions
- phone - Contact phone number
- image - Image URL

## Location Features

### Geolocation Options
1. **Use Current Location**: Browser geolocation for automatic positioning
2. **Manual Entry**: Enter city, state, or zip code manually
3. **State Filter**: Browse all events in a specific state

### Distance Calculation
- Uses Haversine formula for accurate distance calculation
- Adjustable radius from 5 to 200 miles
- Shows distance to each event in search results

## Calendar Export

Events can be exported in iCalendar format (.ics) compatible with:
- Apple Calendar (iOS, macOS)
- Google Calendar
- Microsoft Outlook
- Any iCal-compatible application

## Future Enhancements

- AI-powered event recommendations based on user preferences
- Social sharing features
- Event reminder notifications
- Mobile app versions
- Real-time event updates
- User reviews and ratings
- Venue pages with all events at a location
- Interactive map view with markers
- Email newsletter for featured events

## Support

For issues or questions, contact your administrator.
