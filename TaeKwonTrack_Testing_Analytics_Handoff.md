
**TaeKwonTrack**

Testing & Analytics --- Implementation Handoff

Vitest · Playwright · PostHog · Sentry

Generated April 5, 2026

  ------------------------------------------------------------------------
  **Category**     **Tool**           **Details**
  ---------------- ------------------ ------------------------------------
  Unit Tests       Vitest + RTL       68 assertions across 4 test files

  Integration      Vitest + RTL       API layer + component rendering
  Tests                               

  End-to-End Tests Playwright         23 tests across auth and dashboard
                                      flows

  Product          PostHog            20+ typed events, identity, page
  Analytics                           tracking

  Error Tracking   Sentry             Error boundary, sourcemaps, user
                                      context

  New Files                           14 files created

  Modified Files                      7 existing context files updated
  ------------------------------------------------------------------------

**1. Overview & Stack Decisions**

Both tracks --- testing and analytics --- were built simultaneously and
are designed to work together. The analytics mocks in the test setup
file ensure PostHog and Sentry never fire during tests.

**Testing Stack**

  --------------------------------------------------------------------------------------
  **Tool**                     **Role**         **Why This Choice**
  ---------------------------- ---------------- ----------------------------------------
  Vitest                       Unit +           Native Vite support, zero config,
                               integration test Jest-compatible API. No babel transform
                               runner           needed.

  \@testing-library/react      Component        Tests behavior, not implementation
                               rendering        details. Works naturally with hooks and
                                                context.

  \@testing-library/jest-dom   DOM matchers     Adds .toBeVisible(), .toBeDisabled()
                                                etc. to Vitest assertions.

  jsdom                        Browser          Simulates DOM in Node.js so components
                               environment      render without a real browser.

  \@vitest/coverage-v8         Coverage         V8 native --- faster than Istanbul, no
                               reporting        instrumentation overhead.

  Playwright                   End-to-end tests Faster and more reliable than Cypress
                                                for auth-heavy flows. First-class
                                                TypeScript.
  --------------------------------------------------------------------------------------

**Analytics Stack**

  -----------------------------------------------------------------------
  **Tool**      **Role**         **Why This Choice**
  ------------- ---------------- ----------------------------------------
  PostHog       Product          Open source, 1M events/month free,
                analytics        session recording, funnel analysis,
                                 feature flags --- all in one SDK. No
                                 vendor lock-in.

  Sentry        Error tracking   Vite sourcemap plugin uploads maps
                                 automatically so errors show real
                                 TypeScript lines. React ErrorBoundary
                                 built in.
  -----------------------------------------------------------------------

**2. New Files Created**

**Analytics Layer (src/analytics/)**

  ------------------------------------------------------------------------------------------
  **File**                                    **Purpose**
  ------------------------------------------- ----------------------------------------------
  src/analytics/posthog.ts                    Full PostHog wrapper. Exports initPostHog(),
                                              identifyUser(), resetIdentity(),
                                              trackPageView(), and the typed track()
                                              function with 20+ event definitions.

  src/analytics/sentry.ts                     Full Sentry wrapper. Exports initSentry(),
                                              setSentryUser(), clearSentryUser(),
                                              captureException(), addBreadcrumb().
                                              Re-exports Sentry.ErrorBoundary for App.tsx.

  src/analytics/useAnalyticsPageTracking.ts   React hook. Drop inside AppContent (which has
                                              useLocation access) to automatically fire a
                                              PostHog pageview and Sentry breadcrumb on
                                              every route change.
  ------------------------------------------------------------------------------------------

