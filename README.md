# CodeCoast — Hackathon Website (full stack)

A complete, working hackathon website for the fictional **CodeCoast Season 1**: animated landing page, team registration, referral/ambassador program with a live leaderboard, merch store with cart & checkout, contact + sponsorship enquiries, a 3D photo gallery, policy pages and an organiser dashboard.

Built with **Node.js + Express** and the **SQLite database that ships inside Node** (no database server to install). The frontend is plain HTML/CSS/JS with [GSAP](https://gsap.com/) + ScrollTrigger and [Lenis](https://lenis.darkroom.engineering/) smooth scroll.

## Run it

Requirements: **Node.js 22.13 or newer** (download from https://nodejs.org — the LTS version is fine).

```bash
npm install
npm start
```

Open **http://localhost:3000**. The database file is created automatically in `data/codecoast.db`.

### Admin dashboard

Go to **http://localhost:3000/admin**. The default password is `codecoast-admin` — **change it** before putting the site online:

```bash
# macOS / Linux
ADMIN_PASSWORD="something-long-and-secret" npm start
# Windows PowerShell
$env:ADMIN_PASSWORD="something-long-and-secret"; npm start
```

From the dashboard you can see every team, ambassador, merch order and enquiry, change their status (shortlist teams, mark orders paid/collected, …) and export each table as CSV.

## Pages

| URL | What it does |
| --- | --- |
| `/` | Landing page — pixel scramble hero, scroll-reveal story, prize bento, pinned horizontal tracks, calendar + countdown, gallery strip, live clock & weather, FAQ |
| `/apply` | 3-step team application (track, members, idea, referral code) → saved to DB, ticket issued |
| `/refer` | Generate an ambassador code, share link/WhatsApp, live top-10 leaderboard (25 pts per referred team member) |
| `/merch`, `/merch/:slug` | Store + product pages (fit, size, size chart, quantity, fly-to-cart) |
| `/checkout` | Cart (edit/remove, 2+ tees = ₹50 off) → pickup details → order reference (prices are re-calculated on the server) |
| `/contact` | Enquiry form |
| `/sponsorship` | Tiers, comparison table, sponsor enquiry form |
| `/gallery` | Draggable 3D photo dome, filterable masonry grid, lightbox with keyboard nav |
| `/about`, `/code-of-conduct`, `/privacy-policy`, `/terms` | Content pages |
| `/admin` | Organiser dashboard |

## API

`POST /api/register` · `POST /api/referrals` · `GET /api/referrals/leaderboard` · `GET /api/referrals/:code` · `POST /api/contact` · `GET /api/products` · `GET /api/products/:slug` · `POST /api/orders` · admin routes under `/api/admin/*` (cookie session).

Public POST routes are rate-limited and validate every field on the server.

## Customise

- **Branding / copy**: `views/*.html` (each page) and `views/layout.html` (nav, menu, popup, footer).
- **Dates, schedule, tracks, FAQs**: top of `public/js/home.js` (`EVENT_DATE`, `EVENTS`, `TRACKS`, `FAQ`).
- **Merch catalogue**: seeded in `db.js` (delete `data/codecoast.db` to re-seed after editing).
- **Photos**: gallery uses picsum.photos placeholders — replace the URLs in `public/js/gallery.js` and `public/js/home.js`.
- **Colours & fonts**: CSS variables at the top of `public/css/site.css`.

## Deploying

Any Node host works (Render, Railway, Fly.io, a VPS…): build command `npm install`, start command `npm start`, set `ADMIN_PASSWORD`, and give it a persistent disk mounted at `data/` (or set `DATA_DIR`) so the database survives restarts.
GitHub Pages **cannot** run this version because it needs the Node server.

## Project structure

```
server.js        Express server: page routes + JSON API + admin
db.js            SQLite schema + merch seed
views/           layout.html + one HTML fragment per page
public/css/      site.css (landing page) + pages.css (shared chrome & inner pages)
public/js/       common.js (nav, menu, transitions, cart, cursor…) + one script per page
public/assets/   logo + merch artwork (SVG)
```
