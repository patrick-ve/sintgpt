// SintGPT analytics dashboard: runs in the browser on the counts that
// scripts/analytics-dashboard.ts embeds. No network requests.
(() => {
  'use strict';

  const DATA = JSON.parse(document.getElementById('data').textContent);
  const TZ = 'Europe/Amsterdam';
  const HOUR = 3600000;
  const DAY = 24 * HOUR;

  // ------------------------------------------------------------ rows
  const MEASURES = ['n', 'lines', 'cost', 'amount', 'first', 'total', 'v'];
  const DIMS = Object.keys(DATA.dims);

  const partsFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
  });
  const hourCache = new Map();
  /** The Dutch date and hour of an hour that starts at `ms`. */
  function hourInfo(ms) {
    let info = hourCache.get(ms);
    if (!info) {
      const p = {};
      for (const part of partsFormat.formatToParts(new Date(ms))) p[part.type] = part.value;
      info = { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
      hourCache.set(ms, info);
    }
    return info;
  }

  const ROWS = [];
  for (let i = 0; i < DATA.rows; i++) {
    const row = {};
    for (const key of DIMS) row[key] = DATA.dims[key][DATA.cols[key][i]];
    for (const key of MEASURES) row[key] = DATA.cols[key][i];
    row.ms = DATA.start + DATA.cols.h[i] * HOUR;
    row.day = hourInfo(row.ms).day;
    ROWS.push(row);
  }
  const firstDataMs = ROWS.length ? Math.min(...ROWS.map(row => row.ms)) : null;

  // ------------------------------------------------------------ formatting
  const nf0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });
  const eurFormat = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
  const usdFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usd4 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const int = value => nf0.format(value);
  const pct = (value) => {
    if (value === null || !Number.isFinite(value)) return '–';
    const digits = value > 0 && value < 0.1 ? 1 : 0;
    return `${(value * 100).toFixed(digits)}%`;
  };
  const share = (part, whole) => (whole > 0 ? pct(part / whole) : '');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const dayLabel = key => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const dayLong = key => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  const hh = ms => `${String(hourInfo(ms).hour).padStart(2, '0')}:00`;
  const when = ms => new Date(ms).toLocaleString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const regionNames = (() => {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
  })();
  const flag = code => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0))) : '');
  const countryName = (code) => {
    if (!code) return 'Unknown';
    let name = code;
    try { name = regionNames?.of(code) ?? code; } catch { /* keep the code */ }
    return `${flag(code)} ${name}`;
  };

  // ------------------------------------------------------------ periods
  const now = DATA.generatedAt;
  const nowHour = Math.floor(now / HOUR) * HOUR;
  const dutchMidnightBefore = (ms) => {
    let t = Math.floor(ms / HOUR) * HOUR;
    while (hourInfo(t).hour !== 0) t -= HOUR;
    return t;
  };
  const todayStart = dutchMidnightBefore(nowHour);
  const todayKey = hourInfo(nowHour).day;
  const addDays = (key, n) => {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + n);
    return date.toISOString().slice(0, 10);
  };
  const hours = (from, count) => Array.from({ length: count }, (_, i) => from + i * HOUR);
  const days = (lastKey, count) => Array.from({ length: count }, (_, i) => addDays(lastKey, i - count + 1));

  const hourBuckets = list => list.map(ms => ({ key: ms, axis: hh(ms), tip: `${dayLong(hourInfo(ms).day)}, ${hh(ms)}–${hh(ms + HOUR)}` }));
  const dayBuckets = list => list.map(key => ({ key, axis: dayLabel(key), tip: dayLong(key) }));

  const PERIODS = [
    { id: 'today', label: 'Today', key: 't' },
    { id: 'yesterday', label: 'Yesterday', key: 'y' },
    { id: '24h', label: '24 hours', key: 'd' },
    { id: '7d', label: '7 days', key: 'w' },
    { id: '30d', label: '30 days', key: 'm' },
    { id: 'all', label: 'All', key: 'a' },
  ];
  // A custom number of days from the command line gets its own button.
  if (/^\d+d$/.test(DATA.period) && !PERIODS.some(p => p.id === DATA.period)) {
    PERIODS.splice(PERIODS.length - 1, 0, { id: DATA.period, label: `${parseInt(DATA.period, 10)} days` });
  }

  function resolvePeriod(id) {
    if (id === 'today') {
      const cur = hours(todayStart, (nowHour - todayStart) / HOUR + 1);
      return { hourly: true, live: true, title: 'Today', cur: hourBuckets(cur), prev: hourBuckets(cur.map(t => t - DAY)), prevName: 'Yesterday' };
    }
    if (id === 'yesterday') {
      const start = dutchMidnightBefore(todayStart - HOUR);
      const cur = hours(start, (todayStart - start) / HOUR);
      return { hourly: true, live: false, title: 'Yesterday', cur: hourBuckets(cur), prev: hourBuckets(cur.map(t => t - DAY)), prevName: 'Day before' };
    }
    if (id === '24h') {
      const cur = hours(nowHour - 23 * HOUR, 24);
      return { hourly: true, live: true, title: 'Last 24 hours', cur: hourBuckets(cur), prev: hourBuckets(cur.map(t => t - DAY)), prevName: '24 hours before' };
    }
    if (id === 'all') {
      const first = firstDataMs === null ? todayKey : hourInfo(firstDataMs).day;
      let count = 1;
      while (addDays(first, count - 1) < todayKey) count++;
      if (count <= 2) {
        const start = dutchMidnightBefore(firstDataMs ?? nowHour);
        const cur = hours(start, (nowHour - start) / HOUR + 1);
        return { hourly: true, live: true, title: 'All data', cur: hourBuckets(cur), prev: null };
      }
      return { hourly: false, live: true, title: 'All data', cur: dayBuckets(days(todayKey, count)), prev: null };
    }
    const n = Math.max(1, parseInt(id, 10) || 7);
    const cur = days(todayKey, n);
    return { hourly: false, live: true, title: `Last ${n} days`, cur: dayBuckets(cur), prev: dayBuckets(cur.map(k => addDays(k, -n))), prevName: `${n} days before` };
  }

  // ------------------------------------------------------------ state
  const state = {
    period: PERIODS.some(p => p.id === DATA.period) ? DATA.period : '7d',
    compare: true,
    metric: 'views',
    country: null,
    tabs: {},
  };
  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.has('period') && PERIODS.some(p => p.id === params.get('period'))) state.period = params.get('period');
    if (params.has('compare')) state.compare = params.get('compare') !== '0';
    if (params.has('metric')) state.metric = params.get('metric');
    state.country = params.get('country') || null;
  }
  function writeHash() {
    const params = new URLSearchParams();
    params.set('period', state.period);
    if (!state.compare) params.set('compare', '0');
    if (state.metric !== 'views') params.set('metric', state.metric);
    if (state.country !== null) params.set('country', state.country);
    history.replaceState(null, '', `#${params}`);
  }

  // ------------------------------------------------------------ metrics
  const POEM = new Set(['Generate poem', 'Regenerate poem']);
  const METRICS = [
    { id: 'views', whole: true, label: 'Page views', value: r => (r.e === 'Page view' ? r.n : 0), format: int, axis: v => compact.format(v) },
    { id: 'poems', whole: true, label: 'Poems', value: r => (POEM.has(r.e) ? r.n : 0), format: int, axis: v => compact.format(v) },
    { id: 'checkouts', whole: true, label: 'Checkouts', value: r => (r.e === 'Proceed to payment' ? r.n : 0), format: int, axis: v => compact.format(v) },
    { id: 'payments', whole: true, label: 'Payments', value: r => (r.e === 'Payment verified' ? r.n : 0), format: int, axis: v => compact.format(v) },
    { id: 'revenue', label: 'Revenue', value: r => (r.e === 'Payment webhook' && r.detail === 'payment.succeeded' ? r.amount : 0), format: v => eurFormat.format(v), axis: v => `€${compact.format(v)}` },
    { id: 'conversion', label: 'Conversion', ratio: ['payments', 'views'], format: pct, axis: v => pct(v), points: true },
    { id: 'cost', label: 'AI cost', value: r => (POEM.has(r.e) || r.e === 'Surprise ideas' ? r.cost : 0), format: v => usdFormat.format(v), axis: v => `$${compact.format(v)}`, neutral: true },
  ];
  const metricById = id => METRICS.find(m => m.id === id) ?? METRICS[0];

  // ------------------------------------------------------------ data for the current view
  let view = null;

  function compute() {
    const period = resolvePeriod(state.period);
    const index = list => new Map(list.map((bucket, i) => [bucket.key, i]));
    const curIndex = index(period.cur);
    const prevIndex = period.prev ? index(period.prev) : new Map();
    const cur = [];
    const prev = [];
    const curBucket = [];
    const prevBucket = [];
    for (const row of ROWS) {
      if (state.country !== null && row.country !== state.country) continue;
      const key = period.hourly ? row.ms : row.day;
      const i = curIndex.get(key);
      if (i !== undefined) { cur.push(row); curBucket.push(i); continue; }
      const j = prevIndex.get(key);
      if (j !== undefined) { prev.push(row); prevBucket.push(j); }
    }

    const series = {};
    for (const metric of METRICS) {
      if (metric.ratio) continue;
      const a = new Array(period.cur.length).fill(0);
      const b = period.prev ? new Array(period.prev.length).fill(0) : null;
      cur.forEach((row, k) => { a[curBucket[k]] += metric.value(row); });
      if (b) prev.forEach((row, k) => { b[prevBucket[k]] += metric.value(row); });
      series[metric.id] = { cur: a, prev: b, total: sum(a), prevTotal: b ? sum(b) : null };
    }
    for (const metric of METRICS) {
      if (!metric.ratio) continue;
      const [top, bottom] = metric.ratio.map(id => series[id]);
      const ratio = (x, y) => (y > 0 ? x / y : null);
      series[metric.id] = {
        cur: top.cur.map((x, i) => ratio(x, bottom.cur[i])),
        prev: top.prev ? top.prev.map((x, i) => ratio(x, bottom.prev[i])) : null,
        total: ratio(top.total, bottom.total),
        prevTotal: top.prev ? ratio(top.prevTotal, bottom.prevTotal) : null,
      };
    }
    view = { period, cur, prev, series };
  }

  const sum = list => list.reduce((total, x) => total + (x ?? 0), 0);
  const count = (rows, event) => rows.reduce((total, r) => total + (r.e === event ? r.n : 0), 0);
  /** Adds up `n` (or `measure`) per label for the rows that pass `filter`. */
  function group(rows, filter, label, measure = 'n') {
    const totals = new Map();
    for (const row of rows) {
      if (!filter(row)) continue;
      const key = label(row);
      totals.set(key, (totals.get(key) ?? 0) + row[measure]);
    }
    return [...totals].map(([key, n]) => ({ label: key, n })).sort((a, b) => b.n - a.n);
  }
  const byDetail = (rows, event, prefix = '') => group(rows, r => r.e === event, r => `${prefix}${r.detail || '(none)'}`);
  const eventItems = (rows, events) => events.map(event => ({ label: event, n: count(rows, event) }));

  // ------------------------------------------------------------ emojis
  // Decoration only: every emoji sits next to its text and is aria-hidden.
  const EVENT_EMOJI = {
    'Generate poem': '📝', 'Regenerate poem': '🔁', 'Poem generation failed': '💥', 'Rate limited': '🚦',
    'Proceed to payment': '🛒', 'Payments unavailable': '🚫', 'Poem aborted': '🏃', 'Payment verified': '✅',
    'Payment webhook': '🪝', 'Surprise ideas': '💡', 'Surprise ideas failed': '🫥', 'Gift claimed': '🎁',
    'Page view': '👀', 'Form started': '✏️', 'Form refused': '⛔', 'No poems left': '🚧', 'Poem ready': '📜', 'Rate poem': '👍',
    'Edit poem': '✂️', 'Poem stream failed': '📡', 'Open poem from history': '📖', 'Open history': '📚',
    'Delete poem': '🗑️', 'Clear history': '🧹', 'Switch language': '🌐', 'Payment succeeded': '💳',
    'Payment returned': '↩️', 'Access restored': '🔓', 'Restore failed': '🔒', 'Show payment modal': '💶',
    'Close payment modal': '❌', 'Continue after payment': '▶️', 'Go to poem form': '👉', 'Contact': '✉️',
    'PDF failed': '🧾', 'Copy failed': '📋', 'Copy share link': '🔗', 'Copy to clipboard': '📋',
    'Save as PDF': '📄', 'Shared via WhatsApp': '💬', 'Shared via Email': '📧', 'Shared via Facebook': '👥', 'Shared via share sheet': '📤',
    'Open shared poem': '📨', 'Shared poem to form': '↪️', 'Scroll to poem form': '🖱️', 'Scroll to FAQ': '❓',
    'Play video': '🎬', 'Show example': '🔍', 'Draw lootjes': '🎟️', 'Show surprise ideas': '🎉', 'Open devtools': '🕵️',
  };
  const LABEL_EMOJI = {
    // styles, languages, plans
    'funny': '😄', 'classic': '📜', 'ironic': '😏', 'old-fashioned': '🎩', 'spicy': '🌶️', 'roast': '🔥',
    'dutch': '🇳🇱', 'english': '🇬🇧', 'Dutch': '🇳🇱', 'English': '🇬🇧',
    'free': '🆓', 'paid': '💶', 'of which rewrites': '🔁', 'with a wish': '💬', 'without a wish': '🔁',
    // form use
    'empty': '⚪', 'short': '🔹', 'long': '🔷', 'none': '➖', 'named': '🏷️', 'secret': '🤫', 'yes': '✅', 'no': '➖',
    // reasons and window details
    'limit': '🚧', 'credits': '🎟️', 'debounce': '⏱️', 'fair-use': '⚖️', 'tier': '🔐',
    'submit': '✏️', 'rewrite': '🔁', 'surprise': '🎉', 'design': '📄',
    'button': '❌', 'backdrop': '🖱️', 'escape': '⌨️', 'continue free': '🆓',
    // tiers rows and results
    'Checkouts started': '🛒', 'Payments verified': '✅', 'Poems written': '📝',
    'Payment succeeded (browser)': '💳', 'Payment verified (server)': '✅', 'from a shared poem': '↪️',
    // PDF designs
    'perkament': '🪶', 'pakjesavond': '🌙', 'cadeaupapier': '🎁', 'schoolschrift': '📓', 'goudfolie': '✨', 'stoomboot': '🚢',
    // pages
    '/': '🏠', '/blog': '📰', '/lootjes': '🎟️', '/voorbeelden': '📚', '/gedicht': '📨', '/g/:id': '📨',
    '/privacy': '🔒', '/voorwaarden': '📃',
  };
  const PREFIX_EMOJI = [
    ['link: ', '👉'], ['scroll: ', '🖱️'], ['verified via: ', '✅'], ['returned: ', '↩️'], ['restore failed: ', '🔒'],
    ['gift: ', '🎁'], ['surprise ideas: ', '🎉'], ['language: ', '🌐'], ['poem no. ', '📜'],
    ['/blog/', '📰'], ['before', '⏳'], ['during', '✂️'],
  ];
  const GROUP_EMOJI = {
    'Good': '👍', 'Not good': '👎', 'Rewrites': '🔁', 'Payments': '💶', 'Access': '🔑', 'Payments unavailable': '🚫',
    '3 gedichten': '3️⃣', 'Gezin': '👨‍👩‍👧', 'Hele familie': '👨‍👩‍👧‍👦',
    'Fun facts': '💡', 'Present': '🎁', 'Written by': '✍️', 'Audience': '👥',
    'Rate limited': '🚦', 'Poem aborted (visitor left)': '🏃', 'Generation failed': '💥', 'Stream failed': '📡',
    'Other': '⚠️', 'Form refused': '⛔', 'No poems left': '🚧',
  };
  const METRIC_EMOJI = { views: '👀', poems: '📝', checkouts: '🛒', payments: '✅', revenue: '💶', conversion: '🎯', cost: '🤖' };
  const PANEL_EMOJI = { sources: '🧭', pages: '📄', countries: '🌍', poems: '📜', payments: '💶', engagement: '✨' };
  const STAT_EMOJI = { 'Seconds to first text': '⏱️', 'Seconds per poem': '⌛', 'Failed poems': '💥', 'Rate limited': '🚦' };

  const emoji = value => (value ? `<span class="emoji" aria-hidden="true">${value}</span>` : '');
  function labelEmoji(label) {
    const text = String(label);
    if (LABEL_EMOJI[text]) return LABEL_EMOJI[text];
    if (EVENT_EMOJI[text]) return EVENT_EMOJI[text];
    if (text.endsWith(' people')) return '🎟️';
    if (/^payment\.succeeded/.test(text)) return '✅';
    if (/^refund\./.test(text)) return '↩️';
    if (/^dispute\./.test(text)) return '⚖️';
    if (/^payment\.(failed|cancelled)/.test(text)) return '❌';
    if (/^payment\./.test(text)) return '⏳';
    // "example: funny" shows the style; other prefixes show their own emoji.
    if (text.startsWith('example: ')) return LABEL_EMOJI[text.slice(9)] ?? '🔍';
    return PREFIX_EMOJI.find(([start]) => text.startsWith(start))?.[1] ?? '';
  }

  // ------------------------------------------------------------ icons
  const ICON = {
    up: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9 7.5H1z" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1 2.5h8z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    theme: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor"/></svg>',
  };

  function deltaHtml(metric, cur, prev) {
    if (prev === null || prev === undefined || cur === null) return '';
    if (metric.points) {
      const diff = (cur - prev) * 100;
      if (Math.abs(diff) < 0.05) return `<span class="delta flat">0 pp<span class="sr-only"> change</span></span>`;
      const up = diff > 0;
      return `<span class="delta ${up ? 'good' : 'bad'}">${up ? ICON.up : ICON.down}${nf1.format(Math.abs(diff))} pp<span class="sr-only"> ${up ? 'up' : 'down'} from the previous period</span></span>`;
    }
    if (prev === 0 && cur === 0) return '<span class="delta flat">–<span class="sr-only">no change</span></span>';
    if (prev === 0) return '<span class="delta flat">new<span class="sr-only"> in this period</span></span>';
    const change = (cur - prev) / prev;
    if (Math.abs(change) < 0.005) return '<span class="delta flat">0%<span class="sr-only"> change</span></span>';
    const up = change > 0;
    const tone = metric.neutral ? 'flat' : up ? 'good' : 'bad';
    return `<span class="delta ${tone}">${up ? ICON.up : ICON.down}${pct(Math.abs(change))}<span class="sr-only"> ${up ? 'up' : 'down'} from the previous period</span></span>`;
  }

  // ------------------------------------------------------------ shell
  const app = document.getElementById('app');

  function shell() {
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true">S</span>
            <span class="brand-name">SintGPT</span>
            <span class="brand-sub">Analytics</span>
          </div>
          <div class="controls">
            <div class="segmented" role="group" aria-label="Period">
              ${PERIODS.map(p => `<button type="button" data-period="${p.id}" aria-pressed="false"${p.key ? ` aria-keyshortcuts="${p.key}" title="${esc(p.label)} (${p.key.toUpperCase()})"` : ''}>${esc(p.label)}</button>`).join('')}
            </div>
            <button type="button" class="toggle" id="compare" aria-pressed="true" aria-keyshortcuts="c" title="Compare with the period before (C)">
              <span class="switch" aria-hidden="true"></span>Compare
            </button>
            <button type="button" class="icon-button" id="theme" aria-label="Theme: system">${ICON.theme}</button>
          </div>
        </div>
      </header>
      <main>
        <div class="meta" id="meta"></div>
        <div id="alert"></div>
        <section class="panel overview" aria-labelledby="chart-title">
          <div class="kpis" id="kpis" role="group" aria-label="Metrics; choose one for the chart"></div>
          <div class="chart-wrap">
            <div class="chart-head">
              <h2 class="chart-title" id="chart-title"></h2>
              <div class="legend" id="legend"></div>
            </div>
            <div class="chart" id="chart" tabindex="0" role="img"></div>
            <details class="table-toggle"><summary>Show as table</summary><div class="table-scroll" id="chart-table"></div></details>
          </div>
        </section>
        <div class="grid">
          <section class="panel wide" aria-labelledby="funnel-title">
            <div class="panel-head"><h2 class="panel-title" id="funnel-title"><span class="emoji" aria-hidden="true">🔻</span>Funnel: from visit to payment</h2></div>
            <div class="panel-body" id="funnel"></div>
          </section>
          ${PANELS.map(panelShell).join('')}
          <section class="panel" aria-labelledby="problems-title">
            <div class="panel-head"><h2 class="panel-title" id="problems-title"><span class="emoji" aria-hidden="true">🩺</span>Health</h2></div>
            <div class="panel-body" id="problems"></div>
          </section>
          <section class="panel wide" aria-labelledby="events-title">
            <div class="panel-head">
              <h2 class="panel-title" id="events-title"><span class="emoji" aria-hidden="true">📋</span>All events</h2>
              <label class="sr-only" for="event-search">Search events</label>
              <input class="search" id="event-search" type="search" placeholder="Search events or details" autocomplete="off">
            </div>
            <div class="panel-body" id="events"></div>
          </section>
        </div>
        <footer>
          <p>Counts from Workers Analytics Engine (dataset sintgpt_events), weighted with the sample interval. Times are Dutch time.</p>
          <p>There are no visitor IDs, so these are events, not people. Test visits (such as referrer "smoke-test") are included. Run <code>npm run analytics</code> to refresh.</p>
          <p>Keys: <kbd>T</kbd> today, <kbd>Y</kbd> yesterday, <kbd>D</kbd> 24 hours, <kbd>W</kbd> 7 days, <kbd>M</kbd> 30 days, <kbd>A</kbd> all, <kbd>C</kbd> compare, <kbd>←</kbd> <kbd>→</kbd> in the chart.</p>
        </footer>
      </main>
      <div class="tooltip" id="tooltip" role="tooltip" hidden></div>`;
    app.removeAttribute('aria-busy');
  }

  // ------------------------------------------------------------ panels with tabs
  const country = r => r.country;
  const PANELS = [
    {
      id: 'sources', title: 'Sources',
      tabs: [
        { id: 'referrers', label: 'Referrers', column: 'Visits', note: 'Referring domain of the first page view in a visit. Visits without a referrer are not listed.',
          items: rows => group(rows, r => r.e === 'Page view' && r.detail !== '', r => r.detail) },
        { id: 'campaigns', label: 'Campaigns', column: 'Visits', note: 'From utm tags in the address of the first page.',
          items: rows => group(rows, r => r.e === 'Page view' && r.src !== '', r => [r.src, r.med, r.camp].filter(Boolean).join(' / ')) },
        { id: 'ways', label: 'Ways to the form', column: 'Clicks',
          items: rows => [...byDetail(rows, 'Go to poem form', 'link: '), ...byDetail(rows, 'Scroll to poem form', 'scroll: '), { label: 'from a shared poem', n: count(rows, 'Shared poem to form') }] },
      ],
    },
    {
      id: 'pages', title: 'Pages',
      tabs: [
        { id: 'pages', label: 'Top pages', column: 'Views', items: rows => group(rows, r => r.e === 'Page view', r => r.path || '(none)') },
        { id: 'locale', label: 'Site language', column: 'Views', items: rows => group(rows, r => r.e === 'Page view', r => ({ nl: 'Dutch', en: 'English' }[r.locale] ?? (r.locale || '(none)'))) },
      ],
    },
    {
      id: 'countries', title: 'Countries',
      tabs: [
        { id: 'countries', label: 'Page views', column: 'Views', filter: true, note: 'Choose a country to filter the whole page.',
          items: rows => group(rows, r => r.e === 'Page view', country).map(item => ({ ...item, value: item.label, label: countryName(item.label) })) },
        { id: 'poem-countries', label: 'Poems', column: 'Poems', filter: true,
          items: rows => group(rows, r => POEM.has(r.e), country).map(item => ({ ...item, value: item.label, label: countryName(item.label) })) },
      ],
    },
    {
      id: 'poems', title: 'Poems',
      tabs: [
        { id: 'style', label: 'Style', column: 'Poems', items: rows => group(rows, r => POEM.has(r.e), r => r.style || '(none)') },
        { id: 'rhyme', label: 'Rhyme', column: 'Poems', items: rows => group(rows, r => POEM.has(r.e), r => r.rhyme || '(none)') },
        { id: 'language', label: 'Language', column: 'Poems', items: rows => group(rows, r => POEM.has(r.e), r => r.lang || '(none)') },
        { id: 'plan', label: 'Plan', column: 'Poems',
          items: rows => [
            ...group(rows, r => POEM.has(r.e), r => r.plan || '(none)'),
            ...group(rows, r => r.e === 'Regenerate poem', () => 'of which rewrites').map(item => ({ ...item, group: 'Rewrites' })),
          ],
          note: (rows) => {
            const poems = rows.filter(r => POEM.has(r.e));
            const n = sum(poems.map(r => r.n));
            return n ? `${nf1.format(sum(poems.map(r => r.lines)) / n)} lines per poem on average.` : '';
          } },
        { id: 'form', label: 'Form use', column: 'Poems',
          items: rows => [
            ['Fun facts', 'facts'], ['Present', 'present'], ['Written by', 'wby'], ['Audience', 'aud'],
          ].flatMap(([title, key]) => group(rows, r => POEM.has(r.e), r => r[key] || '(none)').map(item => ({ ...item, group: title }))) },
        { id: 'ratings', label: 'Ratings', column: 'Votes',
          items: rows => [
            ...group(rows, r => r.e === 'Rate poem' && r.detail.startsWith('up'), r => r.detail.split(':')[1] || '(no style)').map(item => ({ ...item, group: 'Good' })),
            ...group(rows, r => r.e === 'Rate poem' && r.detail.startsWith('down'), r => r.detail.split(':')[1] || '(no style)').map(item => ({ ...item, group: 'Not good' })),
            ...group(rows, r => r.e === 'Poem ready' && r.detail.startsWith('rewrite'), r => (r.detail === 'rewrite hint' ? 'with a wish' : 'without a wish')).map(item => ({ ...item, group: 'Rewrites' })),
          ],
          note: (rows) => {
            const votes = rows.filter(r => r.e === 'Rate poem');
            const n = sum(votes.map(r => r.n));
            const up = sum(votes.filter(r => r.detail.startsWith('up')).map(r => r.n));
            return n ? `${Math.round((100 * up) / n)}% of ${int(n)} votes were good.` : 'Votes come from the thumbs under each poem.';
          } },
      ],
    },
    {
      id: 'payments', title: 'Payments',
      tabs: [
        { id: 'tiers', label: 'Tiers', column: 'Count', noShare: true, note: 'From the tier column. Gift links count as Hele familie.',
          items: rows => ['drie', 'gezin', 'familie'].flatMap((tier) => {
            const of = events => rows.reduce((total, r) => total + (r.tier === tier && events.includes(r.e) ? r.n : 0), 0);
            const name = { drie: '3 gedichten', gezin: 'Gezin', familie: 'Hele familie' }[tier];
            return [
              { label: 'Checkouts started', n: of(['Proceed to payment']), group: name },
              { label: 'Payments verified', n: of(['Payment verified']), group: name },
              { label: 'Poems written', n: of(['Generate poem', 'Regenerate poem']), group: name },
              { label: 'Surprise ideas', n: of(['Surprise ideas']), group: name },
            ];
          }) },
        { id: 'opened', label: 'Window opened', column: 'Times', items: rows => byDetail(rows, 'Show payment modal') },
        { id: 'closed', label: 'Window closed', column: 'Times', items: rows => byDetail(rows, 'Close payment modal') },
        { id: 'results', label: 'Results', column: 'Count', noShare: true,
          items: rows => [
            { label: 'Payment succeeded (browser)', n: count(rows, 'Payment succeeded'), group: 'Payments' },
            { label: 'Payment verified (server)', n: count(rows, 'Payment verified'), group: 'Payments' },
            ...byDetail(rows, 'Payment verified', 'verified via: ').map(item => ({ ...item, group: 'Payments' })),
            ...byDetail(rows, 'Payment returned', 'returned: ').map(item => ({ ...item, group: 'Payments' })),
            { label: 'Continue after payment', n: count(rows, 'Continue after payment'), group: 'Payments' },
            { label: 'Access restored', n: count(rows, 'Access restored'), group: 'Access' },
            ...byDetail(rows, 'Restore failed', 'restore failed: ').map(item => ({ ...item, group: 'Access' })),
            ...byDetail(rows, 'Gift claimed', 'gift: ').map(item => ({ ...item, group: 'Access' })),
            ...byDetail(rows, 'Payments unavailable', '').map(item => ({ ...item, group: 'Payments unavailable' })),
          ] },
        { id: 'webhooks', label: 'Webhooks', column: 'Events', noShare: true, note: 'Webhooks have no country, so a country filter hides them.',
          items: rows => group(rows, r => r.e === 'Payment webhook', r => r.detail || '(none)').map((item) => {
            const amount = rows.reduce((total, r) => total + (r.e === 'Payment webhook' && (r.detail || '(none)') === item.label ? r.amount : 0), 0);
            return { ...item, note: eurFormat.format(amount) };
          }) },
      ],
    },
    {
      id: 'engagement', title: 'Engagement',
      tabs: [
        { id: 'sharing', label: 'Sharing', column: 'Times',
          items: rows => eventItems(rows, ['Copy share link', 'Copy to clipboard', 'Save as PDF', 'Shared via WhatsApp', 'Shared via Email', 'Shared via Facebook', 'Shared via share sheet', 'Open shared poem']) },
        { id: 'pdf', label: 'PDF designs', column: 'Saves', items: rows => byDetail(rows, 'Save as PDF') },
        { id: 'actions', label: 'Actions', column: 'Times',
          items: rows => [
            ...eventItems(rows, ['Open history', 'Open poem from history', 'Delete poem', 'Clear history', 'Play video', 'Scroll to FAQ', 'Contact', 'Open devtools']),
            ...byDetail(rows, 'Show surprise ideas', 'surprise ideas: '),
            ...byDetail(rows, 'Switch language', 'language: '),
            ...byDetail(rows, 'Show example', 'example: '),
          ] },
        { id: 'device', label: 'Poems per device', column: 'Poems', note: 'From "Poem ready": how many poems the history held after this one.',
          items: rows => group(rows, r => r.e === 'Poem ready', r => r.v).sort((a, b) => Number(a.label) - Number(b.label)).map(item => ({ ...item, label: `poem no. ${item.label}` })) },
        { id: 'lootjes', label: 'Lootjes', column: 'Draws', note: 'Draws per group size.',
          items: rows => group(rows, r => r.e === 'Draw lootjes', r => r.v).sort((a, b) => Number(a.label) - Number(b.label)).map(item => ({ ...item, label: `${item.label} people` })) },
      ],
    },
  ];

  function panelShell(panel) {
    const tabs = panel.tabs.length > 1
      ? `<div class="tabs" role="tablist" aria-label="${esc(panel.title)}">${panel.tabs.map((tab, i) => `<button type="button" role="tab" id="tab-${panel.id}-${tab.id}" aria-controls="body-${panel.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-panel="${panel.id}" data-tab="${tab.id}">${esc(tab.label)}</button>`).join('')}</div>`
      : '';
    return `<section class="panel" aria-labelledby="title-${panel.id}">
      <div class="panel-head"><h2 class="panel-title" id="title-${panel.id}">${emoji(PANEL_EMOJI[panel.id])}${esc(panel.title)}</h2>${tabs}</div>
      <div class="panel-body" id="body-${panel.id}"${panel.tabs.length > 1 ? ` role="tabpanel" aria-labelledby="tab-${panel.id}-${panel.tabs[0].id}"` : ''}></div>
    </section>`;
  }

  function renderPanel(panel) {
    const tabId = state.tabs[panel.id] ?? panel.tabs[0].id;
    const tab = panel.tabs.find(t => t.id === tabId) ?? panel.tabs[0];
    for (const button of app.querySelectorAll(`[data-panel="${panel.id}"]`)) {
      const selected = button.dataset.tab === tab.id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    const body = document.getElementById(`body-${panel.id}`);
    if (panel.tabs.length > 1) body.setAttribute('aria-labelledby', `tab-${panel.id}-${tab.id}`);
    const items = tab.items(view.cur).filter(item => item.n > 0);
    const note = typeof tab.note === 'function' ? tab.note(view.cur) : tab.note;
    body.innerHTML = listHtml(items, tab) + (note ? `<p class="panel-note">${esc(note)}</p>` : '');
  }

  function listHtml(items, tab) {
    if (!items.length) return '<p class="empty">No data in this period.</p>';
    const max = Math.max(...items.map(item => item.n));
    const total = sum(items.filter(item => !item.group).map(item => item.n)) || sum(items.map(item => item.n));
    let lastGroup = null;
    let html = `<div class="list-head"><span>${esc(tab.label)}</span><span>${esc(tab.column ?? 'Count')}</span></div><ul class="list">`;
    for (const item of items) {
      if (item.group && item.group !== lastGroup) {
        html += `<li class="list-group">${emoji(GROUP_EMOJI[item.group])}${esc(item.group)}</li>`;
        lastGroup = item.group;
      }
      const groupTotal = item.group ? sum(items.filter(other => other.group === item.group).map(other => other.n)) : total;
      const small = item.note ?? (tab.noShare ? '' : share(item.n, groupTotal));
      const width = ((item.n / max) * 100).toFixed(2);
      const inner = `<span class="bar" style="width:${width}%"></span><span class="label" title="${esc(item.label)}">${tab.filter ? '' : emoji(labelEmoji(item.label))}${esc(item.label)}</span><span class="value">${int(item.n)}${small ? `<small>${esc(small)}</small>` : ''}</span>`;
      html += tab.filter && item.value !== undefined
        ? `<li><button type="button" class="item" data-country="${esc(item.value)}" aria-label="${esc(`${item.label}: ${int(item.n)}. Filter by this country`)}">${inner}</button></li>`
        : `<li class="item">${inner}</li>`;
    }
    return `${html}</ul>`;
  }

  // ------------------------------------------------------------ top of the page
  function renderMeta() {
    const period = view.period;
    let range = `${period.cur[0].tip} – ${period.cur.at(-1).tip}`;
    if (period.hourly) {
      const first = period.cur[0].key;
      const end = period.cur.at(-1).key + HOUR;
      const sameDay = hourInfo(first).day === hourInfo(end - HOUR).day;
      const endText = sameDay && hourInfo(end).hour === 0 ? '24:00' : hh(end);
      range = `${dayLong(hourInfo(first).day)}, ${hh(first)} – ${sameDay ? '' : `${dayLong(hourInfo(end - HOUR).day)}, `}${endText}`;
    }
    if (period.cur.length === 1 && !period.hourly) range = period.cur[0].tip;
    const chips = state.country !== null
      ? `<div class="chips"><span class="chip">Country is <strong>${esc(countryName(state.country))}</strong><button type="button" id="clear-country" aria-label="Remove the country filter">${ICON.close}</button></span></div>`
      : '';
    document.getElementById('meta').innerHTML = `
      <span><strong>${esc(period.title)}</strong> · ${esc(range)}</span>
      ${state.compare && period.prev ? `<span>Compared with ${esc(period.prevName.toLowerCase())}</span>` : ''}
      <span>Data as of ${esc(when(now))}${firstDataMs !== null ? ` · collected since ${esc(when(firstDataMs))}` : ''}</span>
      ${chips}`;
    document.getElementById('alert').innerHTML = DATA.error
      ? `<div class="alert" role="alert"><strong>The query failed.</strong> <code>${esc(DATA.error)}</code></div>`
      : '';
    for (const button of app.querySelectorAll('[data-period]')) button.setAttribute('aria-pressed', String(button.dataset.period === state.period));
    const compare = document.getElementById('compare');
    compare.setAttribute('aria-pressed', String(state.compare));
    compare.disabled = !period.prev;
  }

  function renderKpis() {
    const showPrev = state.compare && view.period.prev;
    const poems = view.series.poems;
    const rewrites = count(view.cur, 'Regenerate poem');
    document.getElementById('kpis').innerHTML = METRICS.map((metric) => {
      const s = view.series[metric.id];
      const value = s.total === null ? '–' : metric.format(s.total);
      let foot = showPrev ? deltaHtml(metric, s.total, s.prevTotal) : '';
      if (metric.id === 'poems' && rewrites) foot += `<span>${int(rewrites)} rewrites</span>`;
      if (metric.id === 'cost' && poems.total) foot += `<span>${usd4.format(s.total / poems.total)}/poem</span>`;
      if (metric.id === 'conversion') foot += '<span>payments ÷ views</span>';
      return `<button type="button" class="kpi" data-metric="${metric.id}" aria-pressed="${metric.id === state.metric}">
        <span class="kpi-label">${emoji(METRIC_EMOJI[metric.id])}${esc(metric.label)}</span>
        <span class="kpi-value">${esc(value)}</span>
        <span class="kpi-foot">${foot}</span>
      </button>`;
    }).join('');
  }

  // ------------------------------------------------------------ main chart
  let chartIndex = null;

  /** Round ticks: a step of 1, 2 or 5 times a power of ten, about 4 steps up to the top. */
  function niceTicks(value, whole) {
    const top = value > 0 ? value : 1;
    const raw = top / 4;
    const exp = 10 ** Math.floor(Math.log10(raw));
    let step = [1, 2, 5, 10].map(f => f * exp).find(s => s >= raw) ?? 10 * exp;
    if (whole) step = Math.max(1, Math.round(step));
    const ticks = [];
    for (let t = 0; t < top + step / 2 && ticks.length < 7; t += step) ticks.push(t);
    if (ticks.at(-1) < top) ticks.push(ticks.at(-1) + step);
    return ticks;
  }

  function renderChart() {
    const metric = metricById(state.metric);
    const s = view.series[metric.id];
    const period = view.period;
    const showPrev = Boolean(state.compare && period.prev && s.prev);
    const el = document.getElementById('chart');
    const width = Math.max(280, el.clientWidth);
    const height = el.clientHeight || 260;
    const m = { top: 12, right: 12, bottom: 26, left: 48 };
    const w = width - m.left - m.right;
    const h = height - m.top - m.bottom;
    const values = [...s.cur, ...(showPrev ? s.prev : [])].filter(v => v !== null);
    const ticks = niceTicks(Math.max(metric.points ? 0.01 : 0, ...values), metric.whole);
    const yMax = ticks.at(-1);
    const n = period.cur.length;
    const x = i => m.left + (n === 1 ? w / 2 : (i * w) / (n - 1));
    const y = v => m.top + h - (v / yMax) * h;

    let svg = ticks.map(t => `<line class="${t === 0 ? 'baseline' : 'gridline'}" x1="${m.left}" x2="${width - m.right}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="tick" x="${m.left - 8}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${esc(metric.axis(t))}</text>`).join('');
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 72))));
    period.cur.forEach((bucket, i) => {
      if (i % every !== 0 && i !== n - 1) return;
      if (i === n - 1 && i % every !== 0 && n - 1 - Math.floor((n - 1) / every) * every < every / 2) return;
      const anchor = n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
      svg += `<text class="tick" x="${x(i).toFixed(1)}" y="${height - 6}" text-anchor="${anchor}">${esc(bucket.axis)}</text>`;
    });

    const path = (list, from = 0, to = list.length - 1) => {
      let d = '';
      let pen = false;
      for (let i = from; i <= to; i++) {
        if (list[i] === null) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(list[i]).toFixed(1)}`;
        pen = true;
      }
      return d;
    };
    if (showPrev) svg += `<path class="line-previous" d="${path(s.prev)}"/>`;
    // The last bucket is still running when the period ends now: dashed.
    const live = period.live && n > 1;
    const solidEnd = live ? n - 2 : n - 1;
    if (!metric.ratio && n > 1) {
      svg += `<path class="area" d="${path(s.cur)}L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z"/>`;
    }
    svg += `<path class="line" d="${path(s.cur, 0, solidEnd)}"/>`;
    if (live) svg += `<path class="line partial" d="${path(s.cur, n - 2, n - 1)}"/>`;
    if (n === 1 && s.cur[0] !== null) svg += `<circle class="dot" cx="${x(0)}" cy="${y(s.cur[0])}" r="4"/>`;
    svg += '<g id="hover" aria-hidden="true"></g>';

    el.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>`;
    el.setAttribute('aria-label', `${metric.label}, ${period.title.toLowerCase()}: ${s.total === null ? 'no data' : metric.format(s.total)}${showPrev && s.prevTotal !== null ? `; ${period.prevName.toLowerCase()}: ${metric.format(s.prevTotal)}` : ''}. Use the arrow keys for each ${period.hourly ? 'hour' : 'day'}, or open the table below.`);
    el._geometry = { x, y, n, width, height, m, metric, s, showPrev };

    document.getElementById('chart-title').textContent = `${metric.label} ${period.hourly ? 'per hour' : 'per day'}`;
    document.getElementById('legend').innerHTML = `<span><i class="swatch" aria-hidden="true"></i>${esc(period.title)}</span>${showPrev ? `<span><i class="swatch previous" aria-hidden="true"></i>${esc(period.prevName)}</span>` : ''}${live ? '<span>Dashed end: still counting</span>' : ''}`;

    const head = `<tr><th>${period.hourly ? 'Hour' : 'Day'}</th><th class="num">${esc(metric.label)}</th>${showPrev ? `<th class="num">${esc(period.prevName)}</th>` : ''}</tr>`;
    const body = period.cur.map((bucket, i) => `<tr><td>${esc(bucket.tip)}</td><td class="num">${s.cur[i] === null ? '–' : esc(metric.format(s.cur[i]))}</td>${showPrev ? `<td class="num">${s.prev[i] === null ? '–' : esc(metric.format(s.prev[i]))}</td>` : ''}</tr>`).join('');
    document.getElementById('chart-table').innerHTML = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
    if (chartIndex !== null) showPoint(Math.min(chartIndex, n - 1));
  }

  function showPoint(i) {
    const el = document.getElementById('chart');
    const g = el._geometry;
    const tooltip = document.getElementById('tooltip');
    const hover = el.querySelector('#hover');
    if (!g || !hover || i === null) { hideTooltip(); return; }
    chartIndex = i;
    const period = view.period;
    const cur = g.s.cur[i];
    const prev = g.showPrev ? g.s.prev[i] : null;
    let marks = `<line class="crosshair" x1="${g.x(i)}" x2="${g.x(i)}" y1="${g.m.top}" y2="${g.height - g.m.bottom}"/>`;
    if (g.showPrev && prev !== null) marks += `<circle class="dot-previous" cx="${g.x(i)}" cy="${g.y(prev)}" r="4"/>`;
    if (cur !== null) marks += `<circle class="dot" cx="${g.x(i)}" cy="${g.y(cur)}" r="4.5"/>`;
    hover.innerHTML = marks;

    const running = period.live && i === g.n - 1 ? ' (still counting)' : '';
    tooltip.innerHTML = `<div class="when">${esc(period.cur[i].tip)}${running}</div>
      <div class="row"><span><i class="swatch" aria-hidden="true"></i>${esc(g.metric.label)}</span><strong>${cur === null ? '–' : esc(g.metric.format(cur))}</strong></div>
      ${g.showPrev ? `<div class="row"><span><i class="swatch previous" aria-hidden="true"></i>${esc(period.prev[i].tip)}</span><strong>${prev === null ? '–' : esc(g.metric.format(prev))}</strong></div>` : ''}`;
    tooltip.hidden = false;
    const box = el.getBoundingClientRect();
    const scale = box.width / g.width;
    const px = box.left + g.x(i) * scale;
    const tw = tooltip.offsetWidth;
    let left = px + 14;
    if (left + tw > window.innerWidth - 8) left = px - tw - 14;
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, box.top + 8)}px`;
  }

  function hideTooltip() {
    chartIndex = null;
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.hidden = true;
    const hover = document.querySelector('#chart #hover');
    if (hover) hover.innerHTML = '';
  }

  function pointFromEvent(event) {
    const el = document.getElementById('chart');
    const g = el._geometry;
    if (!g) return null;
    const box = el.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * g.width;
    if (g.n === 1) return 0;
    const i = Math.round(((px - g.m.left) / (g.width - g.m.left - g.m.right)) * (g.n - 1));
    return Math.max(0, Math.min(g.n - 1, i));
  }

  // ------------------------------------------------------------ funnel
  const FUNNEL = [
    { event: 'Page view', name: 'Page views', hint: 'browser' },
    { event: 'Form started', name: 'Started the form', hint: 'browser' },
    { event: 'Generate poem', name: 'Got a new poem', hint: 'server' },
    { event: 'Show payment modal', name: 'Saw the payment window', hint: 'browser' },
    { event: 'Proceed to payment', name: 'Went to checkout', hint: 'server' },
    { event: 'Payment verified', name: 'Paid', hint: 'server' },
  ];

  function renderFunnel() {
    const steps = FUNNEL.map(step => ({ ...step, n: count(view.cur, step.event) }));
    const first = steps[0].n;
    const max = Math.max(1, ...steps.map(step => step.n));
    let worst = -1;
    let worstRate = 1;
    steps.forEach((step, i) => {
      if (i === 0 || !steps[i - 1].n) return;
      const r = step.n / steps[i - 1].n;
      if (r < worstRate) { worst = i; worstRate = r; }
    });
    let html = '<ol class="funnel">';
    steps.forEach((step, i) => {
      if (i > 0) {
        const before = steps[i - 1].n;
        const text = !before
          ? 'Nobody reached the step before'
          : step.n > before
            ? `${pct(step.n / before)} of the step before (counted in another place)`
            : `${pct(step.n / before)} went on · ${int(before - step.n)} stopped`;
        html += `<li class="fdrop"><span></span><span>↓ ${esc(text)}${i === worst ? `<span class="flag">${ICON.down}Biggest drop</span>` : ''}</span></li>`;
      }
      html += `<li class="fstep">
        <span class="fstep-name">${i + 1}. ${emoji(EVENT_EMOJI[step.event])}${esc(step.name)}<small>${esc(step.hint)} event</small></span>
        <span class="fstep-track" role="img" aria-label="${esc(`${step.name}: ${int(step.n)}`)}"><span class="fstep-fill" style="display:block;width:${step.n ? ((step.n / max) * 100).toFixed(2) : 0}%"></span></span>
        <span class="fstep-count">${int(step.n)}<small>${i === 0 ? 'start' : `${esc(share(step.n, first) || '–')} of views`}</small></span>
      </li>`;
    });
    html += '</ol><p class="panel-note">Browser events can be hidden by ad blockers; server events are always counted. Page views are not people: one visitor can view several pages.</p>';
    document.getElementById('funnel').innerHTML = html;
  }

  // ------------------------------------------------------------ health
  function renderProblems() {
    const rows = view.cur;
    const poems = rows.filter(r => POEM.has(r.e));
    const n = sum(poems.map(r => r.n));
    const failed = count(rows, 'Poem generation failed') + count(rows, 'Poem stream failed');
    const stats = [
      ['Seconds to first text', n ? nf1.format(sum(poems.map(r => r.first)) / n) : '–'],
      ['Seconds per poem', n ? nf1.format(sum(poems.map(r => r.total)) / n) : '–'],
      ['Failed poems', n + failed ? share(failed, n + failed) || '0%' : '–'],
      ['Rate limited', int(count(rows, 'Rate limited'))],
    ];
    const items = [
      ...byDetail(rows, 'Rate limited', '').map(item => ({ ...item, group: 'Rate limited' })),
      ...group(rows, r => r.e === 'Poem aborted', r => r.detail || 'unknown').map(item => ({ ...item, group: 'Poem aborted (visitor left)' })),
      ...byDetail(rows, 'Poem generation failed', '').map(item => ({ ...item, group: 'Generation failed' })),
      ...byDetail(rows, 'Poem stream failed', '').map(item => ({ ...item, group: 'Stream failed' })),
      ...eventItems(rows, ['PDF failed', 'Copy failed', 'Surprise ideas failed']).map(item => ({ ...item, group: 'Other' })),
      ...byDetail(rows, 'Form refused', '').map(item => ({ ...item, group: 'Form refused' })),
      ...byDetail(rows, 'No poems left', '').map(item => ({ ...item, group: 'No poems left' })),
    ].filter(item => item.n > 0);
    document.getElementById('problems').innerHTML = `
      <div class="stats">${stats.map(([label, value]) => `<div class="stat"><span>${emoji(STAT_EMOJI[label])}${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>
      ${items.length ? listHtml(items, { label: 'Problem', column: 'Count', noShare: true }) : '<p class="empty">No problems in this period.</p>'}
      <p class="panel-note">"Rate limited: limit" includes second free poems from the same connection, such as a private window. "No poems left" counts each try to write a poem without poems left (free:… the free poem is used, credits:… the 3 poems of Drie are; :server when the server refused it).</p>`;
  }

  // ------------------------------------------------------------ all events
  function renderEvents() {
    const query = document.getElementById('event-search').value.trim().toLowerCase();
    const showPrev = state.compare && view.period.prev;
    const curCount = new Map();
    const prevCount = new Map();
    const details = new Map();
    for (const r of view.cur) {
      curCount.set(r.e, (curCount.get(r.e) ?? 0) + r.n);
      if (r.detail) {
        const map = details.get(r.e) ?? new Map();
        map.set(r.detail, (map.get(r.detail) ?? 0) + r.n);
        details.set(r.e, map);
      }
    }
    for (const r of view.prev) prevCount.set(r.e, (prevCount.get(r.e) ?? 0) + r.n);
    const names = [...new Set([...curCount.keys(), ...(showPrev ? prevCount.keys() : [])])]
      .sort((a, b) => (curCount.get(b) ?? 0) - (curCount.get(a) ?? 0) || a.localeCompare(b));
    const rows = names.map((name) => {
      const top = [...(details.get(name) ?? new Map())].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([d, n]) => `${d} (${int(n)})`).join(', ');
      return { name, n: curCount.get(name) ?? 0, prev: prevCount.get(name) ?? 0, top };
    }).filter(row => !query || row.name.toLowerCase().includes(query) || row.top.toLowerCase().includes(query));
    const fakeMetric = { neutral: true };
    const silent = (DATA.events ?? []).filter(name => !curCount.has(name));
    document.getElementById('events').innerHTML = rows.length
      ? `<div class="table-scroll"><table>
          <thead><tr><th>Event</th><th class="num">Count</th>${showPrev ? `<th class="num">${esc(view.period.prevName)}</th><th class="num">Change</th>` : ''}<th>Top details</th></tr></thead>
          <tbody>${rows.map(row => `<tr><td>${emoji(EVENT_EMOJI[row.name])}${esc(row.name)}</td><td class="num">${int(row.n)}</td>${showPrev ? `<td class="num">${int(row.prev)}</td><td class="num">${deltaHtml(fakeMetric, row.n, row.prev)}</td>` : ''}<td class="details">${esc(row.top)}</td></tr>`).join('')}</tbody>
        </table></div>${!query && silent.length ? `<p class="panel-note">No data in this period: ${esc(silent.join(', '))}.</p>` : ''}`
      : `<p class="empty">${query ? 'No events match.' : 'No events in this period.'}</p>`;
  }

  // ------------------------------------------------------------ update + events
  function update() {
    compute();
    writeHash();
    renderMeta();
    renderKpis();
    renderChart();
    renderFunnel();
    for (const panel of PANELS) renderPanel(panel);
    renderProblems();
    renderEvents();
  }

  function setPeriod(id) {
    if (state.period === id) return;
    state.period = id;
    hideTooltip();
    update();
  }

  function setCountry(code) {
    state.country = code;
    update();
    const clear = document.getElementById('clear-country');
    if (clear) clear.focus();
  }

  // Theme: system, light or dark; remembered on this device when possible.
  const THEMES = ['system', 'light', 'dark'];
  let theme = 'system';
  try { theme = localStorage.getItem('sintgpt-dashboard-theme') || 'system'; } catch { /* storage blocked */ }
  function applyTheme() {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    const button = document.getElementById('theme');
    if (button) button.setAttribute('aria-label', `Theme: ${theme}. Change theme`);
    if (button) button.title = `Theme: ${theme}`;
  }

  function bind() {
    app.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.dataset.period) setPeriod(target.dataset.period);
      else if (target.id === 'compare') { state.compare = !state.compare; update(); }
      else if (target.dataset.metric) { state.metric = target.dataset.metric; writeHash(); renderKpis(); renderChart(); target.ownerDocument.querySelector(`[data-metric="${state.metric}"]`)?.focus(); }
      else if (target.dataset.tab) {
        state.tabs[target.dataset.panel] = target.dataset.tab;
        renderPanel(PANELS.find(p => p.id === target.dataset.panel));
      } else if (target.dataset.country !== undefined) setCountry(target.dataset.country);
      else if (target.id === 'clear-country') {
        state.country = null;
        update();
        document.querySelector('[data-period][aria-pressed="true"]')?.focus();
      } else if (target.id === 'theme') {
        theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        try { localStorage.setItem('sintgpt-dashboard-theme', theme); } catch { /* storage blocked */ }
        applyTheme();
      }
    });

    // Tabs: arrow keys move between tabs (WAI-ARIA tabs pattern).
    app.addEventListener('keydown', (event) => {
      const tab = event.target.closest?.('[role="tab"]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const list = [...tab.parentElement.querySelectorAll('[role="tab"]')];
      let i = list.indexOf(tab);
      if (event.key === 'ArrowLeft') i = (i - 1 + list.length) % list.length;
      if (event.key === 'ArrowRight') i = (i + 1) % list.length;
      if (event.key === 'Home') i = 0;
      if (event.key === 'End') i = list.length - 1;
      event.preventDefault();
      list[i].click();
      list[i].focus();
    });

    const chart = document.getElementById('chart');
    chart.addEventListener('pointermove', event => showPoint(pointFromEvent(event)));
    chart.addEventListener('pointerleave', hideTooltip);
    chart.addEventListener('focus', () => showPoint(chartIndex ?? view.period.cur.length - 1));
    chart.addEventListener('blur', hideTooltip);
    chart.addEventListener('keydown', (event) => {
      const n = view.period.cur.length;
      if (event.key === 'Escape') { hideTooltip(); return; }
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        showPoint(event.key === 'Home' ? 0 : n - 1);
      } else if (step) {
        event.preventDefault();
        showPoint(Math.max(0, Math.min(n - 1, (chartIndex ?? n - 1) + step)));
      }
    });

    document.getElementById('event-search').addEventListener('input', renderEvents);

    // Keyboard shortcuts, like the period keys in other analytics tools.
    document.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const key = event.key.toLowerCase();
      const period = PERIODS.find(p => p.key === key);
      if (period) setPeriod(period.id);
      else if (key === 'c' && view.period.prev) { state.compare = !state.compare; update(); }
    });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderChart, 100);
    });
    window.addEventListener('scroll', () => { if (chartIndex !== null && document.activeElement !== chart) hideTooltip(); }, { passive: true });
  }

  readHash();
  shell();
  applyTheme();
  bind();
  update();
})();
