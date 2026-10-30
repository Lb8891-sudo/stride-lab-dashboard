import { readSession, readRanges, norm } from './_bslib.js';

// One read-only data route. ?view=stallions | nicks | horses | shortlists
const REG = 'Nancy Horse Register!A2:R';        // Key, Horse, Sire, Dam, Damsire, Source, First Seen, Last Run, Runs, Wins,
                                                 // Best Black-Type Win, Highest OR, Latest OR, Priced Runs, Priced Wins, Expected Wins, Trainer, First Age
const BASE = 'Nicks Baseline!A2:H';              // Sire, Damsire, Damsire's Sire, Runners, Winners, BT Winners, Best Horse, Copied On
const CACHE = 'Sire Data Cache!A2:B';
const GOING = 'Sire Going!A1:Q';
const SHORT = 'Sale Shortlists!A1:N';
const BT = { '': 0, 'Listed': 1, 'Group 3': 2, 'Group 2': 3, 'Group 1': 4 };
const num = x => { const n = parseFloat(String(x ?? '').replace(/,/g, '')); return isNaN(n) ? 0 : n; };

function horseRow(r) {
  return {
    horse: r[1] || '', sire: r[2] || '', dam: r[3] || '', damsire: r[4] || '',
    lastRun: r[7] || '', runs: num(r[8]), wins: num(r[9]), bt: r[10] || '',
    highOR: num(r[11]) || null, latestOR: num(r[12]) || null, trainer: r[16] || '',
  };
}

async function stallions() {
  const [cache, going] = await readRanges([CACHE, GOING]);
  const gh = (going[0] || []).map(h => String(h).trim().toLowerCase());
  const iView = gh.indexOf('our view');
  const view = {};
  going.slice(1).forEach(r => { if (r[0]) view[norm(r[0])] = iView > -1 ? r[iView] || '' : ''; });
  return cache.filter(r => r[0] && r[1]).map(r => {
    let o = {};
    try { o = JSON.parse(r[1]); } catch { /* skip bad rows */ }
    const years = (o.years || []).map(y => ({
      year: y[0], runners: num(y[1]), winners: num(y[2]), pct: num(y[3]),
      groupW: num(y[4]), groupH: num(y[5]), btW: num(y[6]), btH: num(y[7]), btPct: num(y[8]),
    })).sort((a, b) => String(b.year).localeCompare(String(a.year)));
    const t = years.reduce((a, y) => ({ runners: a.runners + y.runners, winners: a.winners + y.winners, btH: a.btH + y.btH, groupH: a.groupH + y.groupH }),
      { runners: 0, winners: 0, btH: 0, groupH: 0 });
    return {
      name: o.sire || r[0], born: o.born || '', sireOfSire: o.sos || '', dam: o.dam || '', damsire: o.damsire || '',
      ground: view[norm(o.sire || r[0])] || '', years,
      totals: { ...t, pct: t.runners ? Math.round(t.winners / t.runners * 1000) / 10 : 0 },
      career: o.hasTotals ? { runs: o.runs, wins: o.wins, btWins: o.btWins, grWins: o.grWins, avgWinDist: o.awd, twoYoPct: o.twoYo } : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function nicks(sire, damsire) {
  const [reg, base] = await readRanges([REG, BASE]);
  const s = norm(sire), d = norm(damsire);
  const ours = {};
  reg.forEach(r => {
    if (!r[1] || !r[2] || !r[4]) return;
    if (s && norm(r[2]) !== s) return;
    if (d && norm(r[4]) !== d) return;
    const k = norm(r[2]) + '|' + norm(r[4]);
    const h = horseRow(r);
    const c = ours[k] || (ours[k] = { sire: r[2], damsire: r[4], runners: 0, winners: 0, btWinners: 0, best: null, horses: [] });
    c.runners++; if (h.wins > 0) c.winners++; if (BT[h.bt] > 0) c.btWinners++;
    const score = BT[h.bt] * 1000 + (h.highOR || 0);
    if (!c.best || score > c.best.score) c.best = { horse: h.horse, bt: h.bt, highOR: h.highOR, score };
    c.horses.push(h);
  });
  const guide = base.filter(r => r[0] && (!s || norm(r[0]) === s) && (!d || norm(r[1]) === d)).map(r => ({
    sire: r[0], damsire: r[1], damsiresSire: r[2] || '', runners: num(r[3]), winners: num(r[4]), btWinners: num(r[5]), best: r[6] || '',
  }));
  const crosses = Object.values(ours).map(c => ({ ...c, best: c.best && { horse: c.best.horse, bt: c.best.bt, highOR: c.best.highOR },
    horses: c.horses.sort((a, b) => (BT[b.bt] - BT[a.bt]) || ((b.highOR || 0) - (a.highOR || 0))).slice(0, 25) }))
    .sort((a, b) => b.btWinners - a.btWinners || b.winners - a.winners || b.runners - a.runners);
  guide.sort((a, b) => b.btWinners - a.btWinners || b.winners - a.winners);
  return { ours: crosses.slice(0, 200), guide: guide.slice(0, 200) };
}

async function horses(q) {
  const [reg] = await readRanges([REG]);
  const t = norm(q);
  if (t.length < 2) return [];
  const out = [];
  for (const r of reg) {
    if (!r[1]) continue;
    const name = norm(r[1]);
    const hit = name.startsWith(t) ? 3 : name.includes(t) ? 2 : [r[2], r[3], r[4]].some(x => norm(x) === t) ? 1 : 0;
    if (hit) out.push({ ...horseRow(r), hit });
  }
  return out.sort((a, b) => b.hit - a.hit || (BT[b.bt] - BT[a.bt]) || ((b.highOR || 0) - (a.highOR || 0))).slice(0, 60);
}

async function shortlists() {
  const [rows] = await readRanges([SHORT], 60 * 1000);
  const head = (rows[0] || []).map(h => String(h).trim());
  return rows.slice(1).filter(r => r.some(Boolean)).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] || ''])));
}

export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Please sign in.' });
  try {
    const v = String(req.query.view || '');
    let data;
    if (v === 'stallions') data = await stallions();
    else if (v === 'nicks') data = await nicks(req.query.sire, req.query.damsire);
    else if (v === 'horses') data = await horses(req.query.q);
    else if (v === 'shortlists') data = await shortlists();
    else return res.status(400).json({ error: 'Unknown view' });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Could not read the sheet', detail: e.message });
  }
}
