import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotifyGet } from '$lib/server/spotify';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const GET: RequestHandler = async ({ url }) => {
  const sp = url.searchParams;

  const energy = clamp(Number(sp.get('energy') ?? '70'), 0, 100) / 100;
  const valence = clamp(Number(sp.get('valence') ?? '60'), 0, 100) / 100;
  const danceability = clamp(Number(sp.get('danceability') ?? '65'), 0, 100) / 100;
  const tempo = clamp(Number(sp.get('tempo') ?? '120'), 60, 200);
  const genre = (sp.get('genre') ?? 'pop').trim().toLowerCase() || 'pop';
  const seedTrack = sp.get('seedTrack') ?? sp.get('track') ?? '';
  const limit = clamp(Number(sp.get('limit') ?? '16'), 1, 30);

  const allowedSeeds = new Set([
    'pop','rock','dance','edm','hip-hop','chill','party','work-out','latin','jazz','metal','country','r-n-b','rnb','r&b','soul'
  ]);
  const genreMap: Record<string, string> = {
    'hip hop': 'hip-hop',
    hiphop: 'hip-hop',
    'workout': 'work-out',
    'study': 'chill',
    'focus': 'chill'
  };
  const normalized = genreMap[genre] ?? genre;
  const seed = allowedSeeds.has(normalized) ? normalized : 'pop';

  const buildParams = (seedValue: string) =>
    new URLSearchParams({
      ...(seedTrack ? { seed_tracks: seedTrack } : { seed_genres: seedValue }),
      limit: String(limit),
      market: 'US',
      target_energy: energy.toFixed(2),
      target_valence: valence.toFixed(2),
      target_danceability: danceability.toFixed(2),
      target_tempo: tempo.toFixed(1)
    });

  try {
    let tracks: any[] = [];

    // 1) Primär: seedTrack + Targets
    const primaryParams = buildParams(seed);
    try {
      const data = await spotifyGet<any>('/recommendations?' + primaryParams.toString());
      tracks = data?.tracks ?? [];
    } catch (err) {
      console.error('VIBE primary failed', err);
    }

    // 2) Fallback: seedTrack ohne Targets (nur limit/market), falls leer
    if ((!Array.isArray(tracks) || tracks.length === 0) && seedTrack) {
      try {
        const simple = new URLSearchParams({ seed_tracks: seedTrack, limit: String(limit), market: 'US' });
        const data = await spotifyGet<any>('/recommendations?' + simple.toString());
        tracks = data?.tracks ?? [];
      } catch (err) {
        console.error('VIBE seed-only failed', err);
      }
    }

    // 3) Fallback: pop Genre
    if ((!Array.isArray(tracks) || tracks.length === 0)) {
      try {
        const fallbackParams = new URLSearchParams({ seed_genres: 'pop', limit: String(limit), market: 'US' });
        const data = await spotifyGet<any>('/recommendations?' + fallbackParams.toString());
        tracks = data?.tracks ?? [];
      } catch (err) {
        console.error('VIBE fallback failed', err);
        tracks = [];
      }
    }

    return json(Array.isArray(tracks) ? tracks : []);
  } catch (error) {
    console.error('VIBE MATCH FAILED', error);
    // Schicke leeres Array statt 500, damit UI nicht abbricht
    return json([]);
  }
};
