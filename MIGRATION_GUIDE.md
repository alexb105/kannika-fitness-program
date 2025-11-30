# Migration Guide: Converting to Single Account Design

This guide explains the changes made to convert the app from a shared/joint design to a single account design where each user has their own login and sees their own stats.

## Overview

The app has been converted from a trainer-based system (where "alexander" and "kannika" were hardcoded trainers) to a user-based authentication system where each user has their own account and data.

## Changes Made

### 1. Database Schema Migration

A new migration file has been created: `supabase/migration_to_user_auth.sql`

**Key Changes:**
- Added `user_id` columns to `days` and `weight_entries` tables
- Updated unique constraints to use `user_id` instead of `trainer_id`
- Updated indexes to use `user_id`
- Created new RLS (Row Level Security) policies that restrict access to user's own data
- Removed foreign key constraints on `trainer_id`

**Important Notes:**
- The migration keeps `trainer_id` columns for backward compatibility
- For new installations, you can make `user_id` NOT NULL and drop `trainer_id` columns after running the migration
- For existing data, you'll need to manually link `trainer_id` to `user_id` if you want to preserve existing data

### 2. Authentication System

**New Files:**
- `lib/contexts/auth-context.tsx` - Authentication context provider
- `app/login/page.tsx` - Login/signup page

**Updated Files:**
- `lib/supabase.ts` - Updated to handle auth sessions properly
- `components/app-wrapper.tsx` - Replaced password gate with auth guard

**Features:**
- Email/password authentication via Supabase Auth
- Sign up and sign in functionality
- Automatic session management
- Protected routes (redirects to login if not authenticated)

### 3. Hooks Updated

**New Hooks:**
- `lib/hooks/use-user-days.ts` - Replaces `use-trainer-days.ts`
- `lib/hooks/use-user-weight.ts` - Replaces `use-trainer-weight.ts`
- `lib/hooks/use-archived-days.ts` - Updated to use user ID

**Changes:**
- All hooks now use `useAuth()` to get the authenticated user's ID
- Removed trainer name/ID parameters
- Data is automatically scoped to the logged-in user

### 4. UI Components Updated

**New Components:**
- `components/user-schedule.tsx` - Single user schedule view

**Updated Components:**
- `app/page.tsx` - Removed trainer tabs and competition view
- `app/weight/page.tsx` - Removed trainer tabs
- `components/archive-modal.tsx` - Removed trainer-specific props
- `components/weight-tracker.tsx` - Removed trainer-specific props
- `components/workout-modal.tsx` - Uses user ID for custom exercises

**Removed Features:**
- Trainer selection tabs
- Competition stats between trainers
- Dual progress bars

### 5. Translations

Added new translation keys:
- `fitnessSchedule` - "Elite Fitness" / "Elite Fitness"
- `mySchedule` - "My Schedule" / "ตารางของฉัน"

## Setup Instructions

### 1. Run Database Migration

Execute the migration SQL file in your Supabase dashboard:

```sql
-- Run: supabase/migration_to_user_auth.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### 2. Enable Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Email provider (should be enabled by default)
4. Configure email templates if needed

### 3. Environment Variables

Ensure you have the following environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Test the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Navigate to the app - you should be redirected to `/login`
3. Create a new account or sign in
4. Verify that:
   - You can see only your own schedule
   - You can add/edit workouts
   - You can track weight
   - Data is isolated to your account

## Migration for Existing Data

If you have existing data with `trainer_id`, you'll need to:

1. Create user accounts for each trainer (or let users create their own)
2. Manually link existing data:
   ```sql
   -- Example: Link alexander trainer to a user
   UPDATE days 
   SET user_id = 'user-uuid-here'
   WHERE trainer_id = (SELECT id FROM trainers WHERE name = 'alexander');
   
   UPDATE weight_entries 
   SET user_id = 'user-uuid-here'
   WHERE trainer_id = (SELECT id FROM trainers WHERE name = 'alexander');
   ```

3. Once all data is migrated, you can:
   - Make `user_id` NOT NULL
   - Drop `trainer_id` columns
   - Drop the `trainers` table (if no longer needed)

## Breaking Changes

1. **No more password gate** - Users must create accounts and sign in
2. **No trainer selection** - Each user sees only their own data
3. **No competition view** - Removed dual progress bars and stats comparison
4. **Database schema** - Requires migration before use

## Rollback

If you need to rollback:

1. Restore the previous database schema
2. Revert code changes using git
3. The old password gate system will work again

## Support

If you encounter issues:
1. Check Supabase logs for authentication errors
2. Verify RLS policies are correctly set
3. Ensure environment variables are properly configured
4. Check browser console for client-side errors

