import type { RequestHandler } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q') ?? '';
  const type = (url.searchParams.get('type') ?? 'track').toLowerCase();
  if (!q) return new Response(JSON.stringify({ error: 'Fehlender ?q=' }), { status: 400 });

  const params = new URLSearchParams({ q, type, limit: '20', market: 'CH' });
  try {
    // spotifyGet expects a path (it prefixes the base URL), so pass a relative endpoint
    const data = await spotifyGet<any>('/search?' + params.toString());
    if (type === 'album') return new Response(JSON.stringify(data.albums?.items ?? []));
    if (type === 'artist') return new Response(JSON.stringify(data.artists?.items ?? []));
    return new Response(JSON.stringify(data.tracks?.items ?? []));
  } catch (e: any) {
    console.error('SEARCH ERROR', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500 });
  }
};
