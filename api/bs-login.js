import { makeToken, sessionCookie, clearCookie, samePassword, readSession, readRanges } from './_bslib.js';

// The password lives in the Stride Lab sheet: Settings tab, cell AE1 (label in AD1).
// Change it there; the app picks the new one up within a minute.
async function ownerPassword() {
  if (process.env.APP_PASSWORD) return process.env.APP_PASSWORD;
  const [v] = await readRanges(['Settings!AE1'], 60 * 1000);
  return String((v[0] || [])[0] || '').trim();
}

// POST {password} signs in; DELETE signs out; GET says who is signed in.
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const s = readSession(req);
      return res.status(200).json(s ? { signedIn: true, role: s.role } : { signedIn: false });
    }
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearCookie());
      return res.status(200).json({ signedIn: false });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const owner = await ownerPassword();
    if (!owner) return res.status(500).json({ error: 'No password set yet: type one in the Stride Lab sheet, Settings tab, cell AE1.' });

    // Slow down guessing
    await new Promise(r => setTimeout(r, 400));
    if (!samePassword(body.password, owner)) return res.status(401).json({ error: 'That password is not right.' });

    res.setHeader('Set-Cookie', sessionCookie(makeToken('owner')));
    return res.status(200).json({ signedIn: true, role: 'owner' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
