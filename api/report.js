import { google } from 'googleapis';

// Returns one horse's live report (built nightly by the Stride Lab script into the "Horse Reports" tab).
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const name = String(req.query.horse || '').trim();
  if (!name) return res.status(400).json({ error: 'Which horse?' });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.STRIDE_LAB_SPREADSHEET_ID,
      range: "'Horse Reports'!A1:G2000",
    });
    const rows = response.data.values || [];
    const head = (rows[0] || []).map(h => String(h).trim());
    const iH = head.indexOf('Horse'), iR = head.indexOf('Report');
    const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
    const row = rows.slice(1).find(r => norm(r[iH]) === norm(name));
    if (!row || !row[iR]) return res.status(404).json({ error: 'No report yet for ' + name + '. Reports are rebuilt after each nightly run.' });

    const report = JSON.parse(row[iR]);
    // Add the Stride Lab Rating from the Dashboard tab (the same figure as the app's table).
    try {
      const dash = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.STRIDE_LAB_SPREADSHEET_ID, range: 'Dashboard!A1:L1000' });
      const dr = dash.data.values || [];
      const dh = (dr[0] || []).map(h => String(h).trim());
      const iDH = dh.indexOf('Horse'), iSLR = dh.indexOf('Stride Lab Rating');
      const d = dr.slice(1).find(r => norm(r[iDH]) === norm(name));
      const slr = d && d[iSLR] !== undefined && d[iSLR] !== '' ? Number(d[iSLR]) : NaN;
      report.v = report.v || {};
      if (!report.v.slr && isFinite(slr)) { report.v.slr = slr.toFixed(1); report.v.slr_note = 'Our overall rating'; }
    } catch (e) { console.error('Stride Lab Rating not added:', e.message); }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(report);
  } catch (error) {
    if (/Unable to parse range/i.test(error.message || '')) {
      return res.status(404).json({ error: 'Horse reports aren\'t switched on yet. Paste the latest Stride Lab script, then run StrideLab → Set-up and maintenance → Rebuild horse reports now.' });
    }
    console.error('Failed to load report:', error);
    return res.status(500).json({ error: 'Could not load the report', detail: error.message });
  }
}
