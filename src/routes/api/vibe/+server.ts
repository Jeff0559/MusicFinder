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
    const primaryParams = buildParams(seed);
    let data = await spotifyGet<any>('/recommendations?' + primaryParams.toString());
    let tracks = data?.tracks ?? [];

    // Fallback: wenn leer oder nicht vorhanden, probiere mit pop (nur wenn kein seedTrack gesetzt ist)
    if ((!Array.isArray(tracks) || tracks.length === 0) && !seedTrack) {
      const fallbackParams = buildParams('pop');
      data = await spotifyGet<any>('/recommendations?' + fallbackParams.toString());
      tracks = data?.tracks ?? [];
    }

    return json(tracks);
  } catch (error) {
    console.error('VIBE MATCH FAILED', error);
    return json({ error: 'Failed to match vibe', detail: (error as Error)?.message ?? String(error) }, { status: 500 });
  }
};
