# Quick Setup Guide - Elite Fitness

## Database Setup (REQUIRED)

**You must run the database migration before the app will work!**

## 🔴 Getting 403 Errors When Accepting Friend Requests?

**Quick Fix:** Run `supabase/migration_fix_friend_requests_rls.sql` in Supabase SQL Editor

This will create the missing RLS UPDATE policy that allows users to accept/decline friend requests.

**To check if policies exist:** Run `supabase/check_rls_policies.sql` first to see what's missing.

---

### Step 1: Run the Complete Schema

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the **entire contents** of `supabase/complete_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- ✅ `days` table with `user_id` column
- ✅ `weight_entries` table with `user_id` column  
- ✅ `profiles` table for usernames
- ✅ `friends` table for friend relationships
- ✅ `friend_requests` table for friend requests
- ✅ All indexes and triggers
- ✅ Row Level Security (RLS) policies

### Step 2: Verify Migration Success

After running the schema, you should see success messages like:
- ✓ days table created successfully
- ✓ weight_entries table created successfully
- ✓ profiles table created successfully
- ✓ friends table created successfully
- ✓ friend_requests table created successfully
- ✓ RLS enabled on all tables

### Step 3: Test the App

1. Refresh your browser
2. Sign up or sign in
3. Create a username when prompted
4. The app should now work!

## Common Errors

### "Error fetching days: {}" or RLS Permission Error
**Solution:** Run `supabase/complete_schema.sql` in Supabase SQL Editor

### "column user_id does not exist"
**Solution:** Run `supabase/complete_schema.sql` in Supabase SQL Editor

### "friend_requests table does not exist"
**Solution:** Run `supabase/complete_schema.sql` (includes friend_requests table)

## Environment Variables

Make sure you have these in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Need Help?

If you're still getting errors after running the migration:
1. Check the Supabase SQL Editor for any error messages
2. Verify all tables were created (go to Table Editor in Supabase)
3. Check that RLS is enabled on all tables
4. Make sure you're signed in to the app

