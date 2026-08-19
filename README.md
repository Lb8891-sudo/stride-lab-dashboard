# The Stride Lab — Live Dashboard

A live, phone-installable dashboard reading directly from your Stride Lab
Google Sheet. Built as a small React frontend plus a secure backend piece
(a Vercel Serverless Function) that holds your Google credentials safely —
they never reach the browser.

## What you'll end up with

- A real URL (e.g. `stride-lab.vercel.app`) showing live data from your
  actual Dashboard sheet
- Installable on a phone's home screen as a real app icon, using your logo
- A "Refresh" button that re-pulls from Google Sheets on demand

---

## Setup — five parts, done once

### Part 1: Google Cloud service account (the same one from the RaceIQ Updater, if you've already made one)

If you already created a service account for the RaceIQ Updater tool, you
can reuse the same one — skip to step 5.

1. Go to console.cloud.google.com → create a project (or use an existing one)
2. APIs & Services → Library → search "Google Sheets API" → Enable
3. APIs & Services → Credentials → Create Credentials → Service Account
4. Once created, click into it → Keys tab → Add Key → Create new key → JSON
   — this downloads a `.json` file. Keep it somewhere safe; you'll need two
   values from inside it in Part 3.
5. Open your actual Stride Lab Google Sheet → Share → paste in the service
   account's email address (it's the `client_email` field in that JSON
   file) → give it Viewer access (this dashboard only reads, never writes)

### Part 2: Push this code to GitHub

1. Create a new repository on github.com (call it `stride-lab-dashboard` or
   similar)
2. Upload every file in this folder to that repository (drag-and-drop
   works fine on GitHub's website if you'd rather not use git commands)

### Part 3: Connect Vercel to that repository

1. In Vercel, click "Add New" → "Project"
2. Select the GitHub repository you just created
3. Vercel will auto-detect this as a Vite project — leave the default
   settings as they are
4. **Before clicking Deploy**, go to the "Environment Variables" section
   on that same screen and add these three:

   | Name | Value |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the `client_email` field from your JSON key file |
   | `GOOGLE_PRIVATE_KEY` | the `private_key` field from your JSON key file (paste it exactly as shown, including the `-----BEGIN...` and `-----END...` lines) |
   | `STRIDE_LAB_SPREADSHEET_ID` | the long ID in your sheet's URL, between `/d/` and `/edit` |

5. Click Deploy

### Part 4: Confirm it worked

Vercel gives you a URL when the deploy finishes. Open it — you should see
the dashboard load with your real horses. If you see an error message
instead, it'll tell you what's wrong (usually a credential typo) — the
error text is safe to read and won't ever show your actual private key.

### Part 5: Add it to your phone's home screen

- **iPhone (Safari)**: open the URL → tap the Share icon → "Add to Home Screen"
- **Android (Chrome)**: open the URL → tap the ⋮ menu → "Add to Home screen"

It'll appear as a real icon using your logo, opening full-screen without
any browser address bar.

---

## Updating the Dashboard sheet's structure later

If you ever add or rename columns in your Dashboard sheet, the app doesn't
need code changes — `api/dashboard.js` reads whatever headers are actually
in row 1 and passes them straight through. Just make sure the sheet name
stays "Dashboard" and the range in that file (`Dashboard!A1:L1000`) still
covers all your columns and rows — widen it if you add more of either.

## If something doesn't load

Check Vercel's deployment logs (Vercel dashboard → your project → the
specific deployment → "Functions" tab → click `api/dashboard`) — this
shows the exact error from the Google Sheets API, which is almost always
either a credential mismatch or the sheet not being shared with the
service account email.
