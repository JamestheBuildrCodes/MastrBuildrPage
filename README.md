# Mastr Buildr — Backend Setup Guide

This guide takes you from zero to a fully live site with a real database in about **15 minutes**.

---

## What You're Building

```
GitHub Repo (MastrBuildrPage)
        ↓  auto-deploys
Netlify (hosts site + runs serverless functions)
        ↓  reads/writes
Supabase (PostgreSQL database — free tier)
```

- **Newsletter signups** → saved to Supabase `subscribers` table
- **Live project counter** → read from Supabase `project_counter` table
- **Admin panel** → `/admin` page to update the counter in one click

---

## Step 1 — Create Your Supabase Project (free)

1. Go to **[supabase.com](https://supabase.com)** → Sign up / Log in
2. Click **New Project**
   - Name: `mastrbuildr`
   - Database password: save this somewhere safe
   - Region: pick the closest to Nigeria (e.g. **West EU** or **US East**)
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** → **New Query**
5. Paste the entire contents of **`supabase-setup.sql`** → click **Run**
6. You should see: `subscribers: 0 rows` and `project_counter: 1 row`

### Get your API keys

Go to **Project Settings → API** and copy:
- **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
- **anon / public** key (the long `eyJ...` string)

---

## Step 2 — Push to GitHub

Make sure your `MastrBuildrPage` repo contains these files:

```
MastrBuildrPage/
├── index.html              ← main website
├── netlify.toml            ← Netlify config
├── package.json            ← dependencies
├── .env.example            ← template (don't add real keys here)
├── admin/
│   └── index.html          ← admin panel
└── netlify/
    └── functions/
        ├── subscribe.js    ← newsletter API
        └── projects.js     ← project counter API
```

Upload all files to your repo at **github.com/JamestheBuildrCodes/MastrBuildrPage**

> ⚠️ **Never commit `.env` or real API keys to GitHub**

---

## Step 3 — Connect Netlify to GitHub

1. Go to **[netlify.com](https://netlify.com)** → Add new site → Import from Git
2. Select **GitHub → MastrBuildrPage**
3. Build settings (leave blank — auto-detected from `netlify.toml`):
   - Build command: *(empty)*
   - Publish directory: `.`
4. Click **Deploy site**

---

## Step 4 — Add Environment Variables in Netlify

Go to **Site Settings → Environment Variables → Add variable** and add these 3:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `ADMIN_SECRET_KEY` | Make up a long random password (e.g. `mb-admin-xK9f2mP...`) |

After adding variables → **Deploys → Trigger deploy** to apply them.

---

## Step 5 — Test Everything

### Test the newsletter:
- Go to your live site → scroll to Newsletter section
- Enter an email → click Subscribe
- Check Supabase: **Table Editor → subscribers** — your email should appear

### Test the project counter:
- Open `https://yoursite.netlify.app/.netlify/functions/projects`
- Should return: `{"count":7,"updated_at":"..."}`

### Test the admin panel:
- Go to `https://yoursite.netlify.app/admin`
- Enter your `ADMIN_SECRET_KEY`
- Change the counter → click Update
- Refresh your main site — the badge should show the new number within 30s

---

## Step 6 — Update the Counter Whenever You Start/Finish a Project

Two ways to do it:

**Option A — Admin Panel (easiest)**
→ Go to `/admin` on your live site, enter your key, update the number

**Option B — Direct API call (from terminal or Postman)**
```bash
curl -X POST https://yoursite.netlify.app/api/projects \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_SECRET_KEY" \
  -d '{"count": 9}'
```

---

## View Your Subscribers

Go to **Supabase → Table Editor → subscribers** to see all emails.

To export: **Table Editor → subscribers → ... → Export to CSV**

---

## Local Development (optional)

```bash
npm install -g netlify-cli
cp .env.example .env.local
# fill in your real keys in .env.local

netlify dev
# Site runs at http://localhost:8888
# Functions run at http://localhost:8888/.netlify/functions/
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Newsletter says "Server misconfiguration" | Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Netlify env vars |
| Counter always shows 7 | Function may be failing — check Netlify **Functions** logs |
| Admin says "Unauthorized" | Double-check `ADMIN_SECRET_KEY` — must match exactly |
| Functions not found (404) | Make sure `netlify.toml` is in repo root and deployed |

---

## Questions?

📧 mastrbuildr2020@gmail.com  
💬 wa.me/2347069267088
