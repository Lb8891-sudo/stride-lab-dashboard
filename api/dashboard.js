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
