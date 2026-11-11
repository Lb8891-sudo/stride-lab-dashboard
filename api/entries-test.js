// Test page: what does our Racing API plan return for the next five days,
// for the trainers on the 5-day entry sheets? Open /api/entries-test in a browser.
export const config = { maxDuration: 60 };
const BASE = 'https://api.theracingapi.com/v1';
const wait = ms => new Promise(r => setTimeout(r, ms));
const TRAINERS = ['George Scott', 'Rix'];

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function call(path, auth) {
  try {
    const r = await fetch(BASE + path, { headers: { Authorization: auth } });
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, body, text: body ? '' : text.slice(0, 200) };
  } catch (e) {
    return { status: 0, body: null, text: String(e).slice(0, 200) };
  }
}

function summarise(res) {
  const cards = (res.body && (res.body.racecards || res.body.races || res.body.results)) || [];
  const dates = new Set(), found = [];
  let runners = 0;
  for (const c of cards) {
    if (c.date) dates.add(c.date);
    for (const r of c.runners || []) {
      runners++;
      const t = r.trainer || '';
      if (TRAINERS.some(x => t.toLowerCase().includes(x.toLowerCase()))) {
        found.push({ date: c.date, time: c.off_time || c.time || '', course: c.course, race: c.race_name || '', horse: r.horse, trainer: t, jockey: r.jockey || '' });
      }
    }
  }
  return { races: cards.length, runners, dates: [...dates].sort(), found };
}

export default async function handler(req, res) {
  const user = process.env.RACING_API_USERNAME, pass = process.env.RACING_API_PASSWORD;
  if (!user || !pass) {
    res.status(500).send('Add RACING_API_USERNAME and RACING_API_PASSWORD in Vercel settings, then redeploy.');
    return;
  }
  const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

  const today = new Date();
  const days = [...Array(6)].map((_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return ymd(d); });
  const tests = [
    ['Free · today', '/racecards/free?day=today'],
    ['Free · tomorrow', '/racecards/free?day=tomorrow'],
    ['Basic · today', '/racecards/basic?day=today'],
    ['Basic · tomorrow', '/racecards/basic?day=tomorrow'],
    ['Standard · tomorrow', '/racecards/standard?day=tomorrow'],
    ...days.slice(2).map(d => [`Pro · ${d}`, `/racecards/pro?date=${d}`]),
    ...days.slice(2).map(d => [`Summaries · ${d}`, `/racecards/summaries?date=${d}`]),
    ['Big races', '/racecards/big-races'],
  ];

  const rows = [];
  for (const [label, path] of tests) {
    const r = await call(path, auth);
    await wait(550); // stay under the API's rate limit
    const s = r.status === 200 ? summarise(r) : null;
    rows.push({ label, path, status: r.status, error: r.status === 200 ? '' : (r.body && (r.body.detail || r.body.message || r.body.error)) || r.text, ...s });
  }

  if (req.query.format === 'json') { res.status(200).json(rows); return; }

  const ok = rows.filter(r => r.status === 200);
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Entries test</title>
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#111;background:#fafafa}table{border-collapse:collapse;width:100%;font-size:14px;margin:10px 0 24px}td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}.bad{color:#b00020}.ok{color:#0a7a3d}h2{margin-top:28px}</style>
<h1>Racing API test · ${esc(days[0])}</h1>
<p>Trainers: ${TRAINERS.map(esc).join(', ')}</p>
<h2>What each endpoint returned</h2>
<table><tr><th>Endpoint</th><th>Result</th><th>Races</th><th>Dates covered</th><th>Our horses</th></tr>
${rows.map(r => `<tr><td>${esc(r.label)}</td><td class="${r.status === 200 ? 'ok' : 'bad'}">${r.status === 200 ? 'OK' : esc(r.status + ' ' + (r.error || ''))}</td><td>${r.races ?? ''}</td><td>${esc((r.dates || []).join(', '))}</td><td>${r.found ? r.found.length : ''}</td></tr>`).join('')}
</table>
<h2>Our horses found</h2>
${ok.some(r => r.found.length) ? ok.filter(r => r.found.length).map(r => `<h3>${esc(r.label)}</h3><table><tr><th>Date</th><th>Time</th><th>Course</th><th>Horse</th><th>Trainer</th><th>Jockey</th><th>Race</th></tr>${r.found.map(f => `<tr><td>${esc(f.date)}</td><td>${esc(f.time)}</td><td>${esc(f.course)}</td><td>${esc(f.horse)}</td><td>${esc(f.trainer)}</td><td>${esc(f.jockey)}</td><td>${esc(f.race)}</td></tr>`).join('')}</table>`).join('') : '<p>None found on any endpoint.</p>'}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
