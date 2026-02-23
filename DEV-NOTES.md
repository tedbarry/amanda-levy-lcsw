# Amanda Levy, LCSW — Developer Notes

> **Purpose:** This file provides context for any AI assistant or developer picking up work on this project. Keep it updated after every major change.

---

## Project Overview
- **Site:** amandalevylcsw.com — Professional therapist website
- **Owner:** Amanda Levy, LCSW (Jackson, NJ)
- **Managed by:** Ted (son-in-law)
- **Hosting:** Cloudflare Pages (auto-deploys from GitHub on push to `master`)
- **Repo:** github.com/tedbarry/amanda-levy-lcsw (branch: `master`)
- **Cost:** $0/month (all free tiers)

---

## Tech Stack (Current — Static Site)
- **HTML/CSS/JS** — No build tools, no framework
- **Tailwind CSS** via CDN with custom config (sage, cream, sky, warm color palettes)
- **Google Fonts:** Playfair Display (serif headings) + Inter (sans body)
- **Formspree** for contact form AJAX submission (endpoint: `https://formspree.io/f/xpqjoarb`)
- **Cache busting:** `?v=7` on styles.css and main.js references (bump on every deploy)

---

## Site Architecture (Multi-Page — as of Feb 2026)

| Page | File | Content |
|------|------|---------|
| Home | `index.html` | Hero (parallax shapes), quote rotator, about/bio (clickable therapeutic approaches), social proof counters, CTA banner |
| Services | `services.html` | 3 specialty cards, 4 expertise groups, populations served, "What to Expect" 4-step timeline |
| Fees & FAQ | `fees-faq.html` | Session fees, insurance verification helper, FAQ accordion (6 items), self-check widget. Contains FAQPage JSON-LD. |
| Contact | `contact.html` | Formspree contact form, Google Maps embed, phone/email/hours, free consultation CTA |
| Blog | `blog.html` | Blog listing with post cards, search, subscribe CTA |
| Post | `post.html` | Single post view with comments, favorites |
| Admin | `admin.html` | Admin dashboard — Quill.js editor, comment moderation, subscriber/user lists |
| Portal | `portal.html` | User portal — my comments, favorites, profile, account settings |
| Login | `login.html` | Magic link email login |

### Shared Across All Pages
- Same navbar (multi-page links including Blog) and footer
- Same `styles.css` and `main.js`
- Same Tailwind config (inline `<script>` in each HTML `<head>`)
- Back-to-top button, sticky mobile CTA bar

---

## Key Files

| File | Purpose | Lines (approx) |
|------|---------|-----------------|
| `index.html` | Home page | ~543 |
| `services.html` | Services page | ~408 |
| `fees-faq.html` | Fees/FAQ page | ~516 |
| `contact.html` | Contact page | ~357 |
| `main.js` | All interactivity (shared) | ~443 |
| `styles.css` | All custom styles (shared) | ~540 |
| `blog.js` | Blog system JS (auth, posts, comments, favorites, admin, portal) | large |
| `blog.html` | Blog listing page | — |
| `post.html` | Single post view | — |
| `admin.html` | Admin dashboard with Quill.js editor | — |
| `portal.html` | User portal | — |
| `login.html` | Magic link login page | — |
| `schema.sql` | D1 database schema | — |
| `sitemap.xml` | SEO sitemap (5 URLs) | ~30 |
| `robots.txt` | Search engine directives + blog disallows | small |
| `favicon.svg` | Browser tab icon (leaf design) | small |
| `headshot.jpeg` | Amanda's professional photo | image |

---

## main.js Features (all use null-checks so they work on any page)
1. Hash redirects — old `#services`, `#fees`, `#faq`, `#contact` anchors → new page URLs
2. Active nav highlighting — based on current page + scroll position (home only); includes blog pages
3. Current year in footer
4. Mobile menu toggle
5. Navbar shadow on scroll
6. FAQ accordion
7. Therapeutic approach detail panels (clickable tags)
8. Contact form Formspree AJAX submission
9. Quote rotator with auto-rotation + dot navigation
10. Social proof animated counters (IntersectionObserver)
11. Parallax hero shapes
12. Self-check widget ("Is Therapy Right For Me?" — 5 questions)
13. Back-to-top button
14. Sticky mobile CTA bar
15. Scroll reveal animations (IntersectionObserver)

---

## Structured Data (JSON-LD)
- `index.html` → MedicalBusiness schema (practice info, services, pricing)
- `fees-faq.html` → FAQPage schema (6 Q&A pairs)

