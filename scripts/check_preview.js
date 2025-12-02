import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const obj = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (m) obj[m[1]] = m[2];
  }
  return obj;
}

const repoRoot = path.join(__dirname, '..');
const env = readEnv(path.join(repoRoot, '.env'));
const id = env.SPOTIFY_CLIENT_ID;
const secret = env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
  process.exit(2);
}

const creds = Buffer.from(`${id}:${secret}`).toString('base64');

try {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!tokenRes.ok) {
    console.error('Token request failed', await tokenRes.text());
    process.exit(3);
  }
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const market = process.env.MARKET || 'CH';
  const q = encodeURIComponent('Blinding Lights');
  const url = `https://api.spotify.com/v1/search?q=${q}&type=track&market=${market}&limit=5`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    console.error('Search failed', r.status, await r.text());
    process.exit(4);
  }
  const data = await r.json();
  const items = data.tracks?.items ?? [];
  if (!items.length) {
    console.log('No tracks found');
    process.exit(0);
  }
  for (const it of items) {
    console.log('---');
    console.log('id:', it.id);
    console.log('name:', it.name);
    console.log('artists:', (it.artists || []).map(a=>a.name).join(', '));
    console.log('preview_url:', it.preview_url);
    console.log('external:', it.external_urls?.spotify);
  }
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}
