# Dynamic Lists Manager

A flexible web application for creating and managing custom lists with dynamic columns. Perfect for tracking countries visited, workaway projects, flights, tasks, or any structured data you need to organize.

## Features

- **Dynamic List Creation**: Create unlimited lists with custom column structures
- **Flexible Data Entry**: Add items to your lists with any combination of column values
- **Secure Configuration**: Each user configures their own Supabase credentials (no hardcoded keys)
- **Persistent Storage**: Data stored in Supabase with automatic syncing
- **Clean Interface**: Simple, intuitive UI with modal-based interactions
- **Real-time Updates**: Instant list updates when adding or deleting items
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

Before using this application, you need:

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. A Supabase project with two tables configured (see Database Setup below)
3. Your Supabase project URL and anon key

## Database Setup

In your Supabase project, create the following two tables:

### Table 1: `lists`

```sql
CREATE TABLE lists (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  columns JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Table 2: `list_items`

```sql
CREATE TABLE list_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  list_id BIGINT REFERENCES lists(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Enable Row Level Security (Optional but Recommended)

For multi-user scenarios, enable RLS policies:

```sql
-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON lists
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON list_items
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

### Creating a New List

1. Click **Create New List**
2. Enter a name for your list (e.g., "Countries Visited")
3. Add column names (e.g., "country", "city", "date")
4. Click **Add Another Column** to add more columns
5. Click **Create List**

### Adding Items to a List

1. Fill in any or all of the input fields for your columns
2. Click **Add** or press **Enter**
3. The item appears in the list below

### Deleting a List

1. Click the **Delete List** button on any list
2. Confirm the deletion
3. The list and all its items are permanently removed

## File Structure

```
dynamic-lists-manager/
├── index.html      # Main HTML structure and modals
├── style.css       # All styling and responsive design
└── script.js       # Application logic and Supabase integration
```

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Database**: Supabase (PostgreSQL)
- **Storage**: LocalStorage for configuration
- **CDN**: Supabase JS Client v2

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

### "Error loading lists"

**Solutions**:
- Check that both database tables exist in Supabase
- Verify RLS policies allow access
- Check browser console for detailed error messages

### Settings Not Saving

**Solution**: Ensure your browser allows localStorage and isn't in private/incognito mode

## Examples of Use Cases

- **Travel Tracking**: Countries visited with dates and cities
- **Workaway Projects**: Host, location, dates, and notes
- **Flight Log**: Flight number, route, date, aircraft type
- **Book Library**: Title, author, year, rating
- **Project Management**: Project name, status, deadline, team
- **Recipe Collection**: Recipe name, cuisine, difficulty, time
- **Expense Tracking**: Item, category, amount, date

## Customization

### Modifying Styles

Edit `style.css` to customize colors, fonts, spacing, and layout.

### Adding Features

The modular structure makes it easy to add features like:
- Item editing
- Export to CSV
- Search and filtering
- Item sorting
- Column type validation
- Date pickers
- Multi-user collaboration

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

### Version 1.0
- Initial release
- Dynamic list creation
- Supabase integration
- User-configurable credentials
- CRUD operations for lists and items
