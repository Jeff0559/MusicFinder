import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify({
    hasClientId: !!env.SPOTIFY_CLIENT_ID,
    hasSecret: !!env.SPOTIFY_CLIENT_SECRET
  }));
};
