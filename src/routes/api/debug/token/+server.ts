import type { RequestHandler } from '@sveltejs/kit';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify({
    hasClientId: !!SPOTIFY_CLIENT_ID,
    hasSecret: !!SPOTIFY_CLIENT_SECRET
  }));
};
