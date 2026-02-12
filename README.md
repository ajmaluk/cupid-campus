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
The project includes a `server.js` file for OTP verification (sending emails).
**Note:** Vercel is primarily for frontend and serverless functions. The `server.js` uses an in-memory store for OTPs, which **will not work** on Vercel Serverless Functions (as they are stateless).

To make the OTP feature work in production, you have two options:
1.  **Deploy the backend separately**: Host `server.js` on a platform like Render, Heroku, or Railway, and update `VITE_API_URL` (if applicable) or hardcode the backend URL in the frontend.
2.  **Refactor for Serverless**: Rewrite the logic to use a database (like Supabase) for storing OTPs instead of in-memory Map, and move the logic to Vercel Functions (`api/` directory).

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

SQL commands to reset auth users:

- Hard delete all auth users and cascade to dependent auth tables:
```sql
truncate table auth.users cascade;
```
- Alternative hard delete without truncate:
```sql
delete from auth.users;
```
