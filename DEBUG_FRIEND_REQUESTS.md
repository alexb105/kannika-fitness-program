# Debugging Friend Request 403 Errors

## The Problem
You're getting 403 errors when accepting friend requests, even though the RLS policy exists.

## Quick Check in Browser Console

Open your browser console (F12) and run this to see your actual user ID:

```javascript
// Check your user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('Your User ID:', user?.id);

// Check pending friend requests
const { data: requests, error } = await supabase
  .from('friend_requests')
  .select('id, sender_id, receiver_id, status')
  .eq('status', 'pending');

console.log('Pending Requests:', requests);
console.log('Your ID matches receiver?', requests?.some(r => r.receiver_id === user?.id));
```

## Common Issues

### 1. User ID Mismatch
**Symptom:** Your user ID from the app doesn't match the `receiver_id` in the database.

**Check:**
- Run the browser console code above
- Compare your `user.id` with the `receiver_id` in the friend request
- If they don't match, the request was sent to a different user

**Fix:** Make sure you're logged in as the correct user, or have the sender send the request to your correct user ID.

### 2. Session Not Being Passed
**Symptom:** Supabase client isn't using your authenticated session.

**Check:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session exists?', !!session);
console.log('User ID from session:', session?.user?.id);
```

**Fix:** If session is null, you need to sign in again.

### 3. Policy Still Too Restrictive
**Symptom:** Policy exists but still blocking.

**Check in Supabase SQL Editor:**
```sql
-- Check the exact policy definition
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'friend_requests' 
  AND policyname = 'Users can update received requests';
```

**Fix:** Run `supabase/fix_friend_requests_policy_simple.sql` again to ensure the policy is correct.

### 4. Multiple Conflicting Policies
**Symptom:** Multiple UPDATE policies might be conflicting.

**Check:**
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'friend_requests' 
  AND cmd = 'UPDATE';
```

**Fix:** Should only be one UPDATE policy. Drop any duplicates.

## Step-by-Step Debugging

1. **Check your user ID in the app:**
   - Open browser console
   - Run: `(await supabase.auth.getUser()).data.user.id`
   - Note this ID

2. **Check the friend request:**
   - In Supabase SQL Editor, run:
   ```sql
   SELECT id, sender_id, receiver_id, status 
   FROM friend_requests 
   WHERE status = 'pending';
   ```

3. **Compare IDs:**
   - Your user ID from step 1 should match `receiver_id` from step 2
   - If they don't match, that's the problem!

4. **Test the update manually:**
   - In browser console, try:
   ```javascript
   const requestId = 'YOUR_REQUEST_ID_HERE';
   const { data, error } = await supabase
     .from('friend_requests')
     .update({ status: 'accepted' })
     .eq('id', requestId)
     .eq('receiver_id', user.id)
     .eq('status', 'pending');
   
   console.log('Result:', { data, error });
   ```

5. **Check error details:**
   - If error occurs, check `error.message`, `error.code`, `error.details`, `error.hint`
   - These will tell you exactly why RLS is blocking

## Most Likely Issue

Based on the diagnostic showing "You are not involved in this request", the most likely issue is:

**Your user ID in the app doesn't match the `receiver_id` in the friend request.**

This could happen if:
- You're logged in as a different user than expected
- The friend request was sent to a different user ID
- There's a mismatch between the user ID in your session and the database

**Solution:** Verify your user ID matches the receiver_id, or have the sender create a new friend request to your correct user ID.