**Test Infrastructure (src/tests/)**

  -------------------------------------------------------------------------------------------
  **File**                                     **Purpose**
  -------------------------------------------- ----------------------------------------------
  src/tests/setup.ts                           Global Vitest setup. Mocks Supabase (no real
                                               network calls), mocks PostHog and Sentry (no
                                               analytics in tests), stubs matchMedia and
                                               localStorage.

  src/tests/unit/renewalHelpers.test.ts        24 assertions covering
                                               calculateNewExpirationDate,
                                               calculateExpirationFromStart,
                                               calculateDaysUntilExpiration, isInGracePeriod,
                                               isExpiringSoon, validateRenewalDates,
                                               determineRenewalStatus,
                                               calculateRemainingBalance,
                                               calculatePaymentPercentage.

  src/tests/unit/renewalGrouping.test.ts       17 assertions covering deriveUiStatus (all 8
                                               states including edge cases) and groupPeriods
                                               (routing, exclusions, mixed bag, empty input).

  src/tests/unit/formAndAttendance.test.ts     14 assertions covering validateFormData (name,
                                               email, phone rules) and
                                               calculateAttendanceStats (correct counts,
                                               empty inputs, sum invariant).

  src/tests/unit/salesHelpers.test.ts          13 assertions covering formatCurrency,
                                               getCategoryLabel, and validateSaleForm (all
                                               required fields, \"other\" category notes
                                               rule, multiple errors at once).

  src/tests/integration/salesApi.test.ts       Integration tests for fetchTodaysSales and
                                               createSale with Supabase fully mocked. Tests
                                               happy path, error propagation, and empty data
                                               handling.

  src/tests/integration/RenewalCard.test.tsx   14 component tests for RenewalCard. Covers all
                                               5 badge states (active, paid, expiring_soon,
                                               grace_period, expired), balance display,
                                               unknown student fallback, and payment history
                                               toggle.

  src/tests/e2e/auth.spec.ts                   9 Playwright tests covering: login page
                                               rendering, empty form error, wrong credentials
                                               error, password show/hide toggle, forgot
                                               password link, signup link, password
                                               requirement indicators, dashboard redirect
                                               guard, 404 page.

  src/tests/e2e/dashboard.spec.ts              14 Playwright tests covering: stat cards
                                               render, sidebar navigation items, sidebar
                                               collapse/expand, navigating to each major
                                               view, user dropdown, logout redirect,
                                               attendance page layout, Mark All dropdown,
                                               save button state, stat counter updates.
  -------------------------------------------------------------------------------------------

**Config Files**

  ------------------------------------------------------------------------
  **File**               **Purpose**
  ---------------------- -------------------------------------------------
  vitest.config.ts       Configures jsdom environment, global test APIs,
                         setup file path, coverage provider (v8), and
                         coverage exclusions for ui components and type
                         files.

  playwright.config.ts   Configures Chromium + Mobile Safari projects,
                         base URL, trace/screenshot/video on failure, CI
                         retry count, and auto-starts the Vite dev server.
  ------------------------------------------------------------------------

**3. Modified Files**

