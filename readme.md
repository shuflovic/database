# Dynamic Table Manager

A flexible web application for creating and managing custom tables with editable rows and columns. Perfect for tracking countries visited, workaway projects, flights, tasks, or any structured data you need to organize.

## Features

- **Dynamic Table Creation**: Create unlimited tables with custom column structures
- **Full CRUD Operations**: Create, Read, Update, and Delete rows in your tables
- **Inline Editing**: Edit any row with a simple modal interface
- **Secure Configuration**: Each user configures their own Supabase credentials (no hardcoded keys)
- **Persistent Storage**: Data stored in Supabase with automatic syncing
- **Table View**: See all your data in a clean, organized table format
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

Before using this application, you need:

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. A Supabase project with two tables configured (see Database Setup below)
3. Your Supabase project URL and anon key

## Database Setup

In your Supabase project, create the following two tables:

### Table 1: `tables`

```sql
CREATE TABLE tables (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  columns JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Table 2: `table_rows`

```sql
CREATE TABLE table_rows (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_id BIGINT REFERENCES tables(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Enable Row Level Security (Optional but Recommended)

For multi-user scenarios, enable RLS policies:

```sql
-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_rows ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON tables
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON table_rows
  FOR ALL USING (auth.role() = 'authenticated');
```

## Installation

1. **Download the files**:
   - `index.html`
   - `style.css`
   - `script.js`

2. **Place all three files in the same directory**

3. **Open `index.html` in your web browser**

That's it! No build process or server required.

## Configuration

### First-Time Setup

1. Open the application in your browser
2. Click the **⚙️ Settings** button
3. Enter your Supabase credentials:
   - **Supabase URL**: Found in Project Settings → API → Project URL
   - **Supabase Anon Key**: Found in Project Settings → API → Project API keys → anon/public

4. Click **Save & Connect**

Your credentials are stored locally in your browser's localStorage and never leave your device.

### Finding Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in the sidebar)
3. Navigate to **API** section
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)

## Usage

### Creating a New Table

1. Click **Create New Table**
2. Enter a name for your table (e.g., "countries_visited", "workaway_projects")
3. Add column names (e.g., "country", "city", "date")
4. Click **Add Another Column** to add more columns
5. Click **Create Table**

### Adding Rows to a Table

1. Fill in any or all of the input fields for your columns
2. Click **Add Row** or press **Enter**
3. The row appears in the table below

### Editing a Row

1. Click the **Edit** button on any row
2. Modify the values in the modal
3. Click **Save Changes**
4. The row is updated in the table

### Deleting a Row

1. Click the **Delete** button on any row
2. Confirm the deletion
3. The row is permanently removed

### Deleting a Table

1. Click the **Delete Table** button on any table
2. Confirm the deletion
3. The table and all its rows are permanently removed

## File Structure

```
dynamic-table-manager/
├── index.html      # Main HTML structure and modals
├── style.css       # All styling and responsive design
└── script.js       # Application logic and Supabase integration
```

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Database**: Supabase (PostgreSQL)
- **Storage**: LocalStorage for configuration
- **CDN**: Supabase JS Client v2

## Key Differences from List Manager

This table-based system differs from a traditional list manager:

- **Editable Rows**: Every row can be edited after creation
- **Table Format**: Data displayed in clean, organized tables with columns and rows
- **Action Buttons**: Each row has Edit and Delete buttons for easy management
- **Better for Structured Data**: Perfect when you need to maintain and update records over time

## Security Notes

- **No Hardcoded Credentials**: All credentials are user-provided
- **Local Storage**: Credentials stored only in your browser
- **HTTPS Required**: Supabase URLs use secure HTTPS connections
- **Anon Key**: Uses the public anon key (safe for client-side use)
- **RLS**: Enable Row Level Security for production use

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- LocalStorage API
- CSS Grid and Flexbox
- Async/Await

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Common Issues

### "Not Connected" Status

**Solution**: Click Settings and verify your Supabase URL and key are correct

### "Error loading tables"

**Solutions**:
- Check that both database tables exist in Supabase
- Verify table names are exactly `tables` and `table_rows`
- Verify RLS policies allow access
- Check browser console for detailed error messages

### Settings Not Saving

**Solution**: Ensure your browser allows localStorage and isn't in private/incognito mode

## Examples of Use Cases

- **Travel Tracking**: Countries visited with dates, cities, and notes (with ability to update dates/cities)
- **Workaway Projects**: Host, location, dates, ratings (update status as projects progress)
- **Flight Log**: Flight number, route, date, aircraft type (edit if details change)
- **Book Library**: Title, author, year, rating (update ratings after reading)
- **Project Management**: Project name, status, deadline, team (edit status and deadlines)
- **Inventory Management**: Item name, quantity, location, price (update quantities)
- **Contact List**: Name, email, phone, company (keep contact details current)

## Customization

### Modifying Styles

Edit `style.css` to customize colors, fonts, spacing, and layout.

### Adding Features

The modular structure makes it easy to add features like:
- Sorting columns
- Search and filtering
- Export to CSV/Excel
- Column type validation
- Date pickers
- Inline editing (edit directly in table)
- Bulk operations
- Row reordering

## License

This project is provided as-is for personal and commercial use.

## Support

For issues related to:
- **This application**: Check the code comments and console logs
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **Database setup**: See the Database Setup section above

## Contributing

Feel free to fork and modify this project for your needs!

## Changelog

### Version 2.0
- Complete rewrite to table-based system
- Added edit functionality for rows
- Added proper table display with columns
- Improved data organization
- Better visual hierarchy

### Version 1.0
- Initial release (list-based system)
