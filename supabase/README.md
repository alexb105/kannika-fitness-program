# Supabase Database Setup

## Quick Start

To rebuild the entire database from scratch, run:

**`complete_schema.sql`**

This single file contains everything you need:
- All tables (days, weight_entries, profiles, friends, friend_requests)
- All indexes for performance
- All triggers and functions
- All Row Level Security (RLS) policies
- All constraints and validations

## How to Use

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `complete_schema.sql`
4. Paste and run it
5. Done! Your database is ready

## What's Included

The schema creates a complete user-based fitness tracking system with:
- User authentication via Supabase Auth
- Workout schedule management
- Weight tracking
- Username system
- Friend requests and friendships
- All security policies configured correctly

## Other Files

All other SQL files in this directory are:
- **Migration files** - For updating existing databases (not needed for fresh installs)
- **Fix files** - For troubleshooting specific issues (not needed if using complete_schema.sql)
- **Diagnostic files** - For debugging (optional, can be deleted)

You can safely delete all files except `complete_schema.sql` if you're starting fresh.