7 existing files updated. All changes are purely additive --- no
existing logic was altered.

  ----------------------------------------------------------------------------------------
  **File**                                **What Changed**
  --------------------------------------- ------------------------------------------------
  src/main.tsx                            Added initSentry() and initPostHog() calls
                                          before createRoot(). Analytics must init before
                                          React renders so the ErrorBoundary catches
                                          everything from the start.

  src/App.tsx                             Wrapped the entire app in
                                          \<Sentry.ErrorBoundary\>. Added a friendly
                                          ErrorFallback component that shows instead of a
                                          white screen when an unhandled render error
                                          occurs.

  src/components/AppRouter.tsx            Added useAnalyticsPageTracking() call inside
                                          AppContent so every route change fires a PostHog
                                          pageview and Sentry breadcrumb automatically.

  src/context/AuthContext.tsx             Added identifyUser() + setSentryUser() on login,
                                          signup, and session restore. Added
                                          track(\"user_logged_in\"),
                                          track(\"user_signed_up\"). Added
                                          resetIdentity() + clearSentryUser() on logout.

  src/context/AttendanceContext.tsx       Added track(\"attendance_saved\") with
                                          studentCount and date on successful submission.
                                          Added captureException() on save errors.

  src/context/StudentRenewalContext.tsx   Added track() calls for: renewal_created,
                                          renewal_payment_added,
                                          renewal_payment_marked_paid, renewal_deleted,
                                          renewal_student_quit, renewal_renewed.

  src/context/BeltContext.tsx             Added track() calls for: belt_rank_created,
                                          belt_rank_deleted, student_promoted (with
                                          promotionType), promotion_deleted. Added
                                          captureException() on errors.

  src/context/InventoryContext.tsx        Added track() calls for: inventory_item_created
                                          (with category), inventory_item_deleted,
                                          inventory_sale_recorded (with category),
                                          inventory_restock_recorded. Added
                                          captureException() on errors.

  src/context/ClassContext.tsx            Added track() calls for: class_created (with
                                          ageGroup), class_deleted, class_session_added
                                          (with sessionType), class_session_deleted. Added
                                          captureException() on errors.
  ----------------------------------------------------------------------------------------

**4. Key Code Blocks**

**Install Commands**

> ⚠ Run both commands from your project root before copying any files.
>
> \# Testing dependencies
>
> npm install -D vitest \@vitest/coverage-v8 \@vitest/ui \\
>
> \@testing-library/react \@testing-library/jest-dom \\
>
> jsdom \@playwright/test
>
> \# Analytics dependencies
>
> npm install posthog-js \@sentry/react
>
> \# Initialize Playwright browsers (run once)
>
> npx playwright install chromium

**package.json --- Scripts to Add**

> \"scripts\": {
>
> \"test\": \"vitest\",
>
> \"test:ui\": \"vitest \--ui\",
>
> \"test:coverage\": \"vitest \--coverage\",
>
> \"test:e2e\": \"playwright test\",
>
> \"test:e2e:ui\": \"playwright test \--ui\",
>
> \"test:e2e:headed\": \"playwright test \--headed\"
>
> }

**.env --- Environment Variables to Add**

> ⚠ Never commit these values. Add to .env.local for local dev. Add to
> your hosting platform for production.
>
> \# PostHog --- get from app.posthog.com \> Settings \> Project API
> Keys
>
> VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
>
> VITE_POSTHOG_HOST=https://app.posthog.com
>
> \# Sentry --- get from sentry.io \> Settings \> Projects \> Client
> Keys
>
> VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxx@oxxxxxxx.ingest.sentry.io/xxxxxxx
>
> \# Used in Sentry release tagging --- bump this on each deploy
>
> VITE_APP_VERSION=1.0.0
>
> \# E2E tests --- use a dedicated test account in Supabase, never a
> real admin
>
> E2E_TEST_EMAIL=testadmin@taekwontrack.com
>
> E2E_TEST_PASSWORD=TestAdmin123!

**Typed track() --- How to Use in New Features**

Every call to track() is type-checked. TypeScript will error if you pass
wrong props or an undefined event name. To add new events, add them to
the AnalyticsEvent union type in posthog.ts.

> import { track } from \"../analytics/posthog\";
>
> // Correct --- event and props match the union type
>
> track(\"attendance_saved\", { studentCount: 12, date: \"2025-08-20\"
> });
>
> track(\"student_promoted\", { promotionType: \"test\" });
>
> track(\"renewal_created\", { durationMonths: 3 });
>
> // TypeScript error --- wrong prop name
>
> track(\"attendance_saved\", { count: 12 }); // Property \"count\" does
> not exist
>
> // TypeScript error --- event not in catalogue
>
> track(\"made_up_event\"); // not assignable to
> AnalyticsEvent\[\"name\"\]

**Sentry captureException --- How to Use in New Features**

> import { captureException } from \"../analytics/sentry\";
>
> try {
>
> await someRiskyOperation();
>
> } catch (err) {
>
> // Feature and action tags appear in the Sentry UI as filters
>
> captureException(err, {
>
> feature: \"renewals\",
>
> action: \"createRenewal\",
>
> extra: { periodId: \"abc-123\", studentId: \"xyz-456\" },
>
> });
>
> throw err; // re-throw so the context can set its error state
>
> }

**Writing New Unit Tests --- Pattern**

> // src/tests/unit/myFeature.test.ts
>
> import { describe, it, expect, beforeEach, vi } from \"vitest\";
>
> describe(\"myFunction\", () =\> {
>
> beforeEach(() =\> {
>
> // Pin time for date-sensitive tests
>
> vi.setSystemTime(new Date(\"2025-08-20T12:00:00Z\"));
>
> });
>
> it(\"returns X for input Y\", () =\> {
>
> expect(myFunction(\"Y\")).toBe(\"X\");
>
> });
>
> it(\"handles edge case Z\", () =\> {
>
> expect(myFunction(null)).toBeNull();
>
> });
>
> });

**Writing New E2E Tests --- Pattern**

> // src/tests/e2e/myFeature.spec.ts
>
> import { test, expect } from \"@playwright/test\";
>
> test.describe(\"My Feature\", () =\> {
>
> test.beforeEach(async ({ page }) =\> {
>
> // Log in before each test that needs auth
>
> await page.goto(\"/login\");
>
> await page.fill(\"input\[name=email\]\", process.env.E2E_TEST_EMAIL!);
>
> await page.fill(\"input\[name=password\]\",
> process.env.E2E_TEST_PASSWORD!);
>
> await page.click(\"button\[type=submit\]\");
>
> await page.waitForURL(\"/dashboard\");
>
> });
>
> test(\"user can do X\", async ({ page }) =\> {
>
> await page.getByRole(\"button\", { name: /My Feature/i }).click();
>
> await expect(page.getByText(\"Expected Result\")).toBeVisible();
>
> });
>
> });

**5. Analytics Event Catalogue**

All 20 events tracked in PostHog. Each event appears in PostHog under
Insights \> Events. Use them to build funnels, cohorts, and retention
charts.

**Auth Events**

  ------------------------------------------------------------------------
  **Event Name**        **When It Fires**           **Properties**
  --------------------- --------------------------- ----------------------
  user_logged_in        Successful email/password   { method: \"email\" \|
                        login                       \"google\" }

  user_signed_up        New account created         { role: string }

  user_logged_out       User clicks Log Out         none
  ------------------------------------------------------------------------

**Attendance Events**

  ------------------------------------------------------------------------
  **Event Name**        **When It Fires**           **Properties**
  --------------------- --------------------------- ----------------------
  attendance_saved      Admin clicks Save           { studentCount:
                        Attendance successfully     number, date: string }

  attendance_mark_all   Admin uses Mark All         { status: \"present\"
                        dropdown                    \| \"absent\" \|
                                                    \"tardy\" }
  ------------------------------------------------------------------------

**Renewal Events**

  --------------------------------------------------------------------------------
  **Event Name**                **When It Fires**           **Properties**
  ----------------------------- --------------------------- ----------------------
  renewal_created               New renewal period          { durationMonths:
                                registered                  number }

  renewal_payment_marked_paid   Next installment marked     none
                                paid                        

  renewal_payment_added         New payment installment     none
                                added                       

  renewal_student_quit          Student marked as quit      none

  renewal_renewed               Period renewed for another  { durationMonths:
                                term                        number }

  renewal_deleted               Renewal period deleted      none
  --------------------------------------------------------------------------------

**Class Events**

  --------------------------------------------------------------------------
  **Event Name**          **When It Fires**           **Properties**
  ----------------------- --------------------------- ----------------------
  class_created           New class created           { ageGroup: \"Kids\"
                                                      \| \"Adults\" \|
                                                      \"All\" }

  class_deleted           Class deleted               none

  class_session_added     Session added to a class    { sessionType:
                                                      \"recurring\" \|
                                                      \"one-off\" }

  class_session_deleted   Session deleted             none
  --------------------------------------------------------------------------

**Belt Events**

  ------------------------------------------------------------------------
  **Event Name**        **When It Fires**           **Properties**
  --------------------- --------------------------- ----------------------
  belt_rank_created     New belt rank defined       none

  belt_rank_deleted     Belt rank deleted           none

  student_promoted      Student promoted to new     { promotionType:
                        rank                        \"manual\" \| \"test\"
                                                    }

  promotion_deleted     Promotion record deleted    none
  ------------------------------------------------------------------------

**Inventory Events**

  -------------------------------------------------------------------------------
  **Event Name**               **When It Fires**           **Properties**
  ---------------------------- --------------------------- ----------------------
  inventory_item_created       New item added to inventory { category: string }

  inventory_item_deleted       Item deleted                none

  inventory_sale_recorded      Sale transaction recorded   { category: string }

  inventory_restock_recorded   Restock transaction         none
                               recorded                    
  -------------------------------------------------------------------------------

**Navigation Events**

  -------------------------------------------------------------------------
  **Event Name**         **When It Fires**           **Properties**
  ---------------------- --------------------------- ----------------------
  sidebar_view_changed   Admin switches dashboard    { view: string }
                         view                        

  sidebar_collapsed      Sidebar collapsed or        { collapsed: boolean }
                         expanded                    

  \$pageview             Every route change (auto)   { \$current_url:
                                                     string }
  -------------------------------------------------------------------------

**6. Test Coverage Map**

What is tested, where, and at what level.

**Unit Tests --- Pure Functions**

  ----------------------------------------------------------------------------------
  **Function / Module**          **Test File**               **Assertions**
  ------------------------------ --------------------------- -----------------------
  calculateNewExpirationDate     renewalHelpers.test.ts      3 --- correct months,
                                                             month-end edge case,
                                                             year boundary

  calculateExpirationFromStart   renewalHelpers.test.ts      2 --- 3 months, 12
                                                             months

  calculateDaysUntilExpiration   renewalHelpers.test.ts      4 --- today, future,
                                                             past, 30 days

  isInGracePeriod                renewalHelpers.test.ts      4 --- within grace,
                                                             past grace, not
                                                             expired, custom days

  isExpiringSoon                 renewalHelpers.test.ts      4 --- within window,
                                                             outside window,
                                                             expired, today

  validateRenewalDates           renewalHelpers.test.ts      4 --- valid, equal
                                                             dates, past expiry,
                                                             invalid string

  determineRenewalStatus         renewalHelpers.test.ts      6 --- all 5 states +
                                                             paid overrides
                                                             expiring_soon

  calculateRemainingBalance      renewalHelpers.test.ts      3 --- partial,
                                                             overpaid, nothing paid

  calculatePaymentPercentage     renewalHelpers.test.ts      4 --- 50%, 100%,
                                                             overpaid cap, zero
                                                             amount

  deriveUiStatus                 renewalGrouping.test.ts     11 --- all states, edge
                                                             days, paid override,
                                                             total_due=0 guard

  groupPeriods                   renewalGrouping.test.ts     6 --- each bucket,
                                                             renewed/quit excluded,
                                                             mixed input, empty

  validateFormData               formAndAttendance.test.ts   10 --- name length,
                                                             email format, phone
                                                             optional/format

  calculateAttendanceStats       formAndAttendance.test.ts   5 --- typical, all
                                                             unmarked, all marked,
                                                             zero students, sum
                                                             invariant

  formatCurrency                 salesHelpers.test.ts        5 --- whole, cents,
                                                             zero, thousands,
                                                             rounding

  getCategoryLabel               salesHelpers.test.ts        4 --- tuition,
                                                             test_fee, other,
                                                             unknown fallback

  validateSaleForm               salesHelpers.test.ts        10 --- all required
                                                             fields, \"other\" notes
                                                             rule, multiple errors
  ----------------------------------------------------------------------------------

**Integration Tests --- API + Components**

  ------------------------------------------------------------------------------------
  **What Is Tested**       **Test File**          **Assertions**
  ------------------------ ---------------------- ------------------------------------
  fetchTodaysSales ---     salesApi.test.ts       Returns array, calls from(\"sales\")
  success path                                    

  fetchTodaysSales ---     salesApi.test.ts       Throws on Supabase error
  error path                                      

  createSale --- calls     salesApi.test.ts       Calls from(\"sales\")
  correct table                                   

  createSale --- throws on salesApi.test.ts       Rejects on Supabase error
  failure                                         

  RenewalCard --- all 5    RenewalCard.test.tsx   5 render tests for
  badge states                                    active/paid/expiring/grace/expired

  RenewalCard --- balance  RenewalCard.test.tsx   Shows balance when positive, hides
  display                                         when zero

  RenewalCard --- unknown  RenewalCard.test.tsx   Shows \"Unknown Student\" fallback
  student                                         

  RenewalCard --- payment  RenewalCard.test.tsx   Payment history toggle click
  toggle                                          

  RenewalCard --- status   RenewalCard.test.tsx   Renders status_message in subtitle
  message                                         
  ------------------------------------------------------------------------------------

**E2E Tests --- Full Browser Flows**

  -------------------------------------------------------------------------
  **Flow**                  **Test File**       **Tests**
  ------------------------- ------------------- ---------------------------
  Login page renders        auth.spec.ts        Heading, email input, sign
  correctly                                     in button visible

  Empty form validation     auth.spec.ts        Error shown without
                                                submission

  Wrong credentials error   auth.spec.ts        Friendly error message
                                                shown

  Password show/hide toggle auth.spec.ts        Input type changes between
                                                password and text

  Forgot password link      auth.spec.ts        Navigates to
                                                /reset-password

  Signup password           auth.spec.ts        Requirement indicators
  requirements                                  appear on typing

  Dashboard redirect guard  auth.spec.ts        Unauthenticated /dashboard
                                                redirects to /login

  404 catch-all route       auth.spec.ts        404 text and back link
                                                visible

  Dashboard stat cards      dashboard.spec.ts   All 4 cards visible after
                                                login

  Sidebar navigation items  dashboard.spec.ts   All 6 nav items present

  Sidebar collapse/expand   dashboard.spec.ts   Logo text hides/shows on
                                                toggle

  Navigate to each major    dashboard.spec.ts   4 navigation tests
  view                                          (Students, Renewals, Belts,
                                                Inventory)

  User dropdown + logout    dashboard.spec.ts   Dropdown shows, logout
                                                redirects to /

  Attendance page layout    dashboard.spec.ts   Calendar and student list
                                                visible

  Mark All dropdown         dashboard.spec.ts   All 3 status options
                                                visible

  Save button state         dashboard.spec.ts   Disabled when no students
                                                marked
  -------------------------------------------------------------------------

**7. PostHog Setup Walkthrough**

**Step 1 --- Create a PostHog account**

1.  Go to app.posthog.com and sign up for a free account

2.  Create a new project --- name it \"TaeKwonTrack Production\"

3.  Copy the Project API Key from Settings \> Project \> API Keys

4.  Paste it as VITE_POSTHOG_KEY in your .env.local file

**Step 2 --- Verify events are arriving**

5.  Run npm run dev locally

6.  Open PostHog \> Live Events tab

7.  Log in to TaeKwonTrack --- you should see user_logged_in appear
    within 2 seconds

8.  Navigate around the dashboard --- \$pageview events should fire on
    each sidebar click

**Step 3 --- Recommended dashboards to build in PostHog**

  ------------------------------------------------------------------------
  **Dashboard**      **Insight       **Events to Use**
                     Type**          
  ------------------ --------------- -------------------------------------
  Daily Active       Trend           user_logged_in --- unique users per
  Admins                             day

  Feature Adoption   Bar chart       class_created, belt_rank_created,
                                     inventory_item_created --- all time

  Attendance Usage   Funnel          \$pageview (attendance) →
  Funnel                             attendance_saved

  Renewal Health     Trend           renewal_created,
                                     renewal_student_quit, renewal_renewed
                                     --- over 30 days

  Most Used          Bar chart       sidebar_view_changed --- breakdown by
  Dashboard Views                    \"view\" property

  Promotion Type     Pie chart       student_promoted --- breakdown by
  Split                              \"promotionType\" property

  Inventory Activity Trend           inventory_sale_recorded +
                                     inventory_restock_recorded --- over
                                     time
  ------------------------------------------------------------------------

**Step 4 --- Set up Session Recording (optional but recommended)**

9.  In PostHog \> Settings \> Session Recording, enable recording

10. Session recording is already enabled in posthog.ts
    (disable_session_recording: false)

11. In production you can set a sample rate to control volume and cost

> ⚠ Session recording captures what users see and click. Never enable it
> if you collect sensitive health or financial data without proper
> consent mechanisms.

**8. Sentry Setup Walkthrough**

**Step 1 --- Create a Sentry project**

12. Go to sentry.io and create a free account

13. Create a new project --- select React as the platform

14. Copy the DSN from Settings \> Projects \> Client Keys \> DSN

15. Paste it as VITE_SENTRY_DSN in your .env.local file

**Step 2 --- Add the Vite sourcemap plugin (critical for readable
errors)**

Without sourcemaps, Sentry errors show minified code. This plugin
uploads maps on every build.

> \# Install the Sentry Vite plugin
>
> npm install -D \@sentry/vite-plugin

Then update vite.config.ts:

> import { sentryVitePlugin } from \"@sentry/vite-plugin\";
>
> export default defineConfig({
>
> plugins: \[
>
> react(),
>
> // Must be last plugin
>
> sentryVitePlugin({
>
> org: \"your-sentry-org\",
>
> project: \"taekwontrack\",
>
> authToken: process.env.SENTRY_AUTH_TOKEN,
>
> }),
>
> \],
>
> build: {
>
> // Required for Sentry to generate sourcemaps
>
> sourcemap: true,
>
> },
>
> });
>
> \# Add to .env.local (never commit this)
>
> SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxx

**Step 3 --- Verify error capture**

16. Temporarily add a button that throws: \<button onClick={() =\> {
    throw new Error(\"Test error\") }}\>Break\</button\>

17. Click it in the browser

18. Open Sentry \> Issues --- you should see the error within 10 seconds
    with a readable stack trace

19. Remove the test button

**Step 4 --- Recommended Sentry alerts to configure**

  ------------------------------------------------------------------------
  **Alert**          **Condition**               **Why**
  ------------------ --------------------------- -------------------------
  Error spike        More than 10 new errors in  Catches deployment
                     1 hour                      regressions immediately

  New issue          Any new unique error type   Catches issues that have
                                                 never been seen before

  High volume issue  Same error \> 50            Catches errors affecting
                     occurrences/day             many users
  ------------------------------------------------------------------------

**9. CI/CD Integration**

A GitHub Actions workflow that runs unit tests, integration tests, and
E2E tests on every pull request.

**GitHub Actions Workflow**

> ℹ Create this file at .github/workflows/test.yml in your repository
> root.
>
> name: Tests
>
> on:
>
> push:
>
> branches: \[main, develop\]
>
> pull_request:
>
> branches: \[main\]
>
> jobs:
>
> unit-and-integration:
>
> runs-on: ubuntu-latest
>
> steps:
>
> \- uses: actions/checkout@v4
>
> \- uses: actions/setup-node@v4
>
> with:
>
> node-version: 20
>
> cache: npm
>
> \- run: npm ci
>
> \- run: npm run test:coverage
>
> \- uses: actions/upload-artifact@v4
>
> if: always()
>
> with:
>
> name: coverage-report
>
> path: coverage/
>
> e2e:
>
> runs-on: ubuntu-latest
>
> needs: unit-and-integration
>
> env:
>
> E2E_TEST_EMAIL: \${{ secrets.E2E_TEST_EMAIL }}
>
> E2E_TEST_PASSWORD: \${{ secrets.E2E_TEST_PASSWORD }}
>
> VITE_SUPABASE_API_URL: \${{ secrets.VITE_SUPABASE_API_URL }}
>
> VITE_SUPABASE_ANON_API_KEY: \${{ secrets.VITE_SUPABASE_ANON_API_KEY }}
>
> steps:
>
> \- uses: actions/checkout@v4
>
> \- uses: actions/setup-node@v4
>
> with:
>
> node-version: 20
>
> cache: npm
>
> \- run: npm ci
>
> \- run: npx playwright install \--with-deps chromium
>
> \- run: npm run test:e2e
>
> \- uses: actions/upload-artifact@v4
>
> if: failure()
>
> with:
>
> name: playwright-report
>
> path: playwright-report/
>
> retention-days: 7

**GitHub Secrets to Configure**

Add these in your repo Settings \> Secrets and variables \> Actions:

  ---------------------------------------------------------------------------
  **Secret Name**              **Value**
  ---------------------------- ----------------------------------------------
  E2E_TEST_EMAIL               The test admin account email (never use a real
                               admin account)

  E2E_TEST_PASSWORD            The test admin account password

  VITE_SUPABASE_API_URL        Your Supabase project URL (safe to expose)

  VITE_SUPABASE_ANON_API_KEY   Your Supabase anon key (safe to expose --- RLS
                               gates access)

  SENTRY_AUTH_TOKEN            Only needed if you add the Sentry Vite plugin
                               for sourcemap upload
  ---------------------------------------------------------------------------

**10. Verification Steps**

**Testing --- Verify Everything Passes**

20. Run npm install (pick up the new dev dependencies)

21. Run npm run test --- all 68 unit and integration tests should pass
    with 0 failures

22. Run npm run test:coverage --- coverage report opens in
    coverage/index.html

23. Run npm run dev in one terminal, then npm run test:e2e in another
    --- 23 E2E tests should pass

24. Run npm run test:e2e:ui to open the Playwright visual test runner
    for debugging failures

**Analytics --- Verify PostHog Is Receiving Events**

25. Set VITE_POSTHOG_KEY in .env.local

26. Run npm run dev

27. Open PostHog \> Live Events tab in your browser

28. Log in to TaeKwonTrack --- user_logged_in should appear within 2
    seconds

29. Click sidebar nav items --- sidebar_view_changed events should fire

30. Save attendance --- attendance_saved should appear with studentCount
    and date properties

31. Create a class --- class_created should appear with ageGroup
    property

**Analytics --- Verify Sentry Is Receiving Errors**

32. Set VITE_SENTRY_DSN in .env.local

33. Run npm run dev

34. Temporarily add a throw in any component, trigger it in browser

35. Check Sentry \> Issues --- error should appear within 10 seconds

36. Verify the stack trace shows readable TypeScript file names (not
    minified)

37. Remove the test throw

**Confirm Analytics Are Silenced in Tests**

38. Run npm run test

39. No PostHog or Sentry calls should appear in terminal output

40. The global mocks in setup.ts ensure track() and captureException()
    are vi.fn() stubs

> ℹ If you see \"VITE_POSTHOG_KEY not set\" warnings during tests, that
> is expected behavior --- the mocks prevent real calls but the warning
> fires before init is skipped.