---

## Design Tokens
```
Sage:    50=#f6f7f4  100=#e8ebe3  200=#d4dac9  300=#b5c0a4  400=#96a67e  500=#7a8e63  600=#60724d  700=#4c5a3e  800=#3f4a34  900=#363f2e
Cream:   50=#fefdfb   100=#fdf9f0  200=#faf3e0  300=#f5e8c8  400=#eddcab
Sky:     50=#f0f7fa   100=#dceef5  200=#bddee9  300=#8ec6d8  400=#5dabc2
Warm:    50=#fdf8f6   100=#f9ede7  200=#f3dace  300=#e9bfa9  400=#dba080
```

---

## Contact Info (Amanda's)
- **Phone:** (973) 517-4062
- **Email:** amandalevylcsw@gmail.com
- **Location:** Jackson, NJ 08527
- **Hours:** Sun–Thu, 9am–8pm
- **Psychology Today:** https://www.psychologytoday.com/us/therapists/amanda-levy-jackson-nj/58576
- **Licenses:** NJ and NY

---

## Important Decisions / Context
- Self-check widget: 1-2 "yes" answers message was rewritten to be more validating (original felt inconsiderate for therapy clients)
- Site was originally single-page; split into 4 pages in Feb 2026 to reduce scrolling
- Google Search Console verification placeholder exists in index.html (commented out) — not yet configured
- Formspree real endpoint ID: `xpqjoarb` (initial placeholder didn't work)
- Blog uses Cloudflare Pages Functions (file-based routing in `functions/` directory), not a separate Workers project
- Blog auth is magic-link only (no passwords) — privacy-first approach for therapy clients
- Admin is identified by `ADMIN_EMAIL` environment variable matching the logged-in user's email
- Blog posts use auto-generated slugs from titles; Quill.js stores HTML content in D1
- Anonymous commenting: users can toggle "post as Anonymous" — their display name is hidden but email is still stored for moderation

---

## Deployment Checklist
1. Make changes to files
2. Bump cache bust version (`?v=N`) on all `styles.css` and `main.js` references across ALL HTML files (index, services, fees-faq, contact, blog, post, admin, portal, login)
3. `git add` specific files
4. `git commit` with descriptive message
5. `git push origin master`
6. Cloudflare Pages auto-deploys within ~1 minute
7. If blog schema changed: re-run `schema.sql` in D1 console

---

## IMPLEMENTED: Blog & User System

### What Was Built
A full blog system with user accounts, comments, subscriptions, favorites, and a user portal — all running on Cloudflare free tier.

### Features
1. **Blog posts** — Amanda writes in an admin panel with Quill.js rich text editor, stored in D1
2. **User accounts** — Magic link email login (passwordless via Resend.com), display names (can be pseudonyms)
3. **Comments** — Logged-in users can comment; option to post as "Anonymous"
4. **Email subscriptions** — Subscribe to new post notifications via email (Resend.com free tier)
5. **User portal** — Dashboard with tabs: my comments, favorite posts, profile/display name management, account settings (delete account)
6. **Admin panel** — Amanda can: write/edit/delete posts, moderate comments, view/manage subscribers, view users
7. **Privacy-first** — Emails never shown publicly, anonymous commenting option, display names instead of real names

### Tech Stack (Blog)
- **Backend API:** Cloudflare Pages Functions (serverless, file-based routing under `functions/`)
- **Database:** Cloudflare D1 (SQLite) — database name: `amanda-blog`
- **Email service:** Resend.com (free tier: 3,000 emails/month)
- **Auth:** Custom magic link system (email-based, passwordless, session tokens)
- **Rich text editor:** Quill.js (CDN) in admin panel
- **Frontend:** HTML/CSS/JS matching existing sage/cream design
- **Cost:** $0/month

### New Files Created

| File | Purpose |
|------|---------|
| `schema.sql` | D1 database schema (users, posts, comments, favorites, subscriptions, sessions) |
| `blog.js` | Main blog JS — auth state, post rendering, comments, favorites, admin, portal |
| `blog.html` | Blog listing page (post cards, search, subscribe CTA) |
| `post.html` | Single post view (content, comments, favorite toggle) |
| `admin.html` | Admin dashboard with Quill.js rich text editor, comment moderation, subscriber/user lists |
| `portal.html` | User portal (tabbed: my comments, favorites, profile, account settings) |
| `login.html` | Magic link login page |

### API Endpoints (Cloudflare Pages Functions)

**Shared utilities (`functions/_shared/`):**
| File | Purpose |
|------|---------|
| `functions/_middleware.js` | Auth middleware — attaches user to context if session valid |
| `functions/_shared/response.js` | JSON response and error response helpers |
| `functions/_shared/auth.js` | Session/token creation and validation utilities |
| `functions/_shared/email.js` | Resend.com email templates (magic link, new post notification) |
| `functions/_shared/db.js` | Slug generation, pagination helpers |

**Auth endpoints (`functions/api/auth/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-magic-link` | POST | Send magic link email to user |
| `/api/auth/verify` | GET | Verify magic link token, create session |
| `/api/auth/logout` | POST | Destroy session |
| `/api/auth/me` | GET | Get current authenticated user |

**Post endpoints (`functions/api/posts/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/posts` | GET | List posts (paginated) |
| `/api/posts` | POST | Create new post (admin only) |
| `/api/posts/[slug]` | GET | Get single post by slug |
| `/api/posts/[slug]` | PUT | Update post (admin only) |
| `/api/posts/[slug]` | DELETE | Delete post (admin only) |

**Comment endpoints (`functions/api/comments/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/comments/[postId]` | GET | Get comments for a post |
| `/api/comments` | POST | Create comment (authenticated) |
| `/api/comments/delete/[id]` | DELETE | Delete own comment |

**Subscription endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/subscribe` | POST | Subscribe email to new post notifications |
| `/api/unsubscribe` | GET | Unsubscribe via token link |

**Favorites endpoints (`functions/api/favorites/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/favorites` | GET | Get user's favorited posts |
| `/api/favorites/[postId]` | POST | Toggle favorite on/off |

**Portal endpoints (`functions/api/portal/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/portal/my-comments` | GET | Get current user's comments |
| `/api/portal/profile` | PUT | Update display name |
| `/api/portal/account` | DELETE | Delete user account and all data |

**Admin endpoints (`functions/api/admin/`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/subscribers` | GET | List all subscribers |
| `/api/admin/comments/[id]` | DELETE | Delete any comment (admin) |
| `/api/admin/users` | GET | List all users |

### Files Modified for Blog Integration
- `index.html` — Added Blog nav link, bumped cache to `?v=7`
- `services.html` — Same nav/footer update, `?v=7`
- `fees-faq.html` — Same nav/footer update, `?v=7`
- `contact.html` — Same nav/footer update, `?v=7`
- `main.js` — Added blog page active nav highlighting
- `styles.css` — Added blog post content styles, tab styles, Quill editor overrides
- `sitemap.xml` — Added `blog.html`
- `robots.txt` — Added disallow for `/admin.html`, `/portal.html`, `/login.html`, `/api/`
- `_headers` — Added `X-Robots-Tag: noindex` for admin/portal/login, API security headers

### Manual Setup Steps (Required Before Blog Works)
1. **Create D1 database** — In Cloudflare dashboard, create a D1 database named `amanda-blog`
2. **Run schema** — Paste contents of `schema.sql` into the D1 console and execute
3. **Bind D1 to Pages** — In Cloudflare Pages project settings, add D1 binding with variable name `DB` pointing to `amanda-blog`
4. **Sign up for Resend.com** — Create account, verify domain `amandalevylcsw.com`, get API key
5. **Set environment variables** — In Cloudflare Pages > Settings > Environment Variables, add:
   - `RESEND_API_KEY` — From Resend.com dashboard
   - `ADMIN_EMAIL` — Amanda's email (used to identify admin user)
   - `SITE_URL` — `https://amandalevylcsw.com`
   - `SESSION_SECRET` — Any random string (used to sign session tokens)

### Implementation Status
- [x] Database schema design (users, posts, comments, favorites, subscriptions, sessions)
- [x] Cloudflare Pages Functions project setup
- [x] API endpoints (auth, posts CRUD, comments CRUD, subscriptions, favorites, portal, admin)
- [x] Magic link auth system (Resend.com integration)
- [x] Admin panel (Quill.js post editor + comment moderation + subscriber/user management)
- [x] Blog listing page
- [x] Individual post pages with comments and favorites
- [x] Comment system UI (with anonymous option)
- [x] User portal (comments, favorites, profile, account deletion)
- [x] Email notification system (Resend integration — magic links + new post alerts)
- [x] Update navbar on all existing pages to include Blog link
- [x] Update sitemap.xml and robots.txt
- [x] Cache bust version bumped to `?v=7` across all pages

---

*Last updated: 2026-02-22*
