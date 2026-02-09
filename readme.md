# Dynamic Table Manager

A powerful web application that creates **actual PostgreSQL tables** in your Supabase database with custom columns. Unlike traditional apps that store data in JSON, this creates real database tables that you can query, edit, and manage directly.

## Features

- **Real Database Tables**: Creates actual PostgreSQL tables in Supabase (not JSON storage)
- **Dynamic Schema**: Define custom columns for each table
- **Full CRUD Operations**: Create, Read, Update, and Delete rows
- **Edit Functionality**: Modify any row after creation
- **Secure Configuration**: User-provided credentials (no hardcoded keys)
- **Direct Database Access**: Tables are real PostgreSQL tables you can access via SQL

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. A Supabase project
3. Two database functions configured (see Database Setup below)
4. Your Supabase project URL and anon key

## Database Setup

### Step 1: Create Required Functions

Go to your Supabase SQL Editor and run these two functions:

#### Function 1: `execute_sql` (Creates/Drops Tables)

```sql
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Function 2: `get_user_tables` (Lists All Tables)

```sql
CREATE OR REPLACE FUNCTION get_user_tables()
RETURNS TABLE(table_name text, columns jsonb) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    jsonb_agg(
      jsonb_build_object(
        'column_name', c.column_name,
        'data_type', c.data_type
      ) ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Why These Functions?

- **execute_sql**: Allows the app to run CREATE TABLE and DROP TABLE commands
- **get_user_tables**: Lists all your tables and their columns
- **SECURITY DEFINER**: Runs with elevated privileges (required for schema modifications)

## Installation

1. **Download the files**:
   - `index.html`
   - `style.css`
   - `script.js`

2. **Place all three files in the same directory**

3. **Open `index.html` in your web browser**

No build process or server required!

## Configuration

### First-Time Setup

1. Run the two SQL functions in Supabase (see Database Setup above)
2. Open the application in your browser
3. Click **⚙️ Settings**
4. Enter your Supabase credentials:
   - **Supabase URL**: Project Settings → API → Project URL
   - **Supabase Anon Key**: Project Settings → API → anon/public key
5. Click **Save & Connect**

Your credentials are stored locally in your browser's localStorage.

## Usage

### Creating a New Table

1. Click **Create New Table**
2. Enter a table name (e.g., `countries_visited`, `workaway_projects`)
   - Use lowercase letters, numbers, and underscores only
   - Must start with a letter
3. Add column names (e.g., `country`, `city`, `date`)
   - Same naming rules as table name
4. Click **Create Table**

This will create a **real PostgreSQL table** in your Supabase database with:
- An auto-incrementing `id` column (primary key)
- Your custom columns (all TEXT type)
- A `created_at` timestamp column

### Adding Rows

1. Fill in any or all column fields
2. Click **Add Row** or press **Enter**
3. The row appears in the table below

### Editing a Row

1. Click **Edit** on any row
2. Modify the values
3. Click **Save Changes**

### Deleting a Row

1. Click **Delete** on any row
2. Confirm deletion

### Deleting a Table

1. Click **Delete Table**
2. Confirm deletion
3. **Warning**: This permanently drops the entire table and all data!

## How It Works

### Traditional List Apps vs This App

**Traditional Approach** (what you had before):
```
Database:
  - lists table (stores list metadata)
  - list_items table (stores all data in JSON column)
  
Structure:
  lists: { id, name, columns: ["country", "city"] }
  list_items: { id, list_id, data: {"country": "France", "city": "Paris"} }
```

**This App** (real tables):
```
Database:
  - countries_visited table (real columns)
  - workaway_projects table (real columns)
  - flights table (real columns)
  
Structure:
  countries_visited: { id, country, city, date, created_at }
  workaway_projects: { id, host, location, rating, created_at }
```

### Advantages

- **Better Performance**: Real columns are faster than JSON queries
- **SQL Access**: You can query your tables directly in Supabase SQL Editor
- **Type Safety**: Each column can have its own data type (currently TEXT)
- **Indexes**: You can add indexes to specific columns
- **Relations**: You can create foreign keys between your tables
- **Standard SQL**: Works with any PostgreSQL tool or library

## File Structure

```
dynamic-table-manager/
├── index.html      # Main HTML structure and modals
├── style.css       # All styling and responsive design
└── script.js       # Application logic and Supabase integration
```

## Technology Stack

- **Frontend**: Pure HTML, CSS, and JavaScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: LocalStorage for configuration
- **CDN**: Supabase JS Client v2

## Security Notes

- **No Hardcoded Credentials**: All credentials are user-provided
- **Local Storage**: Credentials stored only in your browser
- **SECURITY DEFINER**: Required for schema modifications - be careful who has access
- **Anon Key**: Uses public anon key (safe for client-side)
- **Single User**: Best for personal use or trusted users only

⚠️ **Important**: The `execute_sql` function with SECURITY DEFINER allows running arbitrary SQL. Only use this for personal projects or trusted environments.

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

### "Please set up the database function"

**Solution**: Run the two SQL functions in your Supabase SQL Editor (see Database Setup)

### "function execute_sql does not exist"

**Solution**: Create the `execute_sql` function in Supabase

### Table name errors

**Solution**: Use only lowercase letters, numbers, and underscores. Start with a letter.

### Settings Not Saving

**Solution**: Ensure your browser allows localStorage and isn't in private/incognbito mode

## Examples of Use Cases

- **Travel Log**: `countries_visited` with columns: country, city, date, notes
- **Workaway Projects**: `workaway_projects` with columns: host, location, start_date, end_date, rating
- **Flight Log**: `flights` with columns: flight_number, from, to, date, aircraft
- **Book Library**: `books` with columns: title, author, year, rating, status
- **Inventory**: `inventory` with columns: item, quantity, location, price
- **Contacts**: `contacts` with columns: name, email, phone, company

## Direct Database Access

Because this creates real tables, you can:

1. **Query in Supabase SQL Editor**:
   ```sql
   SELECT * FROM countries_visited WHERE country = 'France';
   ```

2. **Add Indexes**:
   ```sql
   CREATE INDEX idx_country ON countries_visited(country);
   ```

3. **Change Column Types**:
   ```sql
   ALTER TABLE flights ALTER COLUMN date TYPE DATE USING date::DATE;
   ```

4. **Add Constraints**:
   ```sql
   ALTER TABLE inventory ADD CONSTRAINT positive_quantity CHECK (quantity::int > 0);
   ```

## Future Enhancements

Potential features to add:
- Column type selection (TEXT, INTEGER, DATE, etc.)
- Column constraints (NOT NULL, UNIQUE, etc.)
- Foreign key relationships
- Export to CSV
- Search and filtering
- Sorting columns
- Pagination for large tables

## License

This project is provided as-is for personal and commercial use.

## Support

For issues related to:
- **This application**: Check browser console for errors
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL**: Visit [postgresql.org/docs](https://www.postgresql.org/docs/)

## Contributing

Feel free to fork and modify this project!

## Changelog

### Version 3.0
- Complete rewrite to create real PostgreSQL tables
- Dynamic table creation with custom columns
- Direct database table management
- Real SQL table operations (CREATE, DROP)

### Version 2.0
- Table-based system with JSON storage

### Version 1.0
- Initial list-based system
