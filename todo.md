Issue 2 — Sale type uses number for sale_id but Supabase returns a string UUID now
The Sale interface in src/types/sales.ts has sale_id: number but sales.sql now defines it as BIGSERIAL, so this is actually fine. However student_id?: number in the Sale type will conflict with the UUID in Supabase. Worth flagging.

Supabase Side

Enable Google provider -- go to your Supabase dashboard, Authentication > Providers > Google. Toggle it on. You'll see two fields: Client ID and Client Secret. Leave this tab open, you'll come back to paste values here.
Add your redirect URL -- in that same Google provider section, Supabase shows you a "Callback URL" (looks like https://your-project-ref.supabase.co/auth/v1/callback). Copy this -- you'll need it in Google Cloud.
Set your site URL -- Authentication > URL Configuration. Set "Site URL" to your production domain (e.g. https://yourapp.com). Under "Redirect URLs", add both your prod URL and local dev URL:

https://yourapp.com/auth/callback
http://localhost:5173/auth/callback (or whatever port you run locally)

Google Cloud Side

Create a project -- go to console.cloud.google.com, create a new project (or use an existing one).
Enable the Google Identity API -- in your project, go to APIs & Services > Enable APIs, search for "Google Identity" or "OAuth" and enable it.
Configure the consent screen -- APIs & Services > OAuth consent screen. Choose "External", fill in your app name, support email, and developer email. You can leave scopes as default (email and profile are enough). Save and continue through all steps.
Create OAuth credentials -- APIs & Services > Credentials > Create Credentials > OAuth Client ID. Choose "Web application". Then:

Under Authorized JavaScript origins, add:

https://yourapp.com
http://localhost:5173

Under Authorized redirect URIs, add the Supabase callback URL you copied in step 2:

https://your-project-ref.supabase.co/auth/v1/callback

Copy your credentials -- after creating, Google shows you a Client ID and Client Secret. Go back to Supabase (step 1) and paste them in.

Verification

Test locally first -- run your app, click "Continue with Google", complete the OAuth flow, and confirm you land on /auth/callback and get redirected to /dashboard.
Before going to production, go back to the Google consent screen and publish the app (move it out of "Testing" mode), otherwise only test users you've manually added can sign in.

Add both URLs to the Google OAuth consent screen -- in Google Cloud, when you're filling out the consent screen, there are explicit fields for "Privacy Policy URL" and "Terms of Service URL". Paste in your production URLs there (e.g. https://taekwontrack.com/privacy and https://taekwontrack.com/terms). Google will reject or limit your OAuth app if these are missing or point to placeholder pages.

Implementation plan, broken into phases:
Phase 1 — Test infrastructure + critical unit tests (no external dependencies, immediate value)

Vitest + RTL setup
Tests for all pure utility functions
Tests for StudentRenewalContext grouping logic
Tests for form validation

Phase 2 — PostHog analytics + Sentry error tracking

PostHog event tracking on key user actions
Sentry with Vite sourcemap plugin
Custom PostHog events for: login, attendance saved, renewal created, student promoted, belt rank created, inventory sale recorded

Phase 3 — Playwright E2E

Auth flow
Attendance flow
Renewal creation flow

Phase 4 — In-app reporting dashboard

Extend the existing Reporting section in the sidebar (currently shows "coming soon")
Pull trend data from Supabase for attendance over time, revenue over time, renewal status breakdown

Want me to start with Phase 1 and generate the full test setup + first batch of tests, or do you want to tackle analytics first? And do you have a PostHog or Sentry account already, or do I need to include the signup/setup steps?
