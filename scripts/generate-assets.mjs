import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const appsDir = join(root, 'data', 'apps');
const faviconDir = join(root, 'public', 'favicons');
const ogDir = join(root, 'public', 'og');
await mkdir(faviconDir, { recursive: true });
await mkdir(ogDir, { recursive: true });

const apps = [];
for (const file of (await readdir(appsDir)).filter((name) => name.endsWith('.json'))) {
  apps.push(JSON.parse(await readFile(join(appsDir, file), 'utf8')));
}

async function fetchBuffer(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'can-i-vibecode-it-build/1.0' } });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function findFont(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFont(path);
      if (found) return found;
    } else if (/space-grotesk.*latin.*700.*normal.*\.(woff|ttf)$/i.test(entry.name)) {
      return path;
    }
  }
}

const staticFont = await findFont(join(root, 'node_modules', '@fontsource', 'space-grotesk'));
if (!staticFont) throw new Error('No static Space Grotesk font available for Satori');
const fontData = await readFile(staticFont);

function textInitials(name) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function fallbackFavicon(app) {
  const initials = textInitials(app.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="10" fill="#ffffff"/><rect x="3" y="3" width="58" height="58" rx="8" fill="#111711"/><text x="32" y="40" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="#7cff6b">${initials}</text></svg>`;
}

for (const app of apps) {
  const path = join(faviconDir, `${app.slug}.png`);
  try {
    await stat(path);
  } catch {
    try {
      const icon = await fetchBuffer(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(app.domain)}&sz=128`, 8000);
      if (icon.length < 100) throw new Error('favicon response too small');
      await writeFile(path, icon);
    } catch (error) {
      console.warn(`Favicon fallback for ${app.name}:`, error.message);
      const png = new Resvg(fallbackFavicon(app), { fitTo: { mode: 'width', value: 64 } }).render().asPng();
      await writeFile(path, png);
    }
  }
}

const verdictColors = { yes: '#7cff6b', kinda: '#f2b84b', no: '#ff665e' };
const verdictLabels = { yes: 'YES', kinda: 'KINDA', no: 'NOT REALLY' };
const h = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

async function renderOg({ app }) {
  const isHome = !app;
  const accent = isHome ? '#7cff6b' : verdictColors[app.verdict];
  const title = isHome ? 'Can I Vibecode It?' : `Can you vibecode ${app.name}?`;
  const subtitle = isHome
    ? 'The honest SaaS replacement index.'
    : `${verdictLabels[app.verdict]} · $${app.priceMonthly}/mo · ${app.category}`;
  const node = h('div', {
    width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '58px 64px', backgroundColor: '#070907', color: '#f0f4ef', fontFamily: 'Space Grotesk',
    backgroundImage: 'linear-gradient(rgba(124,255,107,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,255,107,.05) 1px, transparent 1px)',
    backgroundSize: '36px 36px'
  }, [
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }, [
      h('div', { display: 'flex', alignItems: 'center', gap: '16px', fontSize: '24px', fontWeight: 700 }, [
        h('div', { width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #7cff6b', color: '#7cff6b', backgroundColor: '#183d18', fontSize: '20px' }, 'C?'),
        h('span', { display: 'flex' }, 'CAN I VIBECODE IT?')
      ]),
      h('div', { display: 'flex', border: `2px solid ${accent}`, color: accent, padding: '10px 15px', fontSize: '17px', fontWeight: 700, letterSpacing: '.08em' }, isHome ? 'SAAS INDEX' : verdictLabels[app.verdict])
    ]),
    h('div', { display: 'flex', flexDirection: 'column', width: '100%' }, [
      h('div', { display: 'flex', color: accent, fontSize: '20px', fontWeight: 700, marginBottom: '18px', letterSpacing: '.08em' }, isHome ? '>_ SEARCH. PROMPT. REBUILD.' : `>_ ${app.domain}`),
      h('div', { display: 'flex', maxWidth: '1040px', fontSize: isHome ? '92px' : '78px', lineHeight: .94, fontWeight: 700, letterSpacing: '-.055em' }, title),
      h('div', { display: 'flex', marginTop: '25px', color: '#8f9a91', fontSize: '28px', fontWeight: 500 }, subtitle)
    ]),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: '#8f9a91', fontSize: '18px' }, [
      h('span', { display: 'flex' }, isHome ? `${apps.length} PAID APPS. ZERO HYPE.` : 'PROMPT + LOSSES + PRIOR ART'),
      h('span', { display: 'flex', color: '#7cff6b' }, 'CAN-I-VIBECODE-IT-LIVE.VERCEL.APP')
    ])
  ]);
  const svg = await satori(node, { width: 1200, height: 630, fonts: [{ name: 'Space Grotesk', data: fontData, weight: 700, style: 'normal' }] });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

await writeFile(join(ogDir, 'home.png'), await renderOg({}));
for (const app of apps) await writeFile(join(ogDir, `${app.slug}.png`), await renderOg({ app }));
console.log(`Generated ${apps.length} favicons and ${apps.length + 1} OG images.`);
