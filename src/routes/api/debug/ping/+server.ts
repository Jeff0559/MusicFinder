import type { RequestHandler } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';

export const GET: RequestHandler = async () => {
  try {
    const me = await spotifyGet<any>('/search?q=drake&type=track&limit=1&market=US');
    return new Response(JSON.stringify({ ok: true, example: me?.tracks?.items?.length ?? 0 }));
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), { status: 500 });
  }
};
