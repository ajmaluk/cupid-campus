# CETea

The exclusive dating platform for CET students.

## Deployment on Vercel

This project is configured for easy deployment on [Vercel](https://vercel.com).

### Steps to Deploy:
1.  Push this repository to GitHub/GitLab/Bitbucket.
2.  Import the project in Vercel.
3.  Vercel will automatically detect it as a **Vite** project.
4.  **Environment Variables**: Add your Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
5.  Click **Deploy**.

### Backend Note
The project uses a stateless OTP verification mechanism (HMAC-based), so it **is compatible** with Vercel Serverless Functions. No separate backend hosting is required.

### Required Environment Variables
Add these to your Vercel Project Settings:

- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `VITE_CLOUDINARY_CLOUD_NAME`: Cloudinary Cloud Name (for image uploads)
- `VITE_CLOUDINARY_UPLOAD_PRESET`: Cloudinary Upload Preset
- `SMTP_EMAIL`: Gmail address for sending OTPs
- `SMTP_PASSWORD`: Gmail App Password (not your login password)
- `FRONTEND_URL`: Production URL (e.g., https://your-app.vercel.app) - Optional, defaults to Vercel deployment URL

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the frontend:
    ```bash
    npm run dev
    ```
3.  Start the backend (for OTPs):
    ```bash
    npm run server
    ```

## Database Reset (Dev)

To completely reset the database (delete all data but keep tables), run the following SQL commands in the Supabase SQL Editor.

**Warning: This action is irreversible.**

```sql
-- 1. Delete dependent application data first
-- Using IF EXISTS or simply ignoring errors if tables don't exist is safer,
-- but standard DELETE throws error if table is missing.
-- If you get an error "relation does not exist", you can skip that line.

DELETE FROM public.messages;
DELETE FROM public.matches;
DELETE FROM public.swipes;
DELETE FROM public.admin_recommendations;
DELETE FROM public.reports;
DELETE FROM public.bans;

-- 2. Delete main profile data
DELETE FROM public.profiles;

-- 3. Delete admin roles (Skip if table "public.admins" does not exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    DELETE FROM public.admins;
  END IF;
END $$;

-- 4. (Optional) Delete all authenticated users
-- WARNING: This deletes the actual login accounts. Users will need to sign up again.
DELETE FROM auth.users;
```
