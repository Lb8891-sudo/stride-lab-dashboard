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

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(JSON.parse(row[iR]));
  } catch (error) {
    console.error('Failed to load report:', error);
    return res.status(500).json({ error: 'Could not load the report', detail: error.message });
  }
}
