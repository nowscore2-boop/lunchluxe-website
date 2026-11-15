# LunchLuxe

A responsive website for a homestyle vegetarian meal subscription service in Bhubaneswar. The static storefront has an optional Node.js API and administrator back office backed by PostgreSQL/Neon.

## Run locally

Open `index.html` in a browser, or serve this directory with any static file server:

```sh
npx serve .
```

The mobile navigation and plan-page navigation work in the browser. Food photography and fonts are loaded from Unsplash and Google Fonts.

The supplied LunchLuxe logo is included locally at `assets/lunchluxe-logo.png` and used in the header and footer.

## Plan requests and back office

Without an API configured, the site continues to use WhatsApp enquiries. Once the API is configured, visitors can submit a plan request with contact details, delivery address and preferred start date. Requests are pending until an administrator checks delivery coverage and confirms the details with the customer. The site does **not** collect payments; Razorpay is not connected.

The administrator can edit plan names, descriptions and daily meal prices, the weekly menu and add-ons; changes appear to visitors after they reload. A 30-day plan price is the sum of its three daily meal prices multiplied by 30. The admin can review requests, track manually entered income and expenses, and record employee details, attendance, leave, shifts and salary payments. Finance and salary entries are independent: record a salary payment as an expense separately if it should appear in finance totals. The app does not calculate payroll or statutory deductions, issue payslips, send customer notifications, or process payments.

### Setup

1. Install Node.js 20 or newer. Run `npm ci --prefix backend`.
2. Obtain a Neon PostgreSQL connection. Use a separate development database or branch when possible. The migration below creates only `luxe_` tables, but the specified database is modified; back it up before running. Never expose a database URL in browser code or commit credentials.
3. Configure `DATABASE_URL` in the ignored `backend/.env` file using `backend/.env.example`, then run `npm --prefix backend run migrate`. The migration creates the tables and seeds the current website catalog only if it does not already exist. It does not overwrite existing catalog edits.
4. Create a dedicated database login for the API with privileges restricted to the `luxe_` tables and their identity sequences; do not use ScoreNow's unrestricted database credentials for the deployed API. Run the migration using a database owner, then configure the restricted role's connection string as the API's `DATABASE_URL`.
5. Run `npm --prefix backend run password` in an interactive terminal. Choose a long, unique admin password; input is hidden. Put the resulting hash in `ADMIN_PASSWORD_HASH` and choose `ADMIN_USERNAME` in the backend environment. Keep the password and hash private; no default admin credentials are provided. Rotating the hash does not invalidate existing sessions: delete rows from `luxe_admin_sessions` when revoking all sessions.
6. Set `PUBLIC_ORIGIN` to the exact storefront origin (for local testing, for example `http://localhost:8000`). Start the API with `npm --prefix backend start`. The API refuses to start without its required settings or catalog.
7. Serve the static site over HTTP(S), not `file://`. Set the public API origin in `api-config.js` (for example `http://localhost:3000` for local development). Open `admin.html` and sign in using the configured username and password. In production, use HTTPS for both the website and API.
8. For Render, deploy a **separate** service using the root `render.yaml` Blueprint. Configure `DATABASE_URL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD_HASH` as Render secrets. Run the migration separately before starting the service; then set `api-config.js` to the resulting HTTPS API URL and redeploy the static website. Add the precise website origin as `PUBLIC_ORIGIN`; `www` and non-`www` are different origins.

The database contains customer contact details and employee/finance information. Limit database and deployment access, enable backups, use a unique administrator password, and restrict access to the back office. The admin session expires after eight hours. Entries are stored privately in the database; customer notifications and deletion/retention workflows must be handled separately. Do not treat the simple finance totals as audited accounting.

Run `npm --prefix backend test` for validation tests. Neon integration tests are skipped unless `LUXE_TEST_DATABASE_URL` is set. Those tests create a random `luxe_test_` schema inside a transaction and roll it back; use a disposable database or branch when possible.

## Enhancements & support assistant

- `enhance.css` / `enhance.js` — larger, easier-to-read text, animated key-point highlights (`<mark class="hl">`), scroll-driven timeline, 3D plan-card tilt, hero particles and other motion. Animations are disabled for visitors who prefer reduced motion.
- `chatbot.css` / `chatbot.js` — the "Luxe Assistant" chat widget. It answers common questions (plans, today’s menu, delivery, add-ons, diet, pause/cancel) and includes a support-ticket / incident form. Tickets get an ID (e.g. `LL-261023-AB12`), are saved in the visitor’s browser (`localStorage`) and are sent to the team via a prefilled WhatsApp message or email. There is no backend, so tickets only reach the team once the visitor sends them.
- Any element with `data-open-chat` or `data-open-ticket` opens the assistant or the ticket form.
