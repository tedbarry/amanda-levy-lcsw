# Amanda Levy LCSW — Therapy Practice Website

**URL:** https://amandalevylcsw.com

## What It Is
Professional website for Amanda Berman Levy's LCSW therapy practice. Includes a blog system with magic-link authentication, comments, favorites, and email subscriptions.

## Stack
- **SSG:** Eleventy (11ty)
- **CSS:** Tailwind CSS + PostCSS (autoprefixer, cssnano)
- **Backend:** Cloudflare Pages Functions (API routes)
- **Database:** Cloudflare D1 (SQLite) — stores users, posts, comments, subscriptions
- **Auth:** Magic-link email authentication
- **Images:** Sharp for optimization
- **Templates:** Nunjucks (.njk)

## Project Structure
- `src/` — Source templates, CSS, JS, images
- `dist/` — Built output
- `functions/api/` — Serverless API (auth, posts, comments, favorites, subscribe)
- `schema.sql` — D1 database schema

## Deployment
Cloudflare Pages connected to GitHub. Push to main triggers build and deploy.
Build command: `npm run build`
