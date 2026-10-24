# LunchLuxe

A responsive website for a homestyle vegetarian meal subscription service in Bhubaneswar. The homepage links to dedicated Regular, Premium, and Elite plan pages. Built with plain HTML, CSS, and JavaScript; no build step or package installation is needed.

## Run locally

Open `index.html` in a browser, or serve this directory with any static file server:

```sh
npx serve .
```

The mobile navigation and plan-page navigation work in the browser. Food photography and fonts are loaded from Unsplash and Google Fonts.

The supplied LunchLuxe logo is included locally at `assets/lunchluxe-logo.png` and used in the header and footer.

## Checkout flow

The static site includes a three-step customer checkout flow:

- `login.html` — customer sign-in
- `checkout-plans.html` — Regular, Premium, and Elite plan selection
- `payment.html` — high-order-volume pause notice with a persistent waiting number and saved plan summary

The flow stores temporary selections in `sessionStorage` and the waiting number in `localStorage`. Authentication and payment processing can be connected when backend integrations are added.

## Enhancements & support assistant

- `enhance.css` / `enhance.js` — larger, easier-to-read text, animated key-point highlights (`<mark class="hl">`), scroll-driven timeline, 3D plan-card tilt, hero particles and other motion. Animations are disabled for visitors who prefer reduced motion.
- `chatbot.css` / `chatbot.js` — the "Luxe Assistant" chat widget. It answers common questions (plans, today’s menu, delivery, add-ons, diet, pause/cancel) and includes a support-ticket / incident form. Tickets get an ID (e.g. `LL-261023-AB12`), are saved in the visitor’s browser (`localStorage`) and are sent to the team via a prefilled WhatsApp message or email. There is no backend, so tickets only reach the team once the visitor sends them.
- Any element with `data-open-chat` or `data-open-ticket` opens the assistant or the ticket form.
