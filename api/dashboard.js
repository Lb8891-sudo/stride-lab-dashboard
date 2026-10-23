import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      range: 'Dashboard!A1:L1000',
    });

    const rows = response.data.values;

    // Trainer and age from the Horses tab (for the app's filters)
    const extra = {};
    try {
      const hr = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.STRIDE_LAB_SPREADSHEET_ID, range: 'Horses!A1:Z1000' });
      const hv = hr.data.values || [], hh = (hv[0] || []).map(x => String(x).trim().toLowerCase());
      const iN = hh.indexOf('horse'), iT = hh.indexOf('trainer'), iD = hh.indexOf('d.o.b');
      const year = new Date().getFullYear();
      hv.slice(1).forEach(r => {
        if (!r[iN]) return;
        const m = String(r[iD] || '').match(/(\d{4})$/);
        const born = m ? Number(m[1]) : null;
        extra[String(r[iN]).trim().toLowerCase()] = {
          Trainer: iT > -1 && r[iT] ? String(r[iT]).trim() : null,
          Age: born && born > 1990 && born <= year ? year - born : null,
        };
      });
    } catch (e) { console.error('Horses tab:', e.message); }
    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    const headers = rows[0];
    const horses = rows.slice(1)
      .filter(row => row[0])
      .map(row => {
        const record = {};
        headers.forEach((header, i) => {
          const raw = row[i];
          const num = raw !== undefined && raw !== '' && !isNaN(raw) ? Number(raw) : null;
          record[header] = num !== null ? num : (raw || null);
        });
        Object.assign(record, extra[String(record.Horse || '').trim().toLowerCase()] || {});
        return record;
      });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(horses);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return res.status(500).json({
      error: 'Could not load dashboard data',
      detail: error.message,
    });
  }
}
