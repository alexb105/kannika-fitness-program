# Supabase Setup Guide

## 1. Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_PASSWORD=your_app_password_here
```

You can find the Supabase values in your Supabase project dashboard under Settings > API.

The `NEXT_PUBLIC_APP_PASSWORD` is used to protect the entire application. Users will need to enter this password to access the app.

## 2. Database Setup

Run the SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script

This will create:
- `trainers` table - stores trainer information (Alexander and Kannika)
- `days` table - stores workout/rest day plans for each trainer
  - Includes `archived` field to track archived days
- Indexes for better query performance
- Triggers for automatic timestamp updates

## 3. Row Level Security (RLS)

For a public app, you may want to enable RLS policies. Here are some example policies:

```sql
-- Enable RLS on trainers table
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trainers
CREATE POLICY "Anyone can read trainers" ON trainers
  FOR SELECT USING (true);

-- Allow anyone to insert trainers (for initial setup)
CREATE POLICY "Anyone can insert trainers" ON trainers
  FOR INSERT WITH CHECK (true);

-- Enable RLS on days table
ALTER TABLE days ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read days
CREATE POLICY "Anyone can read days" ON days
  FOR SELECT USING (true);

-- Allow anyone to insert/update days
CREATE POLICY "Anyone can insert days" ON days
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update days" ON days
  FOR UPDATE USING (true);
```

## 4. Archiving System

The app automatically archives days when more than 7 active days exist:
- When a new day is added and there are already 7 active days, the oldest day is automatically archived
- Each trainer has their own separate archive (archived days are filtered by `trainer_id`)
- Archived days are not shown in the main schedule view
- Competition stats only count non-archived completed workouts
- The archiving happens automatically when adding the 8th day

## 5. Testing

After setup, the app should:
- Automatically create trainers if they don't exist
- Create initial 7 days for each trainer
- Sync all changes to Supabase in real-time
- Update competition stats automatically
- Automatically archive the oldest day when adding an 8th day (each trainer maintains max 7 active days)

