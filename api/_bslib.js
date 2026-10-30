// Shared helpers for the Bloodstock app: sign-in checks and reading the Stride Lab sheet.
// Files starting with "_" are not served by Vercel as pages.
import crypto from 'crypto';
import { google } from 'googleapis';

const COOKIE = 'slb_session';
const DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET || ('bs|' + (process.env.GOOGLE_PRIVATE_KEY || ''));
  if (!s || s.length < 40) throw new Error('No signing secret available');
  return s;
}

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

// role: "owner" sees everything; "client" (stage two) will see conclusions only
export function makeToken(role, name) {
  const payload = Buffer.from(JSON.stringify({ role, name: name || '', exp: Date.now() + DAYS * 86400000 })).toString('base64url');
  return payload + '.' + sign(payload);
}

export function readSession(req) {
  const raw = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS * 86400}`;
}
export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function samePassword(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

// ---- Sheet access (read-only) ----
let sheetsClient = null;
function sheets() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

// Small in-memory cache so repeated searches don't re-read the sheet every time
const cache = {};
export async function readRanges(ranges, maxAgeMs = 10 * 60 * 1000) {
  const key = ranges.join('|');
  const hit = cache[key];
  if (hit && Date.now() - hit.t < maxAgeMs) return hit.v;
  const res = await sheets().spreadsheets.values.batchGet({
    spreadsheetId: process.env.STRIDE_LAB_SPREADSHEET_ID,
    ranges,
  });
  const v = (res.data.valueRanges || []).map(r => r.values || []);
  cache[key] = { t: Date.now(), v };
  return v;
}

export const norm = s => String(s || '').toLowerCase()
  .replace(/\s*\((?:[a-z]{2,3})\)\s*$/i, '')   // drop country suffix like (IRE)
  .replace(/[^a-z0-9]+/g, ' ').trim();
